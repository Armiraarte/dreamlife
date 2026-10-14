<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductoVariante extends Model
{
    protected $table = 'producto_variantes';
    protected $primaryKey = 'idVariante';
    protected $guarded = ['idVariante'];

    protected $casts = [
        'stock' => 'integer',
        'precio_override' => 'decimal:2',
        'is_active' => 'boolean',
        'orden' => 'integer',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'idProducto', 'idProducto');
    }

    /** Precio vigente: el override de la variante si existe, si no el del producto. */
    public function precioUnitario(): float
    {
        return (float) ($this->precio_override ?? $this->producto->precio);
    }
}
