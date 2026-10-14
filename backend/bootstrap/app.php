<?php

use App\Http\Middleware\FirebaseAuthenticate;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'firebase' => FirebaseAuthenticate::class,
            'abilities' => CheckAbilities::class,
        ]);

        // API sin pantalla de login: un invitado recibe 401 JSON, nunca un redirect.
        $middleware->redirectGuestsTo(fn () => null);

        // Detras de nginx / balanceador.
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // La API siempre responde JSON, nunca paginas HTML de error.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());
    })->create();
