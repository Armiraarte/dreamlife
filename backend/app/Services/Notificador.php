<?php

namespace App\Services;

use App\Models\Pedido;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Envia correos de un pedido al cliente, con copia oculta al admin.
 * Un fallo de correo nunca rompe el flujo del pedido.
 */
class Notificador
{
    public static function enviar(Pedido $pedido, Mailable $mail): bool
    {
        $cliente = $pedido->usuario?->email;
        $admin = config('services.admin.notify_email');

        if (! $cliente && ! $admin) {
            return false;
        }

        try {
            $pending = Mail::to($cliente ?: $admin);
            if ($cliente && $admin) {
                $pending->bcc($admin);
            }
            $pending->send($mail);

            return true;
        } catch (Throwable $e) {
            Log::error('No se pudo enviar correo del pedido', [
                'idPedido' => $pedido->idPedido,
                'mail' => $mail::class,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
