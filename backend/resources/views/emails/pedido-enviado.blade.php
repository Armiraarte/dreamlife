@extends('emails.layout', ['titulo' => 'Pedido enviado'])

@section('content')
  <p style="text-align: center; color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Pedido enviado</p>
  <h1>Va en camino.</h1>
  <p style="text-align: center; max-width: 400px; margin: 0 auto 30px auto; color: #aaa;">
    Hola {{ $pedido->entrega?->destinatario ?? $pedido->usuario?->nombre ?? '' }}, tu orden <strong>#{{ $pedido->numero() }}</strong> ya fue entregada a la paqueter&iacute;a.
  </p>

  <div class="section-title">01. Rastreo</div>
  <table class="info-table">
    <tr><td class="label">Gu&iacute;a</td><td style="color: #fff;">{{ $pedido->tracking_number }}</td></tr>
    @if ($pedido->shipping_carrier)
      <tr><td class="label">Paqueter&iacute;a</td><td style="color: #fff;">{{ $pedido->shipping_carrier }}</td></tr>
    @endif
    <tr><td class="label">Destino</td><td style="color: #fff;">{{ $pedido->entrega?->direccion() }}</td></tr>
  </table>

  <p style="text-align: center; margin-top: 30px;">
    <a class="button" href="{{ $pedido->tracking_url ?: $frontendUrl.'/#/track-order?id='.urlencode((string) $pedido->tracking_number) }}">Rastrear pedido</a>
  </p>

  <div class="section-title">02. Contenido</div>
  @include('emails.partials.items')

  <div class="total-section">
    <span class="total-label">Total</span>
    <span class="total-amount">$ {{ number_format((float) $pedido->total, 2) }}</span>
  </div>
@endsection
