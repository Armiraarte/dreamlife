<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entrega extends Model
{
    protected $table = 'entregas';
    protected $primaryKey = 'idEntrega';
    protected $guarded = ['idEntrega'];

    /** Direccion completa en una linea. */
    public function direccion(): string
    {
        $calle = trim(implode(' ', array_filter([
            $this->calle,
            $this->num_ext,
            $this->num_int ? 'Int. '.$this->num_int : null,
        ])));

        return implode(', ', array_filter([
            $calle,
            $this->colonia,
            $this->ciudad,
            $this->estado,
            $this->cp ? 'CP '.$this->cp : null,
            $this->entre_calles ? 'Entre: '.$this->entre_calles : null,
        ]));
    }
}
