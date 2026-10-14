@extends('emails.layout', ['titulo' => 'Confirmacion'])

@section('content')
  <p style="text-align: center; color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Orden confirmada</p>
  <h1>Est&aacute;s dentro.</h1>
  <p style="text-align: center; max-width: 400px; margin: 0 auto 40px auto; color: #aaa;">
    Tu orden <strong>#{{ $pedido->numero() }}</strong> ha sido pagada y procesada correctamente.
  </p>

  <div class="section-title">01. Cliente</div>
  <p style="margin: 0; font-size: 14px; font-weight: bold; color: #fff;">{{ $pedido->entrega?->destinatario ?? $pedido->usuario?->nombre ?? 'Cliente' }}</p>
  <p style="margin: 3px 0 0 0; font-size: 12px; color: #888;">{{ $pedido->usuario?->email }}</p>

  <div class="section-title">02. Datos de entrega</div>
  <table class="info-table">
    <tr><td class="label">Direcci&oacute;n</td><td style="color: #fff;">{{ trim(($pedido->entrega?->calle ?? '').' '.($pedido->entrega?->num_ext ?? '').' '.($pedido->entrega?->num_int ?? '')) }}, {{ $pedido->entrega?->colonia }}</td></tr>
    <tr><td class="label">Ubicaci&oacute;n</td><td style="color: #fff;">{{ $pedido->entrega?->ciudad }}, {{ $pedido->entrega?->estado }}</td></tr>
    <tr><td class="label">C.P.</td><td style="color: #fff;">{{ $pedido->entrega?->cp }}</td></tr>
  </table>

  <div class="section-title">03. Resumen del pedido</div>
  @include('emails.partials.items')

  <div class="total-section">
    <span class="total-label">Total pagado</span>
    <span class="total-amount">$ {{ number_format((float) $pedido->total, 2) }}</span>
  </div>
@endsection
