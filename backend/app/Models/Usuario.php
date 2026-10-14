<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Usuario extends Model
{
    protected $table = 'usuarios';
    protected $primaryKey = 'idUsuario';
    protected $guarded = ['idUsuario'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'idUsuario', 'idUsuario');
    }
}
