<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pedidos: pedidos, pedido_items, entregas, pagos.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pedidos')) {
            Schema::create('pedidos', function (Blueprint $table) {
                $table->increments('idPedido');
                $table->unsignedInteger('idUsuario')->nullable()->index('idx_pedidos_usuario');
                $table->decimal('subtotal', 10, 2)->default(0);
                $table->decimal('costo_envio', 10, 2)->default(0);
                $table->decimal('total', 10, 2)->default(0);
                $table->string('estatus_pedido', 30)->default('CREADO')->index('idx_pedidos_estatus_pedido');
                $table->string('estatus_pago', 30)->default('PENDIENTE')->index('idx_pedidos_estatus_pago');
                $table->string('external_reference', 120)->nullable()->index('idx_pedidos_external_reference');
                $table->string('preference_id', 120)->nullable()->index('idx_pedidos_preference_id');
                $table->string('tracking_number', 120)->nullable()->unique('uk_pedidos_tracking');
                $table->string('shipping_carrier', 120)->nullable();
                $table->string('tracking_url', 500)->nullable();
                $table->text('notas')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamp('shipped_at')->nullable();
                $table->timestamp('delivered_at')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

                $table->foreign('idUsuario', 'fk_pedidos_usuario')
                    ->references('idUsuario')->on('usuarios')
                    ->cascadeOnUpdate()->nullOnDelete();
            });
        }

        if (! Schema::hasTable('pedido_items')) {
            Schema::create('pedido_items', function (Blueprint $table) {
                $table->bigIncrements('idPedidoItem');
                $table->unsignedInteger('idPedido')->index('idx_pedido_items_pedido');
                $table->unsignedInteger('idVariante')->index('idx_pedido_items_variante');
                $table->unsignedInteger('cantidad')->default(1);
                $table->decimal('precio_unitario', 10, 2)->nullable();
                $table->decimal('subtotal', 10, 2)->default(0);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

                $table->foreign('idPedido', 'fk_pedido_items_pedido')
                    ->references('idPedido')->on('pedidos')
                    ->cascadeOnUpdate()->cascadeOnDelete();
                $table->foreign('idVariante', 'fk_pedido_items_variante')
                    ->references('idVariante')->on('producto_variantes')
                    ->cascadeOnUpdate()->restrictOnDelete();
            });
        }

        if (! Schema::hasTable('entregas')) {
            Schema::create('entregas', function (Blueprint $table) {
                $table->increments('idEntrega');
                $table->unsignedInteger('idPedido')->unique('uk_entregas_pedido');
                $table->string('destinatario', 180)->nullable();
                $table->string('telefono', 30)->nullable();
                $table->string('cp', 10)->index('idx_entregas_cp');
                $table->string('estado', 120);
                $table->string('ciudad', 120);
                $table->string('colonia', 160);
                $table->string('calle', 180);
                $table->string('num_ext', 30);
                $table->string('num_int', 30)->nullable();
                $table->string('entre_calles', 255)->nullable();
                $table->text('referencias')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

                $table->foreign('idPedido', 'fk_entregas_pedido')
                    ->references('idPedido')->on('pedidos')
                    ->cascadeOnUpdate()->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('pagos')) {
            Schema::create('pagos', function (Blueprint $table) {
                $table->bigIncrements('idPago');
                $table->unsignedInteger('idPedido')->index('idx_pagos_pedido');
                $table->string('payment_id', 120)->nullable()->index('idx_pagos_payment_id');
                $table->string('preference_id', 120)->nullable()->index('idx_pagos_preference_id');
                $table->string('external_reference', 120)->nullable();
                $table->string('status', 60)->default('pending')->index('idx_pagos_status');
                $table->string('status_detail', 120)->nullable();
                $table->decimal('monto', 10, 2)->default(0);
                $table->string('currency_id', 10)->default('MXN');
                $table->string('proveedor', 40)->default('mercadopago');
                $table->string('metodo', 120)->nullable();
                $table->string('payment_method_id', 80)->nullable();
                $table->string('payment_type_id', 80)->nullable();
                $table->unsignedInteger('installments')->nullable();
                $table->longText('raw_json')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

                $table->foreign('idPedido', 'fk_pagos_pedido')
                    ->references('idPedido')->on('pedidos')
                    ->cascadeOnUpdate()->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('entregas');
        Schema::dropIfExists('pedido_items');
        Schema::dropIfExists('pedidos');
    }
};
