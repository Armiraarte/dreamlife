<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'mercadopago' => [
        'access_token' => env('MP_ACCESS_TOKEN'),
        // Clave secreta de webhooks (Tus integraciones > Webhooks). Si se define, se valida x-signature.
        'webhook_secret' => env('MP_WEBHOOK_SECRET'),
        // URL publica que recibira las notificaciones. Por defecto APP_URL/api/webhooks/mercadopago.
        'notification_url' => env('MP_NOTIFICATION_URL'),
        'base_url' => env('MP_BASE_URL', 'https://api.mercadopago.com'),
        'currency' => env('MP_CURRENCY', 'MXN'),
    ],

    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
    ],

    'frontend' => [
        // URL del frontend (sin barra final). Se usa para las back_urls de Mercado Pago.
        'url' => rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/'),
    ],

    'admin' => [
        'notify_email' => env('MAIL_TO_ADMIN'),
    ],

];
