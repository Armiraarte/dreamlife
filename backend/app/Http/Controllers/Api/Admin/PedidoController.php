<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PedidoResource;
use App\Mail\PedidoEnviadoMail;
use App\Models\Pedido;
use App\Services\Notificador;
use App\Services\PaymentSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PedidoController extends Controller
{
    /** GET /api/admin/orders  (?status=PAGADO&search=texto) */
    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in(Pedido::ESTATUS)],
            'search' => ['nullable', 'string', 'max:120'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $pedidos = Pedido::query()
            ->with('items.variante.producto.fotos', 'entrega', 'usuario', 'ultimoPago')
            ->when($data['status'] ?? null, fn ($q, $s) => $q->where('estatus_pedido', $s))
            ->when($data['search'] ?? null, function ($q, $s) {
                $id = (int) preg_replace('/\D/', '', $s);
                $q->where(function ($q) use ($s, $id) {
                    $q->where('tracking_number', $s)
                        ->orWhereHas('usuario', fn ($u) => $u->where('email', 'like', "%{$s}%")->orWhere('nombre', 'like', "%{$s}%"))
                        ->orWhereHas('entrega', fn ($e) => $e->where('destinatario', 'like', "%{$s}%"));
                    if ($id > 0) {
                        $q->orWhere('idPedido', $id);
                    }
                });
            })
            ->orderByDesc('idPedido')
            ->limit($data['limit'] ?? 200)
            ->get();

        return PedidoResource::collection($pedidos);
    }

    /**
     * PATCH /api/admin/orders/{pedido}
     * { status?, tracking_number?, shipping_carrier?, tracking_url?, notify? }
     * Al pasar a ENVIADO con guia se envia el correo al cliente.
     */
    public function update(Request $request, Pedido $pedido, PaymentSyncService $pagos): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in(Pedido::ESTATUS)],
            'tracking_number' => [
                'nullable', 'string', 'max:120',
                Rule::unique('pedidos', 'tracking_number')->ignore($pedido->idPedido, 'idPedido'),
            ],
            'shipping_carrier' => ['nullable', 'string', 'max:120'],
            'tracking_url' => ['nullable', 'url:http,https', 'max:500'],
            'notify' => ['nullable', 'boolean'],
        ]);

        $nuevo = $data['status'] ?? $pedido->estatus_pedido;

        if ($pedido->estatus_pedido === Pedido::CANCELADO && $nuevo !== Pedido::CANCELADO) {
            return response()->json(['message' => 'Un pedido cancelado no se puede reactivar.'], 422);
        }
        if ($nuevo === Pedido::ENVIADO && empty($data['tracking_number']) && ! $pedido->tracking_number) {
            return response()->json(['message' => 'Para marcar como enviado captura el numero de guia.'], 422);
        }

        $eraEnviado = $pedido->estatus_pedido === Pedido::ENVIADO;
        $guiaAnterior = $pedido->tracking_number;

        DB::transaction(function () use ($pedido, $data, $nuevo, $pagos) {
            $pedido->loadMissing('items.variante');

            if ($nuevo === Pedido::CANCELADO && $pedido->estatus_pedido !== Pedido::CANCELADO && $pedido->paid_at) {
                // El pago ya habia descontado inventario: se regresa.
                $pagos->devolverStock($pedido);
            }

            $pedido->fill(array_filter([
                'tracking_number' => $data['tracking_number'] ?? null,
                'shipping_carrier' => $data['shipping_carrier'] ?? null,
                'tracking_url' => $data['tracking_url'] ?? null,
            ], fn ($v) => $v !== null && $v !== ''));

            $pedido->estatus_pedido = $nuevo;
            if ($nuevo === Pedido::ENVIADO && ! $pedido->shipped_at) {
                $pedido->shipped_at = now();
            }
            if ($nuevo === Pedido::ENTREGADO && ! $pedido->delivered_at) {
                $pedido->delivered_at = now();
            }
            $pedido->save();
        });

        $pedido->load('items.variante.producto.fotos', 'entrega', 'usuario', 'ultimoPago');

        $correoEnviado = false;
        $debeNotificar = $nuevo === Pedido::ENVIADO
            && ($data['notify'] ?? true)
            && (! $eraEnviado || $guiaAnterior !== $pedido->tracking_number);
        if ($debeNotificar) {
            $correoEnviado = Notificador::enviar($pedido, new PedidoEnviadoMail($pedido));
        }

        return response()->json(
            (new PedidoResource($pedido))->resolve($request) + ['email_sent' => $correoEnviado]
        );
    }
}
