<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Producto con sus variantes activas y fotos. Mantiene los nombres de campo
 * que ya usaba el frontend (get_info_producto.php).
 *
 * @mixin \App\Models\Producto
 */
class ProductoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $fotos = $this->whenLoaded('fotos', fn () => $this->fotos->map(fn ($f) => [
            'idFoto' => $f->idFoto,
            'url' => $f->url,
            'alt_text' => $f->alt_text,
            'orden' => $f->orden,
            'is_principal' => $f->is_principal,
        ])->values(), []);

        return [
            'idProducto' => $this->idProducto,
            'sku_base' => $this->sku_base,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'precio' => (float) $this->precio,
            'categoria' => $this->categoria,
            'detalles' => $this->detalles_json ?: (object) [],
            'variantes' => $this->variantes
                ->where('is_active', true)
                ->sortBy('orden')
                ->map(fn ($v) => [
                    'idVariante' => $v->idVariante,
                    'talla' => $v->talla,
                    'color' => $v->color,
                    'sku' => $v->sku,
                    'stock' => $v->stock,
                    'precio' => $v->precio_override !== null ? (float) $v->precio_override : (float) $this->precio,
                ])->values(),
            'fotos' => $fotos,
            'foto_principal' => collect($fotos)->first(),
        ];
    }
}
