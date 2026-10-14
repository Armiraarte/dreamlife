<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pedido extends Model
{
    public const CREADO = 'CREADO';
    public const PAGADO = 'PAGADO';
    public const ENVIADO = 'ENVIADO';
    public const ENTREGADO = 'ENTREGADO';
    public const CANCELADO = 'CANCELADO';

    public const ESTATUS = [self::CREADO, self::PAGADO, self::ENVIADO, self::ENTREGADO, self::CANCELADO];

    public const PAGO_PENDIENTE = 'PENDIENTE';
    public const PAGO_APROBADO = 'APROBADO';
    public const PAGO_RECHAZADO = 'RECHAZADO';
    public const PAGO_REEMBOLSADO = 'REEMBOLSADO';

    protected $table = 'pedidos';
    protected $primaryKey = 'idPedido';
    protected $guarded = ['idPedido'];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'costo_envio' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'idUsuario', 'idUsuario');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PedidoItem::class, 'idPedido', 'idPedido');
    }

    public function entrega(): HasOne
    {
        return $this->hasOne(Entrega::class, 'idPedido', 'idPedido');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'idPedido', 'idPedido');
    }

    public function ultimoPago(): HasOne
    {
        return $this->hasOne(Pago::class, 'idPedido', 'idPedido')->latestOfMany('idPago');
    }

    public function numero(): string
    {
        return 'GDS-'.str_pad((string) $this->idPedido, 3, '0', STR_PAD_LEFT);
    }
}
