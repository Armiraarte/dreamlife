<?php

namespace App\Services;

use App\Mail\PedidoConfirmadoMail;
use App\Models\Pago;
use App\Models\Pedido;
use App\Models\ProductoVariante;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Sincroniza un pago de Mercado Pago con su pedido. Es la unica via por la
 * que un pedido pasa a PAGADO: el estado siempre se consulta en la API de MP,
 * nunca se toma de lo que mande el navegador. Es idempotente.
 */
class PaymentSyncService
{
    public function __construct(private readonly MercadoPagoClient $mercadoPago)
    {
    }

    /**
     * @param  string|null  $expectedReference  Si se indica, el pago debe pertenecer a ese pedido.
     */
    public function sync(string $paymentId, ?string $expectedReference = null): ?Pedido
    {
        $payment = $this->mercadoPago->getPayment($paymentId);
        if (! $payment) {
            return null;
        }

        $reference = (string) ($payment['external_reference'] ?? '');
        if ($reference === '' || ($expectedReference !== null && $reference !== $expectedReference)) {
            return null;
        }

        $enviarConfirmacion = false;

        $pedido = DB::transaction(function () use ($payment, $paymentId, $reference, &$enviarConfirmacion) {
            $pedido = Pedido::where('external_reference', $reference)->lockForUpdate()->first();
            if (! $pedido) {
                return null;
            }

            $this->guardarPago($pedido, $paymentId, $payment);

            $status = strtolower((string) ($payment['status'] ?? 'pending'));
            $yaPagado = $pedido->paid_at !== null;

            switch ($status) {
                case 'approved':
                    if ($yaPagado) {
                        break;
                    }
                    $monto = (float) ($payment['transaction_amount'] ?? 0);
                    $moneda = (string) ($payment['currency_id'] ?? '');
                    if ($monto + 0.01 < (float) $pedido->total || $moneda !== config('services.mercadopago.currency')) {
                        $pedido->update(['notas' => trim($pedido->notas."\nPago {$paymentId} aprobado por {$monto} {$moneda}; no coincide con el total. Revisar.")]);
                        Log::warning('Pago aprobado con monto distinto al total', ['idPedido' => $pedido->idPedido, 'payment' => $paymentId]);
                        break;
                    }
                    $this->descontarStock($pedido);
                    $pedido->update([
                        'estatus_pedido' => Pedido::PAGADO,
                        'estatus_pago' => Pedido::PAGO_APROBADO,
                        'paid_at' => now(),
                    ]);
                    $enviarConfirmacion = true;
                    break;

                case 'refunded':
                case 'charged_back':
                    if ($yaPagado && $pedido->estatus_pedido !== Pedido::CANCELADO) {
                        $this->devolverStock($pedido);
                    }
                    $pedido->update([
                        'estatus_pedido' => Pedido::CANCELADO,
                        'estatus_pago' => Pedido::PAGO_REEMBOLSADO,
                    ]);
                    break;

                case 'rejected':
                case 'cancelled':
                    if (! $yaPagado) {
                        $pedido->update(['estatus_pago' => Pedido::PAGO_RECHAZADO]);
                    }
                    break;

                default: // pending, in_process, authorized
                    if (! $yaPagado) {
                        $pedido->update(['estatus_pago' => Pedido::PAGO_PENDIENTE]);
                    }
            }

            return $pedido;
        });

        if ($pedido && $enviarConfirmacion) {
            $this->enviarConfirmacion($pedido);
        }

        return $pedido?->fresh(['items.variante.producto.fotos', 'entrega', 'usuario', 'ultimoPago']);
    }

    private function guardarPago(Pedido $pedido, string $paymentId, array $payment): void
    {
        Pago::updateOrCreate(
            ['idPedido' => $pedido->idPedido, 'payment_id' => $paymentId],
            [
                'preference_id' => $pedido->preference_id,
                'external_reference' => $pedido->external_reference,
                'status' => (string) ($payment['status'] ?? 'pending'),
                'status_detail' => $payment['status_detail'] ?? null,
                'monto' => (float) ($payment['transaction_amount'] ?? 0),
                'currency_id' => (string) ($payment['currency_id'] ?? config('services.mercadopago.currency')),
                'proveedor' => 'mercadopago',
                'metodo' => $payment['payment_method_id'] ?? null,
                'payment_method_id' => $payment['payment_method_id'] ?? null,
                'payment_type_id' => $payment['payment_type_id'] ?? null,
                'installments' => isset($payment['installments']) ? (int) $payment['installments'] : null,
                'raw_json' => json_encode($payment),
            ],
        );
    }

    private function descontarStock(Pedido $pedido): void
    {
        foreach ($pedido->items as $item) {
            // Descuento condicional: no deja el stock en negativo.
            $ok = ProductoVariante::whereKey($item->idVariante)
                ->where('stock', '>=', $item->cantidad)
                ->decrement('stock', $item->cantidad);

            if (! $ok) {
                ProductoVariante::whereKey($item->idVariante)->update(['stock' => 0]);
                $pedido->notas = trim($pedido->notas."\nStock insuficiente para la variante {$item->idVariante} al confirmar el pago.");
                Log::warning('Stock insuficiente al confirmar pago', ['idPedido' => $pedido->idPedido, 'idVariante' => $item->idVariante]);
            }

            DB::table('productos')
                ->where('idProducto', $item->variante->idProducto)
                ->update(['sold_total' => DB::raw('sold_total + '.(int) $item->cantidad)]);
        }

        $this->recalcularStockTotal($pedido);
    }

    public function devolverStock(Pedido $pedido): void
    {
        foreach ($pedido->items as $item) {
            ProductoVariante::whereKey($item->idVariante)->increment('stock', $item->cantidad);
        }

        $this->recalcularStockTotal($pedido);
    }

    private function recalcularStockTotal(Pedido $pedido): void
    {
        $productos = $pedido->items->map(fn ($i) => $i->variante->idProducto)->unique();
        foreach ($productos as $idProducto) {
            DB::table('productos')->where('idProducto', $idProducto)->update([
                'stock_total' => ProductoVariante::where('idProducto', $idProducto)->sum('stock'),
            ]);
        }
    }

    private function enviarConfirmacion(Pedido $pedido): void
    {
        $pedido->loadMissing('items.variante.producto.fotos', 'entrega', 'usuario');
        Notificador::enviar($pedido, new PedidoConfirmadoMail($pedido));
    }
}
