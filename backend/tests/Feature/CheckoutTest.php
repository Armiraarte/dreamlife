<?php

namespace Tests\Feature;

use App\Mail\PedidoConfirmadoMail;
use App\Models\Pedido;
use App\Models\ProductoVariante;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_el_precio_sale_de_la_bd_y_no_del_cliente(): void
    {
        $this->fakeMercadoPago();

        $payload = $this->checkoutPayload();
        // Un atacante intenta mandar su propio precio/total: se ignoran.
        $payload['items'][0]['precio'] = 1;
        $payload['total'] = 1;

        $res = $this->postJson('/api/checkout', $payload)
            ->assertCreated()
            ->assertJsonPath('total', 1980)
            ->assertJsonPath('init_point', 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=pref-123');

        $pedido = Pedido::firstOrFail();
        $this->assertSame('1980.00', $pedido->total);
        $this->assertSame(Pedido::CREADO, $pedido->estatus_pedido);
        $this->assertSame('pref-123', $pedido->preference_id);
        $this->assertSame($pedido->external_reference, $res->json('reference'));

        Http::assertSent(function (Request $request) use ($pedido) {
            if (! str_contains($request->url(), '/checkout/preferences')) {
                return false;
            }

            return $request['items'][0]['unit_price'] === 990.0
                && $request['items'][0]['quantity'] === 2
                && $request['external_reference'] === $pedido->external_reference
                && str_contains($request['back_urls']['success'], '/#/order-confirmation/');
        });

        // El stock no se toca hasta que el pago se aprueba.
        $this->assertSame(20, ProductoVariante::find(2)->stock);
    }

    public function test_rechaza_cantidades_mayores_al_stock(): void
    {
        $this->fakeMercadoPago();

        $this->postJson('/api/checkout', $this->checkoutPayload(['items' => [['idVariante' => 1, 'cantidad' => 10], ['idVariante' => 1, 'cantidad' => 1]]]))
            ->assertUnprocessable();

        $this->assertSame(0, Pedido::count());
    }

    public function test_valida_datos_de_entrega(): void
    {
        $payload = $this->checkoutPayload();
        unset($payload['entrega']['calle']);
        $payload['entrega']['cp'] = 'abc';

        $this->postJson('/api/checkout', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['entrega.calle', 'entrega.cp']);
    }

    public function test_pago_aprobado_marca_pagado_descuenta_stock_y_envia_correo_una_sola_vez(): void
    {
        Mail::fake();
        $this->fakeMercadoPago();
        $ref = $this->postJson('/api/checkout', $this->checkoutPayload())->json('reference');

        $this->fakeMercadoPago([
            'id' => 555, 'status' => 'approved', 'status_detail' => 'accredited',
            'external_reference' => $ref, 'transaction_amount' => 1980.0, 'currency_id' => 'MXN',
            'payment_method_id' => 'visa', 'payment_type_id' => 'credit_card', 'installments' => 1,
        ]);

        $this->postJson('/api/checkout/confirm', ['reference' => $ref, 'payment_id' => '555'])
            ->assertOk()
            ->assertJsonPath('status', 'PAGADO')
            ->assertJsonPath('email', '')
            ->assertJsonPath('address', 'Guadalajara, Jalisco');

        // Segunda llamada (o webhook repetido): no vuelve a descontar.
        $this->postJson('/api/checkout/confirm', ['reference' => $ref, 'payment_id' => '555'])->assertOk();
        $this->postJson('/api/webhooks/mercadopago?type=payment&data.id=555', ['type' => 'payment', 'data' => ['id' => '555']])->assertOk();

        $pedido = Pedido::firstOrFail();
        $this->assertSame(Pedido::PAGADO, $pedido->estatus_pedido);
        $this->assertSame(Pedido::PAGO_APROBADO, $pedido->estatus_pago);
        $this->assertNotNull($pedido->paid_at);
        $this->assertSame(18, ProductoVariante::find(2)->stock);
        $this->assertSame(1, $pedido->pagos()->count());

        Mail::assertSent(PedidoConfirmadoMail::class, 1);
        Mail::assertSent(PedidoConfirmadoMail::class, fn ($m) => $m->hasTo('ana@example.com') && $m->hasBcc('admin@dreamlife.test'));
    }

    public function test_pago_de_otro_pedido_no_confirma(): void
    {
        $this->fakeMercadoPago();
        $ref = $this->postJson('/api/checkout', $this->checkoutPayload())->json('reference');

        $this->fakeMercadoPago([
            'id' => 777, 'status' => 'approved', 'external_reference' => 'otro-pedido',
            'transaction_amount' => 1980.0, 'currency_id' => 'MXN',
        ]);

        $this->postJson('/api/checkout/confirm', ['reference' => $ref, 'payment_id' => '777'])
            ->assertOk()
            ->assertJsonPath('status', 'CREADO');
    }

    public function test_pago_con_monto_menor_no_marca_pagado(): void
    {
        $this->fakeMercadoPago();
        $ref = $this->postJson('/api/checkout', $this->checkoutPayload())->json('reference');

        $this->fakeMercadoPago([
            'id' => 556, 'status' => 'approved', 'external_reference' => $ref,
            'transaction_amount' => 1.0, 'currency_id' => 'MXN',
        ]);

        $this->postJson('/api/checkout/confirm', ['reference' => $ref, 'payment_id' => '556'])
            ->assertOk()
            ->assertJsonPath('status', 'CREADO');

        $this->assertSame(20, ProductoVariante::find(2)->stock);
        $this->assertStringContainsString('no coincide', Pedido::first()->notas);
    }

    public function test_reembolso_regresa_el_stock(): void
    {
        Mail::fake();
        $this->fakeMercadoPago();
        $ref = $this->postJson('/api/checkout', $this->checkoutPayload())->json('reference');

        $pago = ['id' => 600, 'status' => 'approved', 'external_reference' => $ref, 'transaction_amount' => 1980.0, 'currency_id' => 'MXN'];
        $this->fakeMercadoPago($pago);
        $this->postJson('/api/checkout/confirm', ['reference' => $ref, 'payment_id' => '600']);
        $this->assertSame(18, ProductoVariante::find(2)->stock);

        $this->fakeMercadoPago(['status' => 'refunded'] + $pago);
        $this->postJson('/api/webhooks/mercadopago', ['type' => 'payment', 'data' => ['id' => '600']])->assertOk();

        $this->assertSame(20, ProductoVariante::find(2)->stock);
        $this->assertSame(Pedido::CANCELADO, Pedido::first()->estatus_pedido);
    }

    public function test_webhook_con_secreto_exige_firma_valida(): void
    {
        config(['services.mercadopago.webhook_secret' => 'secreto']);
        $this->app->forgetInstance(\App\Services\MercadoPagoClient::class);
        $this->fakeMercadoPago();

        $this->postJson('/api/webhooks/mercadopago?data.id=123&type=payment', ['type' => 'payment', 'data' => ['id' => '123']], [
            'x-signature' => 'ts=1,v1=firma-falsa', 'x-request-id' => 'abc',
        ])->assertUnauthorized();

        $firma = hash_hmac('sha256', 'id:123;request-id:abc;ts:1;', 'secreto');
        $this->postJson('/api/webhooks/mercadopago?data.id=123&type=payment', ['type' => 'payment', 'data' => ['id' => '123']], [
            'x-signature' => "ts=1,v1={$firma}", 'x-request-id' => 'abc',
        ])->assertOk();
    }
}
