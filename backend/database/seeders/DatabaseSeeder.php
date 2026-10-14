<?php

namespace Database\Seeders;

use App\Models\AdminUsuario;
use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Datos iniciales (los mismos de bd/base_renovada.sql, sin la clave de admin fija).
 * Es idempotente: se puede correr varias veces.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Categoria::updateOrCreate(['idCategoria' => 1], [
            'nombre' => 'Playeras', 'slug' => 'playeras',
            'descripcion' => 'Categoria principal del drop actual.', 'is_active' => true,
        ]);
        Categoria::updateOrCreate(['idCategoria' => 2], [
            'nombre' => 'Hoodies', 'slug' => 'hoodies',
            'descripcion' => 'Categoria reservada para futuras prendas.', 'is_active' => true,
        ]);

        $galeria = ['/images/playera.jpeg', '/images/img5.jpg', '/images/img2.jpg', '/images/img3.jpg', '/images/img7.jpg', '/images/img4.jpg'];

        $producto = Producto::firstOrCreate(['sku_base' => 'GP-TEE-BLK-V1'], [
            'nombre' => "GOD'S PLAN OVERSIZED TEE",
            'slug' => 'gods-plan-oversized-tee',
            'descripcion' => 'El diseño captura ese instante entre el sacrificio y la gloria. La corona, símbolo de lo divino, se convierte en el reflejo de aquello que todos buscamos: propósito, poder y trascendencia.',
            'precio' => 990.00,
            'categoria' => 1,
            'imagen_principal' => $galeria[0],
            'galeria_json' => json_encode($galeria),
            'colores_json' => json_encode(['Black']),
            'tallas_json' => json_encode(['S', 'M', 'L']),
            'detalles_json' => [
                'Material' => '100% Algodón (305 grs)',
                'Corte' => 'Semi Oversized',
                'Tecnología' => '4 Tecnologías',
                'Propiedades' => 'Anti-ácaros, Tela fría, Antibacterial, Iones negativos',
            ],
            'stock_total' => 50,
            'is_active' => true,
        ]);

        if ($producto->wasRecentlyCreated) {
            foreach ([['S', 10], ['M', 20], ['L', 20]] as $i => [$talla, $stock]) {
                $producto->variantes()->create([
                    'talla' => $talla, 'color' => 'Black', 'sku' => "GP-TEE-BLK-V1-{$talla}",
                    'stock' => $stock, 'is_active' => true, 'orden' => $i + 1,
                ]);
            }
            $alts = ['portada', 'vista editorial', 'detalle', 'modelo', 'extra 1', 'extra 2'];
            foreach ($galeria as $i => $url) {
                $producto->fotos()->create([
                    'url' => $url, 'alt_text' => "GOD'S PLAN OVERSIZED TEE - {$alts[$i]}",
                    'orden' => $i + 1, 'is_principal' => $i === 0,
                ]);
            }
        }

        // Admin inicial solo si se define en el entorno (ADMIN_USER / ADMIN_PASSWORD).
        $usuario = env('ADMIN_USER');
        $clave = env('ADMIN_PASSWORD');
        if ($usuario && $clave && ! AdminUsuario::where('usuario', $usuario)->exists()) {
            AdminUsuario::create(['usuario' => $usuario, 'password_hash' => Hash::make($clave), 'is_active' => true]);
            $this->command?->info("Admin '{$usuario}' creado.");
        }
    }
}
