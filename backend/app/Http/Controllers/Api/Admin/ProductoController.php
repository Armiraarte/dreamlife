<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductoResource;
use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductoController extends Controller
{
    /** GET /api/admin/products — incluye productos inactivos. */
    public function index(): AnonymousResourceCollection
    {
        return ProductoResource::collection(
            Producto::with('variantes', 'fotos')->orderBy('idProducto')->get()
        );
    }

    /**
     * POST /api/admin/products
     * Crea o actualiza un producto por sku_base, con stock por talla e imagenes.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sku_base' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9._-]+$/'],
            'nombre' => ['required', 'string', 'max:180'],
            'precio' => ['required', 'numeric', 'min:0', 'max:999999'],
            'categoria' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'color' => ['required', 'string', 'max:60'],
            'stock' => ['required', 'array', 'min:1'],
            'stock.*' => ['integer', 'min:0', 'max:100000'],
            'imagenes' => ['nullable', 'array', 'max:8'],
            'imagenes.*' => ['string', 'max:500', 'regex:#^(https?://|/)#'],
        ]);

        $categoria = Categoria::where('nombre', $data['categoria'])
            ->orWhere('slug', Str::slug($data['categoria']))
            ->orWhere('idCategoria', is_numeric($data['categoria']) ? (int) $data['categoria'] : 0)
            ->first();
        if (! $categoria) {
            return response()->json(['message' => 'Categoria no valida.', 'errors' => ['categoria' => ['Categoria no valida.']]], 422);
        }

        $producto = DB::transaction(function () use ($data, $categoria) {
            $producto = Producto::firstOrNew(['sku_base' => $data['sku_base']]);
            $imagenes = array_values($data['imagenes'] ?? []);

            $producto->fill([
                'nombre' => $data['nombre'],
                'slug' => $producto->slug ?: $this->slugUnico($data['nombre']),
                'descripcion' => $data['descripcion'] ?? $producto->descripcion,
                'precio' => $data['precio'],
                'categoria' => $categoria->idCategoria,
                'is_active' => true,
            ]);
            if ($imagenes) {
                $producto->imagen_principal = $imagenes[0];
                $producto->galeria_json = json_encode($imagenes);
            }
            $producto->save();

            $orden = 0;
            foreach ($data['stock'] as $talla => $cantidad) {
                $talla = strtoupper(substr((string) $talla, 0, 20));
                $producto->variantes()->updateOrCreate(
                    ['talla' => $talla, 'color' => $data['color']],
                    [
                        'sku' => $data['sku_base'].'-'.$talla.($data['color'] !== 'Black' ? '-'.Str::upper(Str::slug($data['color'])) : ''),
                        'stock' => (int) $cantidad,
                        'is_active' => true,
                        'orden' => ++$orden,
                    ],
                );
            }

            if ($imagenes) {
                $producto->fotos()->delete();
                foreach ($imagenes as $i => $url) {
                    $producto->fotos()->create([
                        'url' => $url,
                        'alt_text' => $producto->nombre,
                        'orden' => $i + 1,
                        'is_principal' => $i === 0,
                    ]);
                }
            }

            $producto->update([
                'stock_total' => $producto->variantes()->sum('stock'),
                'tallas_json' => json_encode($producto->variantes()->orderBy('orden')->pluck('talla')->unique()->values()),
                'colores_json' => json_encode($producto->variantes()->pluck('color')->unique()->values()),
            ]);

            return $producto;
        });

        return (new ProductoResource($producto->load('variantes', 'fotos')))
            ->response()
            ->setStatusCode($producto->wasRecentlyCreated ? 201 : 200);
    }

    private function slugUnico(string $nombre): string
    {
        $base = Str::slug($nombre) ?: 'producto';
        $slug = $base;
        $i = 2;
        while (Producto::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
