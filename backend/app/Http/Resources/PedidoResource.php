<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Pedido completo (admin y "mis pedidos" del cliente).
 * El campo status es el estatus de BD (CREADO, PAGADO, ENVIADO, ENTREGADO, CANCELADO).
 *
 * @mixin \App\Models\Pedido
 */
class PedidoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $entrega = $this->entrega;

        return [
            'id' => (string) $this->idPedido,
            'orderNumber' => $this->numero(),
            'reference' => $this->external_reference,
            'customer' => $entrega?->destinatario ?: ($this->usuario?->nombre ?: 'Cliente'),
            'email' => $this->usuario?->email ?? '',
            'phone' => $entrega?->telefono ?: ($this->usuario?->telefono ?? ''),
            'subtotal' => (float) $this->subtotal,
            'shippingCost' => (float) $this->costo_envio,
            'total' => (float) $this->total,
            'status' => $this->estatus_pedido,
            'paymentStatus' => $this->estatus_pago,
            'date' => $this->created_at?->toIso8601String(),
            'paidAt' => $this->paid_at?->toIso8601String(),
            'shippedAt' => $this->shipped_at?->toIso8601String(),
            'deliveredAt' => $this->delivered_at?->toIso8601String(),
            'address' => $entrega?->direccion() ?? '',
            'shipping' => $entrega ? [
                'cp' => $entrega->cp,
                'estado' => $entrega->estado,
                'ciudad' => $entrega->ciudad,
                'colonia' => $entrega->colonia,
                'calle' => $entrega->calle,
                'num_ext' => $entrega->num_ext,
                'num_int' => $entrega->num_int,
                'entre_calles' => $entrega->entre_calles,
            ] : null,
            'paymentId' => $this->ultimoPago?->payment_id ?? '',
            'preferenceId' => $this->preference_id ?? '',
            'trackingNumber' => $this->tracking_number ?? '',
            'shippingCarrier' => $this->shipping_carrier ?? '',
            'trackingUrl' => $this->tracking_url ?? '',
            'notes' => $this->when($request->user() !== null, $this->notas),
            'items' => PedidoItemResource::collection($this->items),
        ];
    }
}
