Confirmacion de pedido {{ $pedido->numero() }}

Total: ${{ number_format((float) $pedido->total, 2) }}

Articulos:
@foreach ($pedido->items as $item)
- {{ $item->variante?->producto?->nombre }} {{ $item->variante?->talla }} {{ $item->variante?->color }}: {{ $item->cantidad }} x ${{ number_format((float) $item->precio_unitario, 2) }}
@endforeach

Entrega: {{ $pedido->entrega?->direccion() }}
