<?php

namespace Tests\Feature;

use App\Mail\PedidoEnviadoMail;
use App\Models\AdminUsuario;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\ProductoVariante;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_endpoints_de_admin_requieren_token(): void
    {
        $this->getJson('/api/admin/orders')->assertUnauthorized();
        $this->patchJson('/api/admin/orders/1', ['status' => 'ENVIADO'])->assertUnauthorized();
        $this->postJson('/api/admin/products', [])->assertUnauthorized();
        $this->getJson('/api/admin/orders', ['Authorization' => 'Bearer 1|token-falso'])->assertUnauthorized();
        // Sin Accept: application/json (p. ej. desde el navegador) tambien es 401 JSON, no un redirect.
        $this->get('/api/admin/orders')->assertUnauthorized()->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_login_correcto_e_incorrecto(): void
    {
        AdminUsuario::create(['usuario' => 'admin', 'password_hash' => Hash::make('clave-segura-123'), 'is_active' => true]);

        $this->postJson('/api/admin/login', ['usuario' => 'admin', 'clave' => 'mala'])->assertUnauthorized();

        $token = $this->postJson('/api/admin/login', ['usuario' => 'admin', 'clave' => 'clave-segura-123'])
            ->assertOk()
            ->json('token');

        $this->getJson('/api/admin/me', ['Authorization' => "Bearer {$token}"])
            ->assertOk()
            ->assertJsonPath('usuario', 'admin');

        $this->postJson('/api/admin/logout', [], ['Authorization' => "Bearer {$token}"])->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/admin/me', ['Authorization' => "Bearer {$token}"])->assertUnauthorized();
    }

    public function test_admin_inactivo_no_entra(): void
    {
        AdminUsuario::create(['usuario' => 'viejo', 'password_hash' => Hash::make('clave-segura-123'), 'is_active' => false]);

        $this->postJson('/api/admin/login', ['usuario' => 'viejo', 'clave' => 'clave-segura-123'])->assertForbidden();
    }

    public function test_enviar_pedido_guarda_guia_y_manda_correo(): void
    {
        Mail::fake();
        $headers = ['Authorization' => 'Bearer '.$this->adminToken()];
        $pedido = $this->crearPedidoPagado();

        $this->patchJson("/api/admin/orders/{$pedido->idPedido}", ['status' => 'ENVIADO'], $headers)
            ->assertUnprocessable();

        $this->patchJson("/api/admin/orders/{$pedido->idPedido}", [
            'status' => 'ENVIADO',
            'tracking_number' => 'GUIA123',
            'shipping_carrier' => 'Estafeta',
        ], $headers)
            ->assertOk()
            ->assertJsonPath('status', 'ENVIADO')
            ->assertJsonPath('trackingNumber', 'GUIA123')
            ->assertJsonPath('email_sent', true);

        Mail::assertSent(PedidoEnviadoMail::class, fn ($m) => $m->hasTo('ana@example.com'));
        $this->assertNotNull($pedido->fresh()->shipped_at);

        // Rastreo publico: no expone correo ni calle.
        $this->getJson('/api/orders/track/GUIA123')
            ->assertOk()
            ->assertJsonPath('status', 'ENVIADO')
            ->assertJsonPath('email', '')
            ->assertJsonPath('customer', 'Ana')
            ->assertJsonMissingPath('shipping');
        $this->getJson('/api/orders/track/NOEXISTE')->assertNotFound();
    }

    public function test_cancelar_pedido_pagado_regresa_stock_y_no_se_reactiva(): void
    {
        $headers = ['Authorization' => 'Bearer '.$this->adminToken()];
        $pedido = $this->crearPedidoPagado();
        $this->assertSame(18, ProductoVariante::find(2)->stock);

        $this->patchJson("/api/admin/orders/{$pedido->idPedido}", ['status' => 'CANCELADO'], $headers)->assertOk();
        $this->assertSame(20, ProductoVariante::find(2)->stock);

        $this->patchJson("/api/admin/orders/{$pedido->idPedido}", ['status' => 'PAGADO'], $headers)->assertUnprocessable();
    }

    public function test_listado_y_busqueda_de_pedidos(): void
    {
        $headers = ['Authorization' => 'Bearer '.$this->adminToken()];
        $this->crearPedidoPagado();

        $this->getJson('/api/admin/orders', $headers)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.email', 'ana@example.com')
            ->assertJsonPath('0.items.0.size', 'M');

        $this->getJson('/api/admin/orders?search=noexiste@x.com', $headers)->assertOk()->assertJsonCount(0);
        $this->getJson('/api/admin/orders?status=ENVIADO', $headers)->assertOk()->assertJsonCount(0);
    }

    public function test_crear_y_actualizar_producto(): void
    {
        $headers = ['Authorization' => 'Bearer '.$this->adminToken()];
        $datos = [
            'sku_base' => 'HD-BLK-V1',
            'nombre' => 'Hoodie Negra',
            'precio' => 1490,
            'categoria' => 'Hoodies',
            'descripcion' => 'Hoodie heavyweight',
            'color' => 'Black',
            'stock' => ['S' => 5, 'M' => 0, 'L' => 3],
            'imagenes' => ['/images/img1.jpg', 'https://cdn.example.com/h2.jpg'],
        ];

        $this->postJson('/api/admin/products', $datos, $headers)
            ->assertCreated()
            ->assertJsonPath('categoria', 2)
            ->assertJsonCount(3, 'variantes')
            ->assertJsonCount(2, 'fotos');

        $this->postJson('/api/admin/products', ['precio' => 1290, 'stock' => ['S' => 9]] + $datos, $headers)->assertOk();

        $producto = Producto::where('sku_base', 'HD-BLK-V1')->firstOrFail();
        $this->assertSame('1290.00', $producto->precio);
        $this->assertSame(9, $producto->variantes()->where('talla', 'S')->value('stock'));
        $this->assertSame(1, Producto::where('sku_base', 'HD-BLK-V1')->count());

        $this->postJson('/api/admin/products', ['imagenes' => ['javascript:alert(1)']] + $datos, $headers)
            ->assertUnprocessable();
    }

    private function crearPedidoPagado(): Pedido
    {
        Mail::fake();
        $this->fakeMercadoPago();
        $ref = $this->postJson('/api/checkout', $this->checkoutPayload())->json('reference');
        $this->fakeMercadoPago([
            'id' => 900, 'status' => 'approved', 'external_reference' => $ref,
            'transaction_amount' => 1980.0, 'currency_id' => 'MXN',
        ]);
        $this->postJson('/api/checkout/confirm', ['reference' => $ref, 'payment_id' => '900'])->assertJsonPath('status', 'PAGADO');

        return Pedido::where('external_reference', $ref)->firstOrFail();
    }
}
