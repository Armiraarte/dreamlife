<?php

use App\Models\AdminUsuario;

return [

    /*
    |--------------------------------------------------------------------------
    | Autenticacion
    |--------------------------------------------------------------------------
    |
    | La API no usa sesiones. Los administradores se autentican con tokens de
    | Sanctum (tabla admin_usuarios) y los clientes con el ID token de Firebase
    | (middleware "firebase").
    |
    */

    'defaults' => [
        'guard' => 'sanctum',
        'passwords' => 'admins',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'admins',
        ],
    ],

    'providers' => [
        'admins' => [
            'driver' => 'eloquent',
            'model' => AdminUsuario::class,
        ],
    ],

    'passwords' => [
        'admins' => [
            'provider' => 'admins',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

];
