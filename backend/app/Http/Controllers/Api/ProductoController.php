<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductoResource;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductoController extends Controller
{
    /** GET /api/products  (?lite=1 omite las fotos) */
    public function index(Request $request): AnonymousResourceCollection
    {
        $relaciones = $request->boolean('lite') ? ['variantes'] : ['variantes', 'fotos'];

        $productos = Producto::activos()
            ->with($relaciones)
            ->orderBy('idProducto')
            ->get();

        return ProductoResource::collection($productos);
    }

    /** GET /api/products/{producto} */
    public function show(Producto $producto): ProductoResource
    {
        abort_unless($producto->is_active, 404);

        return new ProductoResource($producto->load('variantes', 'fotos'));
    }
}
