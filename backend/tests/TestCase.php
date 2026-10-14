<?php

namespace Tests;

use App\Models\AdminUsuario;
use App\Services\FirebaseTokenVerifier;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function checkoutPayload(array $overrides = []): array
    {
        return array_replace_recursive([
            'items' => [['idVariante' => 2, 'cantidad' => 2]],
            'cliente' => ['nombre' => 'Ana Lopez', 'email' => 'ana@example.com', 'telefono' => '3312345678'],
            'entrega' => [
                'cp' => '44100', 'estado' => 'Jalisco', 'ciudad' => 'Guadalajara',
                'colonia' => 'Centro', 'calle' => 'Av. Juarez', 'num_ext' => '123',
            ],
        ], $overrides);
    }

    private ?array $mpPayment = null;

    private bool $mpFaked = false;

    /**
     * Simula la API de Mercado Pago. $payment se devuelve en GET /v1/payments/{id};
     * se puede llamar varias veces para cambiar el pago simulado.
     */
    protected function fakeMercadoPago(?array $payment = null): void
    {
        $this->mpPayment = $payment;
        if ($this->mpFaked) {
            return;
        }
        $this->mpFaked = true;

        Http::fake([
            'api.mercadopago.com/checkout/preferences' => Http::response([
                'id' => 'pref-123',
                'init_point' => 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=pref-123',
            ], 201),
            'api.mercadopago.com/v1/payments/*' => fn () => $this->mpPayment
                ? Http::response($this->mpPayment)
                : Http::response(['message' => 'not found'], 404),
        ]);
    }

    protected function adminToken(): string
    {
        $admin = AdminUsuario::create([
            'usuario' => 'admin',
            'password_hash' => Hash::make('clave-segura-123'),
            'is_active' => true,
        ]);

        return $admin->createToken('admin', ['admin'])->plainTextToken;
    }

    /** Sustituye la verificacion de Firebase: el token "uid:email:verified" se acepta tal cual. */
    protected function fakeFirebase(): void
    {
        $this->app->instance(FirebaseTokenVerifier::class, new class(null) extends FirebaseTokenVerifier
        {
            public function verify(string $idToken): array
            {
                $parts = explode(':', $idToken);
                if (count($parts) !== 3) {
                    throw new RuntimeException('invalid');
                }

                return ['uid' => $parts[0], 'email' => $parts[1], 'email_verified' => $parts[2] === '1', 'name' => null];
            }
        });
    }
}
