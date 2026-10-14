<table class="item-table">
@foreach ($pedido->items as $item)
  @php
    $variante = $item->variante;
    $foto = $variante?->producto?->fotos->first()?->url;
    if ($foto && ! str_starts_with($foto, 'http')) {
        $foto = $frontendUrl.'/'.ltrim($foto, '/');
    }
  @endphp
  <tr class="item-row">
    <td style="width: 90px;">
      @if ($foto)
        <img src="{{ $foto }}" class="prod-img" alt="{{ $variante?->producto?->nombre }}">
      @endif
    </td>
    <td class="prod-info">
      <span class="prod-name">{{ $variante?->producto?->nombre ?? 'Producto' }}</span>
      <span class="prod-meta">Talla: <span style="color:#fff;">{{ $variante?->talla ?: '-' }}</span></span>
      <span class="prod-meta">Color: <span style="color:#fff;">{{ $variante?->color ?: '-' }}</span></span>
      <span class="prod-meta">Cant: {{ $item->cantidad }}</span>
    </td>
    <td class="prod-price">$ {{ number_format((float) $item->subtotal, 2) }}</td>
  </tr>
@endforeach
</table>
