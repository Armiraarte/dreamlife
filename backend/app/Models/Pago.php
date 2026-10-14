<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pagos';
    protected $primaryKey = 'idPago';
    protected $guarded = ['idPago'];

    protected $casts = [
        'monto' => 'decimal:2',
        'installments' => 'integer',
    ];
}
