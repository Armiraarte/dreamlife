Tu pedido {{ $pedido->numero() }} va en camino.

Guia: {{ $pedido->tracking_number }}
@if ($pedido->shipping_carrier)
Paqueteria: {{ $pedido->shipping_carrier }}
@endif
Rastreo: {{ $pedido->tracking_url ?: $frontendUrl.'/#/track-order?id='.urlencode((string) $pedido->tracking_number) }}
Destino: {{ $pedido->entrega?->direccion() }}
Total: ${{ number_format((float) $pedido->total, 2) }}
