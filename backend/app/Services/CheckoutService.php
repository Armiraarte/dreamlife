<?php

namespace App\Services;

use App\Models\Entrega;
use App\Models\Pedido;
use App\Models\ProductoVariante;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

/**
 * Crea el pedido con precios tomados de la base de datos y genera la
 * preferencia de Mercado Pago. El cliente nunca define precios ni totales.
 */
class CheckoutService
{
    public function __construct(private readonly MercadoPagoClient $mercadoPago)
    {
    }

    /**
     * @param  array  $data  Datos validados por CheckoutRequest.
     * @param  array|null  $firebaseUser  Claims del token de Firebase, si el cliente inicio sesion.
     * @return array{pedido: Pedido, init_point: string}
     */
    public function checkout(array $data, ?array $firebaseUser): array
    {
        if (! $this->mercadoPago->isConfigured()) {
            throw new RuntimeException('Los pagos no estan configurados (falta MP_ACCESS_TOKEN).');
        }

        $pedido = DB::transaction(fn () => $this->crearPedido($data, $firebaseUser));

        try {
            $preference = $this->mercadoPago->createPreference($this->buildPreference($pedido, $data));
        } catch (Throwable $e) {
            $pedido->update([
                'estatus_pedido' => Pedido::CANCELADO,
                'notas' => 'No se pudo crear la preferencia de pago.',
            ]);
            Log::error('Error creando preferencia de Mercado Pago', [
                'idPedido' => $pedido->idPedido,
                'error' => $e->getMessage(),
            ]);
            throw new RuntimeException('No se pudo iniciar el pago con Mercado Pago.', 0, $e);
        }

        $pedido->update(['preference_id' => $preference['id'] ?? null]);

        return [
            'pedido' => $pedido,
            'init_point' => (string) ($preference['init_point'] ?? ''),
        ];
    }

    private function crearPedido(array $data, ?array $firebaseUser): Pedido
    {
        // Agrupa renglones repetidos de la misma variante.
        $cantidades = [];
        foreach ($data['items'] as $item) {
            $id = (int) $item['idVariante'];
            $cantidades[$id] = ($cantidades[$id] ?? 0) + (int) $item['cantidad'];
        }

        $variantes = ProductoVariante::with('producto')
            ->whereIn('idVariante', array_keys($cantidades))
            ->lockForUpdate()
            ->get()
            ->keyBy('idVariante');

        $errores = [];
        $renglones = [];
        $subtotal = 0.0;

        foreach ($cantidades as $idVariante => $cantidad) {
            $variante = $variantes->get($idVariante);

            if (! $variante || ! $variante->is_active || ! $variante->producto?->is_active) {
                $errores["items.{$idVariante}"] = 'Uno de los productos ya no esta disponible.';
                continue;
            }
            if ($variante->stock < $cantidad) {
                $errores["items.{$idVariante}"] = sprintf(
                    'Solo quedan %d piezas de %s talla %s.',
                    $variante->stock,
                    $variante->producto->nombre,
                    $variante->talla,
                );
                continue;
            }

            $precio = round($variante->precioUnitario(), 2);
            $lineTotal = round($precio * $cantidad, 2);
            $subtotal += $lineTotal;

            $renglones[] = [
                'idVariante' => $idVariante,
                'cantidad' => $cantidad,
                'precio_unitario' => $precio,
                'subtotal' => $lineTotal,
            ];
        }

        if ($errores) {
            throw ValidationException::withMessages($errores);
        }

        $costoEnvio = 0.0;
        $usuario = $this->resolverUsuario($data['cliente'], $firebaseUser);

        $pedido = Pedido::create([
            'idUsuario' => $usuario->idUsuario,
            'subtotal' => round($subtotal, 2),
            'costo_envio' => $costoEnvio,
            'total' => round($subtotal + $costoEnvio, 2),
            'estatus_pedido' => Pedido::CREADO,
            'estatus_pago' => Pedido::PAGO_PENDIENTE,
            'external_reference' => (string) Str::uuid(),
        ]);

        $pedido->items()->createMany($renglones);

        $entrega = $data['entrega'];
        $pedido->entrega()->save(new Entrega([
            'destinatario' => $data['cliente']['nombre'],
            'telefono' => $data['cliente']['telefono'] ?? null,
            'cp' => $entrega['cp'],
            'estado' => $entrega['estado'],
            'ciudad' => $entrega['ciudad'],
            'colonia' => $entrega['colonia'],
            'calle' => $entrega['calle'],
            'num_ext' => $entrega['num_ext'],
            'num_int' => $entrega['num_int'] ?? null,
            'entre_calles' => $entrega['entre_calles'] ?? null,
        ]));

        return $pedido->load('items.variante.producto.fotos', 'entrega', 'usuario');
    }

