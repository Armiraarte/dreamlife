<?php

namespace App\Http\Middleware;

use App\Services\FirebaseTokenVerifier;
use Closure;
use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Autentica al cliente con el ID token de Firebase (Authorization: Bearer ...).
 * Los claims quedan en $request->attributes->get('firebase_user').
 *
 * Uso: ->middleware('firebase') obligatorio, ->middleware('firebase:optional') opcional.
 */
class FirebaseAuthenticate
{
    public function __construct(private readonly FirebaseTokenVerifier $verifier)
    {
    }

    public function handle(Request $request, Closure $next, string $mode = 'required'): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            if ($mode === 'optional') {
                return $next($request);
            }

            return response()->json(['message' => 'Inicia sesion para continuar.'], 401);
        }

        try {
            $request->attributes->set('firebase_user', $this->verifier->verify($token));
        } catch (RuntimeException) {
            return response()->json(['message' => 'Tu sesion expiro. Vuelve a iniciar sesion.'], 401);
        }

        return $next($request);
    }
}
