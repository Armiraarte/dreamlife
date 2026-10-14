<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    protected $table = 'categoria';
    protected $primaryKey = 'idCategoria';
    protected $guarded = ['idCategoria'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'categoria', 'idCategoria');
    }
}
