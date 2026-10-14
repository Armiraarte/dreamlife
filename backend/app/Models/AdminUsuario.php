<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class AdminUsuario extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'admin_usuarios';
    protected $primaryKey = 'idAdminUsuario';
    protected $fillable = ['usuario', 'password_hash', 'is_active'];
    protected $hidden = ['password_hash'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getRememberTokenName(): string
    {
        // La tabla no tiene columna remember_token.
        return '';
    }
}
