<?php

namespace App\Console\Commands;

use App\Models\AdminUsuario;
use App\Models\Producto;
use App\Services\MercadoPagoClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Revisa que todo este listo para cobrar en produccion:
 *
 *   php artisan dreamlife:verificar
 *   php artisan dreamlife:verificar --correo=tucorreo@ejemplo.com   (ademas envia un correo de prueba)
 */
class VerificarProduccion extends Command
{
    protected $signature = 'dreamlife:verificar {--correo= : Envia un correo de prueba a esta direccion}';

    protected $description = 'Verifica configuracion de produccion: app, base de datos, Mercado Pago, webhook y correo';

    private int $errores = 0;

    private int $avisos = 0;

    public function handle(MercadoPagoClient $mercadoPago): int
    {
        $this->line('');
        $this->line('<options=bold>DREAMLIFE · verificacion de produccion</>');

        $this->seccion('Aplicacion');
        $this->check(config('app.env') === 'production', 'APP_ENV=production', 'APP_ENV es "'.config('app.env').'"', aviso: true);
        $this->check(! config('app.debug'), 'APP_DEBUG=false', 'APP_DEBUG esta activo: muestra errores internos a los clientes');
        $this->check(! empty(config('app.key')), 'APP_KEY definida', 'Falta APP_KEY (php artisan key:generate)');
        $this->check(str_starts_with((string) config('app.url'), 'https://'), 'APP_URL usa https ('.config('app.url').')', 'APP_URL debe ser https');
        $front = (string) config('services.frontend.url');
        $this->check(str_starts_with($front, 'https://'), "FRONTEND_URL usa https ({$front})", 'FRONTEND_URL debe ser https (Mercado Pago solo regresa automaticamente a https)');

        $this->seccion('Base de datos');
        try {
            DB::connection()->getPdo();
            $this->ok('Conexion a '.config('database.default').' ('.DB::connection()->getDatabaseName().')');
            $this->check(Producto::where('is_active', true)->exists(), 'Hay productos activos', 'No hay productos activos');
            $this->check(AdminUsuario::where('is_active', true)->exists(), 'Hay al menos un admin activo', 'No hay admin (php artisan admin:create admin)');
        } catch (Throwable $e) {
            $this->fallo('No se pudo conectar: '.$e->getMessage());
        }

        $this->seccion('Mercado Pago');
        if (! $mercadoPago->isConfigured()) {
            $this->fallo('Falta MP_ACCESS_TOKEN');
        } else {
            $this->check($mercadoPago->isProductionToken(), 'Token de PRODUCCION (APP_USR-...)', 'El token es de PRUEBA (TEST-...): no se cobrara dinero real', aviso: config('app.env') !== 'production');
            try {
                $cuenta = $mercadoPago->account();
                $this->ok('Token valido · cuenta '.($cuenta['nickname'] ?? $cuenta['id'] ?? '?').' ('.($cuenta['site_id'] ?? '?').')');

                // Mercado Pago marca las cuentas de prueba con la etiqueta "test_user".
                $esCuentaDePrueba = in_array('test_user', $cuenta['tags'] ?? [], true);
                if (config('app.env') === 'production') {
                    $this->check(! $esCuentaDePrueba, 'Cuenta REAL: los cobros mueven dinero', 'La cuenta es un usuario de PRUEBA: en produccion no se cobrara nada');
                } elseif ($esCuentaDePrueba) {
                    $this->ok('Cuenta de PRUEBA (vendedor de prueba): lista para el sandbox');
                } else {
                    $this->avisos++;
                    $this->line('  <fg=yellow>!</> Es tu cuenta REAL: en sandbox Mercado Pago responde "este sitio no puede recibir pagos". Usa el token del vendedor de prueba.');
                }
                $this->check(($cuenta['site_id'] ?? 'MLM') === 'MLM', 'Cuenta de Mexico (MLM)', 'La cuenta no es de Mexico: los cobros no seran en MXN');
            } catch (Throwable $e) {
                $this->fallo($e->getMessage());
            }
        }
        $webhook = config('services.mercadopago.notification_url') ?: rtrim((string) config('app.url'), '/').'/api/webhooks/mercadopago';
        $this->check(str_starts_with($webhook, 'https://'), "Webhook: {$webhook}", "El webhook debe ser https ({$webhook})");
        $this->check(! empty(config('services.mercadopago.webhook_secret')), 'MP_WEBHOOK_SECRET definido (firma validada)', 'Sin MP_WEBHOOK_SECRET: no se valida la firma de los avisos', aviso: true);

        $this->seccion('Correo');
        $mailer = config('mail.default');
        $this->check(! in_array($mailer, ['log', 'array'], true), "MAIL_MAILER={$mailer}", "MAIL_MAILER={$mailer}: los correos NO se envian, solo se guardan en el log");
        $from = (string) config('mail.from.address');
        $this->check($from !== '' && ! str_contains($from, 'example.com'), "Remitente: {$from}", 'Configura MAIL_FROM_ADDRESS');
        $admin = config('services.admin.notify_email');
        $this->check(! empty($admin), "Copia de pedidos a: {$admin}", 'Sin MAIL_TO_ADMIN: no recibiras copia de los pedidos', aviso: true);

        if ($destino = $this->option('correo')) {
            try {
                Mail::raw(
                    "Correo de prueba de DREAMLIFE.\n\nSi lo recibes, los correos de confirmacion y envio de pedidos funcionan.\n\nServidor: ".config('app.url'),
                    fn ($m) => $m->to($destino)->subject('DREAMLIFE · correo de prueba'),
                );
                if (in_array($mailer, ['log', 'array'], true)) {
                    $this->fallo("El correo de prueba NO salio: MAIL_MAILER={$mailer} solo lo guarda en el log");
                } else {
                    $this->ok("Correo de prueba enviado a {$destino} (revisa tambien spam)");
                }
            } catch (Throwable $e) {
                $this->fallo('No se pudo enviar el correo: '.$e->getMessage());
            }
        }

        $this->line('');
        if ($this->errores === 0) {
            $this->info($this->avisos ? "Listo para produccion, con {$this->avisos} aviso(s)." : 'Todo listo para produccion.');

            return self::SUCCESS;
        }
        $this->error("{$this->errores} problema(s) por resolver antes de cobrar.");

        return self::FAILURE;
    }

    private function seccion(string $titulo): void
    {
        $this->line('');
        $this->line("<fg=gray>— {$titulo}</>");
    }

    private function check(bool $condicion, string $okMsg, string $falloMsg, bool $aviso = false): void
    {
        if ($condicion) {
            $this->ok($okMsg);
        } elseif ($aviso) {
            $this->avisos++;
            $this->line("  <fg=yellow>!</> {$falloMsg}");
        } else {
            $this->fallo($falloMsg);
        }
    }

    private function ok(string $msg): void
    {
        $this->line("  <fg=green>✓</> {$msg}");
    }

    private function fallo(string $msg): void
    {
        $this->errores++;
        $this->line("  <fg=red>✗</> {$msg}");
    }
}
