<?php

// Mensajes de validacion en espanol (solo las reglas que usa la API).
return [
    'array' => 'El campo :attribute debe ser una lista.',
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'email' => 'El campo :attribute debe ser un correo valido.',
    'in' => 'El valor de :attribute no es valido.',
    'integer' => 'El campo :attribute debe ser un numero entero.',
    'max' => [
        'array' => 'El campo :attribute no debe tener mas de :max elementos.',
        'numeric' => 'El campo :attribute no debe ser mayor que :max.',
        'string' => 'El campo :attribute no debe tener mas de :max caracteres.',
    ],
    'min' => [
        'array' => 'El campo :attribute debe tener al menos :min elementos.',
        'numeric' => 'El campo :attribute debe ser al menos :min.',
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
    ],
    'numeric' => 'El campo :attribute debe ser un numero.',
    'regex' => 'El formato de :attribute no es valido.',
    'required' => 'El campo :attribute es obligatorio.',
    'string' => 'El campo :attribute debe ser texto.',
    'unique' => 'Ese :attribute ya esta registrado.',
    'url' => 'El campo :attribute debe ser una URL valida.',
    'uuid' => 'El campo :attribute debe ser un identificador valido.',

    'attributes' => [
        'usuario' => 'usuario',
        'clave' => 'clave',
        'reference' => 'referencia del pedido',
        'payment_id' => 'id de pago',
        'tracking_number' => 'numero de guia',
        'tracking_url' => 'URL de rastreo',
        'shipping_carrier' => 'paqueteria',
        'sku_base' => 'SKU',
        'nombre' => 'nombre',
        'precio' => 'precio',
        'categoria' => 'categoria',
        'imagenes.*' => 'imagen',
        'items' => 'carrito',
    ],
];
