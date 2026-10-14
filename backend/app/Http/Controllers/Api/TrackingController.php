<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PedidoPublicoResource;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;

class TrackingController extends Controller
{
    /** GET /api/orders/track/{guia} — rastreo publico por numero de guia. */
    public function show(string $guia): JsonResponse|PedidoPublicoResource
    {
        $pedido = Pedido::where('tracking_number', trim($guia))
            ->with('items.variante.producto.fotos', 'entrega', 'usuario')
            ->first();

        if (! $pedido) {
            return response()->json(['message' => 'No encontramos un pedido con esa guia.'], 404);
        }

        return new PedidoPublicoResource($pedido);
    }
}
