<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.idVariante' => ['required', 'integer', 'min:1'],
            'items.*.cantidad' => ['required', 'integer', 'min:1', 'max:10'],

            'cliente.nombre' => ['required', 'string', 'max:180'],
            'cliente.email' => ['required', 'email', 'max:190'],
            'cliente.telefono' => ['nullable', 'string', 'max:30'],

            'entrega.cp' => ['required', 'regex:/^\d{5}$/'],
            'entrega.estado' => ['required', 'string', 'max:120'],
            'entrega.ciudad' => ['required', 'string', 'max:120'],
            'entrega.colonia' => ['required', 'string', 'max:160'],
            'entrega.calle' => ['required', 'string', 'max:180'],
            'entrega.num_ext' => ['required', 'string', 'max:30'],
            'entrega.num_int' => ['nullable', 'string', 'max:30'],
            'entrega.entre_calles' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'cliente.nombre' => 'nombre',
            'cliente.email' => 'correo',
            'cliente.telefono' => 'telefono',
            'entrega.cp' => 'codigo postal',
            'entrega.estado' => 'estado',
            'entrega.ciudad' => 'ciudad',
            'entrega.colonia' => 'colonia',
            'entrega.calle' => 'calle',
            'entrega.num_ext' => 'numero exterior',
        ];
    }
}
