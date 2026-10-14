<?php

use App\Http\Controllers\Api\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Api\Admin\PedidoController as AdminPedidoController;
use App\Http\Controllers\Api\Admin\ProductoController as AdminProductoController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CuentaController;
use App\Http\Controllers\Api\MercadoPagoWebhookController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\TrackingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Dreamlife (prefijo /api)
|--------------------------------------------------------------------------
*/

// Catalogo publico
Route::get('/products', [ProductoController::class, 'index']);
Route::get('/products/{producto}', [ProductoController::class, 'show'])->whereNumber('producto');

// Checkout y pagos
Route::post('/checkout', [CheckoutController::class, 'store'])
    ->middleware(['firebase:optional', 'throttle:20,1']);
Route::post('/checkout/confirm', [CheckoutController::class, 'confirm'])
    ->middleware('throttle:30,1');
Route::post('/webhooks/mercadopago', MercadoPagoWebhookController::class);

// Rastreo publico por guia
Route::get('/orders/track/{guia}', [TrackingController::class, 'show'])
    ->middleware('throttle:30,1');

// Cliente autenticado con Firebase
Route::middleware('firebase')->group(function () {
    Route::post('/me', [CuentaController::class, 'perfil']);
    Route::get('/me/orders', [CuentaController::class, 'pedidos']);
});

// Administracion
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);

        Route::get('/orders', [AdminPedidoController::class, 'index']);
        Route::patch('/orders/{pedido}', [AdminPedidoController::class, 'update'])->whereNumber('pedido');

        Route::get('/products', [AdminProductoController::class, 'index']);
        Route::post('/products', [AdminProductoController::class, 'store']);
    });
});
