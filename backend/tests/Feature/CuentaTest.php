<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CuentaTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    protected function setUp(): void
    {
        parent::setUp();
        $this->fakeFirebase();
        $this->fakeMercadoPago();
    }

    public function test_requiere_token_de_firebase(): void
    {
        $this->getJson('/api/me/orders')->assertUnauthorized();
        $this->getJson('/api/me/orders', ['Authorization' => 'Bearer basura'])->assertUnauthorized();
    }

    public function test_perfil_toma_uid_y_correo_del_token(): void
    {
        $this->postJson('/api/me', ['nombre' => 'Ana', 'telefono' => '3312345678', 'email' => 'otro@x.com'], [
            'Authorization' => 'Bearer uid-ana:ana@example.com:1',
        ])->assertOk()->assertJsonPath('email', 'ana@example.com');

        $usuario = Usuario::firstOrFail();
        $this->assertSame('firebase', $usuario->auth_provider);
        $this->assertSame('uid-ana', $usuario->auth_uid);
    }

    public function test_cada_cliente_ve_solo_sus_pedidos(): void
    {
        $this->postJson('/api/checkout', $this->checkoutPayload(), ['Authorization' => 'Bearer uid-ana:ana@example.com:0'])->assertCreated();
        $this->postJson('/api/checkout', $this->checkoutPayload(['cliente' => ['email' => 'beto@example.com', 'nombre' => 'Beto']]))->assertCreated();

        $this->getJson('/api/me/orders', ['Authorization' => 'Bearer uid-ana:ana@example.com:0'])
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.email', 'ana@example.com')
            ->assertJsonMissingPath('0.notes');

        // Un correo NO verificado no da acceso a pedidos hechos como invitado con ese correo.
        $this->getJson('/api/me/orders', ['Authorization' => 'Bearer uid-intruso:beto@example.com:0'])
            ->assertOk()
            ->assertJsonCount(0);

        // Con el correo verificado si se ven.
        $this->getJson('/api/me/orders', ['Authorization' => 'Bearer uid-beto:beto@example.com:1'])
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_checkout_sin_sesion_no_sobrescribe_datos_del_cliente(): void
    {
        Usuario::create(['auth_provider' => 'firebase', 'auth_uid' => 'x', 'nombre' => 'Ana Original', 'email' => 'ana@example.com', 'telefono' => '111']);

        $this->postJson('/api/checkout', $this->checkoutPayload(['cliente' => ['nombre' => 'Hacker', 'telefono' => '999']]))->assertCreated();

        $usuario = Usuario::where('email', 'ana@example.com')->firstOrFail();
        $this->assertSame('Ana Original', $usuario->nombre);
        $this->assertSame('111', $usuario->telefono);
    }
}
