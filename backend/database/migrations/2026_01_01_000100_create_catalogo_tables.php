<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catalogo: categoria, productos, producto_variantes, producto_fotos.
 *
 * Replica el esquema de bd/base_renovada.sql. Cada tabla se crea solo si no
 * existe, para poder apuntar Laravel a la base de produccion ya creada.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('categoria')) {
            Schema::create('categoria', function (Blueprint $table) {
                $table->increments('idCategoria');
                $table->string('nombre', 100)->unique('uk_categoria_nombre');
                $table->string('slug', 100)->unique('uk_categoria_slug');
                $table->string('descripcion', 255)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
            });
        }

        if (! Schema::hasTable('productos')) {
            Schema::create('productos', function (Blueprint $table) {
                $table->increments('idProducto');
                $table->string('sku_base', 120)->nullable()->unique('uk_productos_sku_base');
                $table->string('nombre', 180);
                $table->string('slug', 180)->nullable()->unique('uk_productos_slug');
                $table->text('descripcion')->nullable();
                $table->decimal('precio', 10, 2)->default(0);
                $table->unsignedInteger('categoria')->index('idx_productos_categoria');
                $table->string('imagen_principal', 500)->nullable();
                $table->longText('galeria_json')->nullable();
                $table->longText('colores_json')->nullable();
                $table->longText('tallas_json')->nullable();
                $table->longText('detalles_json')->nullable();
                $table->unsignedInteger('stock_total')->default(0);
                $table->unsignedInteger('sold_total')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

                $table->foreign('categoria', 'fk_productos_categoria')
                    ->references('idCategoria')->on('categoria')
                    ->cascadeOnUpdate()->restrictOnDelete();
            });
        }

        if (! Schema::hasTable('producto_variantes')) {
            Schema::create('producto_variantes', function (Blueprint $table) {
                $table->increments('idVariante');
                $table->unsignedInteger('idProducto')->index('idx_producto_variantes_producto');
                $table->string('talla', 20);
                $table->string('color', 60)->default('Black');
                $table->string('sku', 120)->unique('uk_producto_variantes_sku');
                $table->unsignedInteger('stock')->default(0);
                $table->decimal('precio_override', 10, 2)->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('orden')->default(0);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

                $table->unique(['idProducto', 'talla', 'color'], 'uk_producto_variantes_producto_talla_color');
                $table->index(['talla', 'color'], 'idx_producto_variantes_talla_color');
                $table->foreign('idProducto', 'fk_producto_variantes_producto')
                    ->references('idProducto')->on('productos')
                    ->cascadeOnUpdate()->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('producto_fotos')) {
            Schema::create('producto_fotos', function (Blueprint $table) {
                $table->increments('idFoto');
                $table->unsignedInteger('idProducto')->index('idx_producto_fotos_producto');
                $table->string('url', 500);
                $table->string('alt_text', 255)->nullable();
                $table->unsignedInteger('orden')->default(0);
                $table->boolean('is_principal')->default(false);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

                $table->index(['idProducto', 'is_principal', 'orden'], 'idx_producto_fotos_portada');
                $table->foreign('idProducto', 'fk_producto_fotos_producto')
                    ->references('idProducto')->on('productos')
                    ->cascadeOnUpdate()->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_fotos');
        Schema::dropIfExists('producto_variantes');
        Schema::dropIfExists('productos');
        Schema::dropIfExists('categoria');
    }
};
