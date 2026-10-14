<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PedidoResource;
use App\Models\Pedido;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Endpoints del cliente autenticado con Firebase (middleware "firebase").
 */
class CuentaController extends Controller
{
    /**
     * POST /api/me  { nombre?, telefono? }
     * Registra o actualiza el perfil del cliente. Reemplaza register_user.php:
     * el uid y el correo salen del token, no del formulario.
     */
    public function perfil(Request $request): JsonResponse
    {
        $firebase = $request->attributes->get('firebase_user');
        $data = $request->validate([
            'nombre' => ['nullable', 'string', 'max:180'],
            'telefono' => ['nullable', 'string', 'max:30'],
        ]);

        $usuario = Usuario::where('auth_provider', 'firebase')->where('auth_uid', $firebase['uid'])->first();

        // Un registro previo con el mismo correo (p. ej. compras como invitado)
        // solo se vincula si Firebase confirma que el correo es suyo.
        if (! $usuario && $firebase['email'] && $firebase['email_verified']) {
            $usuario = Usuario::where('email', $firebase['email'])->whereNull('auth_uid')->first();
        }

        $usuario ??= new Usuario;
        $emailLibre = $firebase['email']
            && ! Usuario::where('email', $firebase['email'])->whereKeyNot($usuario->getKey())->exists();

        $usuario->fill(array_filter([
            'auth_provider' => 'firebase',
            'auth_uid' => $firebase['uid'],
            'email' => $emailLibre ? $firebase['email'] : $usuario->email,
            'nombre' => $data['nombre'] ?? $usuario->nombre ?? $firebase['name'],
            'usuario' => $usuario->usuario ?? ($data['nombre'] ?? $firebase['name']),
            'telefono' => $data['telefono'] ?? $usuario->telefono,
        ], fn ($v) => $v !== null))->save();

        return response()->json([
            'id' => $usuario->idUsuario,
            'nombre' => $usuario->nombre,
            'email' => $usuario->email,
            'telefono' => $usuario->telefono,
        ]);
    }

    /** GET /api/me/orders */
    public function pedidos(Request $request): AnonymousResourceCollection
    {
        $firebase = $request->attributes->get('firebase_user');

        $pedidos = Pedido::query()
            ->whereHas('usuario', function ($q) use ($firebase) {
                $q->where(function ($q) use ($firebase) {
                    $q->where('auth_provider', 'firebase')->where('auth_uid', $firebase['uid']);
                });
                if ($firebase['email'] && $firebase['email_verified']) {
                    $q->orWhere('email', $firebase['email']);
                }
            })
            ->with('items.variante.producto.fotos', 'entrega', 'usuario', 'ultimoPago')
            ->orderByDesc('idPedido')
            ->limit(50)
            ->get();

        return PedidoResource::collection($pedidos);
    }
}
