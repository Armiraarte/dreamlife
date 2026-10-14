<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Vista publica de un pedido (rastreo por guia y pantalla de confirmacion).
 * No expone correo, telefono ni calle: solo ciudad y estado.
 *
 * @mixin \App\Models\Pedido
 */
class PedidoPublicoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $entrega = $this->entrega;
        $nombre = $entrega?->destinatario ?: ($this->usuario?->nombre ?: 'Cliente');

        return [
            'id' => (string) $this->idPedido,
            'orderNumber' => $this->numero(),
            // Solo el primer nombre.
            'customer' => strtok($nombre, ' ') ?: 'Cliente',
            'email' => '',
            'phone' => '',
            'total' => (float) $this->total,
            'status' => $this->estatus_pedido,
            'paymentStatus' => $this->estatus_pago,
            'date' => $this->created_at?->toIso8601String(),
            'address' => $entrega ? trim($entrega->ciudad.', '.$entrega->estado, ', ') : '',
            'trackingNumber' => $this->tracking_number ?? '',
            'shippingCarrier' => $this->shipping_carrier ?? '',
            'trackingUrl' => $this->tracking_url ?? '',
            'items' => PedidoItemResource::collection($this->items),
        ];
    }
}
