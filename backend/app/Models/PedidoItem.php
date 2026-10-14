<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PedidoItem extends Model
{
    protected $table = 'pedido_items';
    protected $primaryKey = 'idPedidoItem';
    protected $guarded = ['idPedidoItem'];

    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function variante(): BelongsTo
    {
        return $this->belongsTo(ProductoVariante::class, 'idVariante', 'idVariante');
    }
}
