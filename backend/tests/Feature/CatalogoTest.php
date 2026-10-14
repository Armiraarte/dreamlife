<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogoTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_lista_productos_con_variantes_y_fotos(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.nombre', "GOD'S PLAN OVERSIZED TEE")
            ->assertJsonPath('0.precio', 990)
            ->assertJsonCount(3, '0.variantes')
            ->assertJsonCount(6, '0.fotos')
            ->assertJsonPath('0.foto_principal.url', '/images/playera.jpeg');
    }

    public function test_modo_lite_omite_fotos(): void
    {
        $this->getJson('/api/products?lite=1')
            ->assertOk()
            ->assertJsonCount(0, '0.fotos');
    }

    public function test_producto_inexistente_devuelve_404_json(): void
    {
        $this->getJson('/api/products/999')->assertNotFound();
    }
}
