<?php

use App\Models\AdminUsuario;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

/*
| Gestion de administradores desde la terminal (reemplaza php/create_admin.php,
| que permitia a cualquiera crear admins por HTTP).
|
|   php artisan admin:create admin            (pide la clave)
|   php artisan admin:create admin --password="..."
|   php artisan admin:disable admin
*/

Artisan::command('admin:create {usuario} {--password= : Clave (si se omite se pide)}', function (string $usuario) {
    $clave = $this->option('password') ?: $this->secret('Clave para '.$usuario);

    if (! $clave || strlen($clave) < 10) {
        $this->error('La clave debe tener al menos 10 caracteres.');

        return 1;
    }

    $admin = AdminUsuario::firstOrNew(['usuario' => $usuario]);
    $nuevo = ! $admin->exists;
    $admin->fill(['password_hash' => Hash::make($clave), 'is_active' => true])->save();

    // Al cambiar la clave se cierran las sesiones abiertas.
    $admin->tokens()->delete();

    $this->info($nuevo ? "Admin '{$usuario}' creado." : "Clave de '{$usuario}' actualizada.");

    return 0;
})->purpose('Crea un administrador o cambia su clave');

Artisan::command('admin:disable {usuario}', function (string $usuario) {
    $admin = AdminUsuario::where('usuario', $usuario)->first();
    if (! $admin) {
        $this->error("No existe el admin '{$usuario}'.");

        return 1;
    }

    $admin->update(['is_active' => false]);
    $admin->tokens()->delete();
    $this->info("Admin '{$usuario}' desactivado y sus sesiones cerradas.");

    return 0;
})->purpose('Desactiva un administrador');
