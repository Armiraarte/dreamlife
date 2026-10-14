<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    protected $table = 'productos';
    protected $primaryKey = 'idProducto';
    protected $guarded = ['idProducto'];

    protected $casts = [
        'precio' => 'decimal:2',
        'is_active' => 'boolean',
        'stock_total' => 'integer',
        'sold_total' => 'integer',
        'detalles_json' => 'array',
    ];

    public function categoriaRel(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'categoria', 'idCategoria');
    }

    public function variantes(): HasMany
    {
        return $this->hasMany(ProductoVariante::class, 'idProducto', 'idProducto');
    }

    public function fotos(): HasMany
    {
        return $this->hasMany(ProductoFoto::class, 'idProducto', 'idProducto')
            ->orderByDesc('is_principal')
            ->orderBy('orden')
            ->orderBy('idFoto');
    }

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
