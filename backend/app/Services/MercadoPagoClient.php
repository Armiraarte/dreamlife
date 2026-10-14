<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Cliente minimo de la API de Mercado Pago (Checkout Pro).
 */
class MercadoPagoClient
{
    public function __construct(
        private readonly ?string $accessToken,
        private readonly ?string $webhookSecret,
        private readonly string $baseUrl = 'https://api.mercadopago.com',
    ) {
    }

    public function isConfigured(): bool
    {
        return (bool) $this->accessToken;
    }

    /**
     * Crea una preferencia de pago y devuelve la respuesta de MP (id, init_point, ...).
     */
    public function createPreference(array $preference): array
    {
        $response = $this->http()->post('/checkout/preferences', $preference);

        if ($response->failed()) {
            throw new RuntimeException('Mercado Pago rechazo la preferencia: '.$response->body());
        }

        return $response->json();
    }

    /**
     * Consulta un pago. Devuelve null si no existe.
     */
    public function getPayment(string $paymentId): ?array
    {
        $response = $this->http()->get('/v1/payments/'.rawurlencode($paymentId));

        if ($response->status() === 404) {
            return null;
        }
        if ($response->failed()) {
            throw new RuntimeException('No se pudo consultar el pago en Mercado Pago (HTTP '.$response->status().').');
        }

        return $response->json();
    }

    /**
     * Valida el header x-signature de un webhook.
     * https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
     *
     * Si no hay secreto configurado no se puede validar y se acepta; de todos
     * modos el pago siempre se vuelve a consultar en la API antes de usarlo.
     */
    public function hasValidSignature(Request $request, string $dataId): bool
    {
        if (! $this->webhookSecret) {
            return true;
        }

        $signature = (string) $request->header('x-signature', '');
        $requestId = (string) $request->header('x-request-id', '');

        $parts = [];
        foreach (explode(',', $signature) as $chunk) {
            [$key, $value] = array_pad(explode('=', trim($chunk), 2), 2, null);
            if ($key !== null && $value !== null) {
                $parts[$key] = $value;
            }
        }
        if (empty($parts['ts']) || empty($parts['v1'])) {
            return false;
        }

        $id = ctype_alnum($dataId) ? strtolower($dataId) : $dataId;
        $manifest = "id:{$id};";
        if ($requestId !== '') {
            $manifest .= "request-id:{$requestId};";
        }
        $manifest .= "ts:{$parts['ts']};";

        $expected = hash_hmac('sha256', $manifest, $this->webhookSecret);

        return hash_equals($expected, $parts['v1']);
    }

    private function http(): PendingRequest
    {
        if (! $this->accessToken) {
            throw new RuntimeException('MP_ACCESS_TOKEN no esta configurado.');
        }

        return Http::baseUrl($this->baseUrl)
            ->withToken($this->accessToken)
            ->acceptJson()
            ->timeout(15);
    }
}
