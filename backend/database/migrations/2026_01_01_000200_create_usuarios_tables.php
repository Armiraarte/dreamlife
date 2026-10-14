<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Clientes (usuarios) y administradores (admin_usuarios).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('usuarios')) {
            Schema::create('usuarios', function (Blueprint $table) {
                $table->increments('idUsuario');
                $table->string('auth_provider', 40)->default('guest');
                $table->string('auth_uid', 255)->nullable();
                $table->string('usuario', 120)->nullable()->index('idx_usuarios_usuario');
                $table->string('nombre', 180)->nullable()->index('idx_usuarios_nombre');
                $table->string('email', 190)->nullable()->unique('uk_usuarios_email');
                $table->string('telefono', 30)->nullable();
                $table->string('photo_url', 500)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

                $table->unique(['auth_provider', 'auth_uid'], 'uk_usuarios_auth');
            });
        }

        if (! Schema::hasTable('admin_usuarios')) {
            Schema::create('admin_usuarios', function (Blueprint $table) {
                $table->increments('idAdminUsuario');
                $table->string('usuario', 120)->unique('uk_admin_usuario');
                $table->string('password_hash', 255);
                $table->boolean('is_active')->default(true);
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
            });
        }

        if (! Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('admin_usuarios');
        Schema::dropIfExists('usuarios');
    }
};