    /**
     * Encuentra o crea el cliente. Nunca sobrescribe nombre/telefono de un
     * cliente existente con datos de un checkout sin autenticar.
     */
    private function resolverUsuario(array $cliente, ?array $firebaseUser): Usuario
    {
        $email = strtolower(trim($cliente['email']));

        if ($firebaseUser) {
            $usuario = Usuario::where('auth_provider', 'firebase')
                ->where('auth_uid', $firebaseUser['uid'])
                ->first();
            if ($usuario) {
                $usuario->fill(array_filter([
                    'nombre' => $usuario->nombre ?: $cliente['nombre'],
                    'telefono' => $usuario->telefono ?: ($cliente['telefono'] ?? null),
                ]))->save();

                return $usuario;
            }
        }

        $usuario = Usuario::where('email', $email)->first();
        if ($usuario) {
            // Vincula la cuenta de Firebase solo si el correo esta verificado y coincide.
            if ($firebaseUser
                && $firebaseUser['email_verified']
                && $firebaseUser['email'] === $email
                && ! $usuario->auth_uid) {
                $usuario->update(['auth_provider' => 'firebase', 'auth_uid' => $firebaseUser['uid']]);
            }

            return $usuario;
        }

        return Usuario::create([
            'auth_provider' => $firebaseUser ? 'firebase' : 'guest',
            'auth_uid' => $firebaseUser['uid'] ?? null,
            'usuario' => $cliente['nombre'],
            'nombre' => $cliente['nombre'],
            'email' => $email,
            'telefono' => $cliente['telefono'] ?? null,
        ]);
    }

    private function buildPreference(Pedido $pedido, array $data): array
    {
        $frontend = config('services.frontend.url');
        $currency = config('services.mercadopago.currency');
        $ref = $pedido->external_reference;

        $items = $pedido->items->map(function ($item) use ($currency, $frontend) {
            $variante = $item->variante;
            $foto = $variante->producto->fotos->first()?->url;

            return array_filter([
                'id' => $variante->sku,
                'title' => $variante->producto->nombre,
                'description' => "Talla: {$variante->talla} - Color: {$variante->color}",
                'picture_url' => $foto ? $this->absoluteUrl($foto, $frontend) : null,
                'category_id' => 'fashion',
                'quantity' => $item->cantidad,
                'currency_id' => $currency,
                'unit_price' => (float) $item->precio_unitario,
            ], fn ($v) => $v !== null);
        })->values()->all();

        $phone = preg_replace('/\D/', '', (string) ($data['cliente']['telefono'] ?? ''));
        $phone = strlen($phone) > 10 ? substr($phone, -10) : $phone;

        // La app usa HashRouter, por eso las rutas van despues de "#/".
        $preference = [
            'items' => $items,
            'payer' => array_filter([
                'name' => $data['cliente']['nombre'],
                'email' => strtolower($data['cliente']['email']),
                'phone' => strlen($phone) >= 8
                    ? ['area_code' => substr($phone, 0, 2), 'number' => substr($phone, 2)]
                    : null,
            ]),
            'back_urls' => [
                'success' => "{$frontend}/#/order-confirmation/{$ref}",
                'pending' => "{$frontend}/#/order-confirmation/{$ref}",
                'failure' => "{$frontend}/#/checkout?status=failure",
            ],
            'external_reference' => $ref,
            'statement_descriptor' => 'DREAMLIFE',
            'metadata' => ['id_pedido' => $pedido->idPedido],
        ];

        // Mercado Pago solo acepta auto_return con URLs https.
        if (str_starts_with($frontend, 'https://')) {
            $preference['auto_return'] = 'approved';
        }

        $notificationUrl = config('services.mercadopago.notification_url')
            ?: rtrim((string) config('app.url'), '/').'/api/webhooks/mercadopago';
        if (str_starts_with($notificationUrl, 'https://')) {
            $preference['notification_url'] = $notificationUrl;
        }

        return $preference;
    }

    private function absoluteUrl(string $url, string $base): string
    {
        return str_starts_with($url, 'http') ? $url : $base.'/'.ltrim($url, '/');
    }
}
