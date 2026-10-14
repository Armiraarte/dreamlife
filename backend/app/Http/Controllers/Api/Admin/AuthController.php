<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUsuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /** POST /api/admin/login  { usuario, clave } -> token Bearer */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'usuario' => ['required', 'string', 'max:120'],
            'clave' => ['required', 'string', 'max:255'],
        ]);

        $admin = AdminUsuario::where('usuario', $data['usuario'])->first();

        // Mismo mensaje para usuario inexistente o clave incorrecta.
        if (! $admin || ! Hash::check($data['clave'], $admin->password_hash)) {
            return response()->json(['message' => 'Usuario o clave invalidos.'], 401);
        }
        if (! $admin->is_active) {
            return response()->json(['message' => 'Usuario inactivo.'], 403);
        }

        if (Hash::needsRehash($admin->password_hash)) {
            $admin->update(['password_hash' => Hash::make($data['clave'])]);
        }

        $token = $admin->createToken('admin', ['admin'], now()->addHours(12));

        return response()->json([
            'token' => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at?->toIso8601String(),
            'user' => ['id' => $admin->idAdminUsuario, 'usuario' => $admin->usuario],
        ]);
    }

    /** GET /api/admin/me */
    public function me(Request $request): JsonResponse
    {
        $admin = $request->user();

        return response()->json(['id' => $admin->idAdminUsuario, 'usuario' => $admin->usuario]);
    }

    /** POST /api/admin/logout */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }
}
