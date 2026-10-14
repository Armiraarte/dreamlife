<?php

namespace App\Providers;

use App\Services\FirebaseTokenVerifier;
use App\Services\MercadoPagoClient;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(MercadoPagoClient::class, fn () => new MercadoPagoClient(
            config('services.mercadopago.access_token'),
            config('services.mercadopago.webhook_secret'),
            config('services.mercadopago.base_url'),
        ));

        $this->app->singleton(FirebaseTokenVerifier::class, fn () => new FirebaseTokenVerifier(
            config('services.firebase.project_id'),
        ));
    }

    public function boot(): void
    {
        // Respuestas sin la envoltura { data: ... }: objetos y arreglos directos.
        JsonResource::withoutWrapping();
    }
}
