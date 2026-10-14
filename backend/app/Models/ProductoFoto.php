<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoFoto extends Model
{
    protected $table = 'producto_fotos';
    protected $primaryKey = 'idFoto';
    protected $guarded = ['idFoto'];

    protected $casts = [
        'orden' => 'integer',
        'is_principal' => 'boolean',
    ];
}
