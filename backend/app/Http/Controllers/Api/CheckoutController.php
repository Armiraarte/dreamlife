<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\PedidoPublicoResource;
use App\Models\Pedido;
use App\Services\CheckoutService;
use App\Services\PaymentSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CheckoutController extends Controller
{
    /**
     * POST /api/checkout
     * Crea el pedido (precios desde BD) y devuelve el init_point de Mercado Pago.
     */
    public function store(CheckoutRequest $request, CheckoutService $checkout): JsonResponse
    {
        try {
            $resultado = $checkout->checkout($request->validated(), $request->attributes->get('firebase_user'));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        return response()->json([
            'orderId' => (string) $resultado['pedido']->idPedido,
            'orderNumber' => $resultado['pedido']->numero(),
            'reference' => $resultado['pedido']->external_reference,
            'total' => (float) $resultado['pedido']->total,
            'init_point' => $resultado['init_point'],
        ], 201);
    }

    /**
     * POST /api/checkout/confirm  { reference, payment_id? }
     * Se llama al volver de Mercado Pago. Si viene payment_id se consulta el pago
     * en MP (por si el webhook aun no llega) y se devuelve el estado del pedido.
     */
    public function confirm(Request $request, PaymentSyncService $sync): JsonResponse|PedidoPublicoResource
    {
        $data = $request->validate([
            'reference' => ['required', 'uuid'],
            'payment_id' => ['nullable', 'regex:/^\d{1,20}$/'],
        ]);

        if (! empty($data['payment_id'])) {
            try {
                $sync->sync($data['payment_id'], $data['reference']);
            } catch (RuntimeException $e) {
                Log::warning('No se pudo sincronizar el pago al confirmar', ['error' => $e->getMessage()]);
            }
        }

        $pedido = Pedido::where('external_reference', $data['reference'])
            ->with('items.variante.producto.fotos', 'entrega', 'usuario')
            ->first();

        if (! $pedido) {
            return response()->json(['message' => 'Pedido no encontrado.'], 404);
        }

        return new PedidoPublicoResource($pedido);
    }
}
