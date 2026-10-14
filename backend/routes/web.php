<?php

use Illuminate\Support\Facades\Route;

// El backend solo expone la API (/api/...). El sitio lo sirve el frontend.
Route::get('/', fn () => response()->json(['name' => 'Dreamlife API', 'status' => 'ok']));
