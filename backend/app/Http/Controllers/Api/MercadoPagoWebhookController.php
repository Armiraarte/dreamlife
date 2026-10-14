<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MercadoPagoClient;
use App\Services\PaymentSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * POST /api/webhooks/mercadopago
 * Mercado Pago avisa que un pago cambio. Se consulta el pago en la API y se
 * actualiza el pedido. Responde 200 rapido para que MP no reintente de mas.
 */
class MercadoPagoWebhookController extends Controller
{
    public function __invoke(Request $request, MercadoPagoClient $mercadoPago, PaymentSyncService $sync): JsonResponse
    {
        $type = $request->input('type', $request->query('type', $request->query('topic')));
        $paymentId = (string) ($request->input('data.id') ?? $request->query('data_id') ?? $request->query('id') ?? '');

        if ($type !== 'payment' || ! preg_match('/^\d{1,20}$/', $paymentId)) {
            return response()->json(['ignored' => true]);
        }

        // El manifiesto de la firma usa data.id del query string.
        $signedId = (string) ($request->query('data_id') ?? $paymentId);
        if (! $mercadoPago->hasValidSignature($request, $signedId)) {
            Log::warning('Webhook de Mercado Pago con firma invalida', ['payment_id' => $paymentId]);

            return response()->json(['message' => 'Firma invalida.'], 401);
        }

        try {
            $sync->sync($paymentId);
        } catch (Throwable $e) {
            Log::error('Error procesando webhook de Mercado Pago', ['payment_id' => $paymentId, 'error' => $e->getMessage()]);

            // 500 para que Mercado Pago reintente mas tarde.
            return response()->json(['message' => 'Error temporal.'], 500);
        }

        return response()->json(['ok' => true]);
    }
}
