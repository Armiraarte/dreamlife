<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PedidoItem
 */
class PedidoItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $variante = $this->variante;
        $producto = $variante?->producto;

        return [
            'idVariante' => $this->idVariante,
            'productId' => $producto ? (string) $producto->idProducto : null,
            'title' => $producto?->nombre ?? 'Producto',
            'quantity' => $this->cantidad,
            'price' => (float) ($this->precio_unitario ?? $producto?->precio ?? 0),
            'subtotal' => (float) $this->subtotal,
            'size' => $variante?->talla ?? '',
            'color' => $variante?->color ?? '',
            'sku' => $variante?->sku,
            'image' => $producto?->relationLoaded('fotos') ? $producto->fotos->first()?->url : null,
        ];
    }
}
