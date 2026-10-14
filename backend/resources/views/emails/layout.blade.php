<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $titulo ?? 'Dreamlife' }}</title>
<style>
  body { margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica', 'Arial', sans-serif; color: #ffffff; }
  .wrapper { width: 100%; background-color: #000000; padding: 20px 0; }
  .main { margin: 0 auto; width: 100%; max-width: 600px; background-color: #000000; border: 1px solid #222222; }
  .header { padding: 30px; text-align: center; border-bottom: 1px solid #222222; }
  .logo { font-family: 'Times New Roman', serif; font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-decoration: none; }
  .content { padding: 40px 20px; }
  h1 { font-family: 'Times New Roman', serif; font-size: 28px; margin: 0 0 20px 0; text-transform: uppercase; line-height: 1.2; text-align: center; color: #ffffff; }
  p { font-size: 13px; line-height: 22px; color: #cccccc; margin-bottom: 15px; }
  .section-title { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #222; padding-bottom: 10px; margin-bottom: 20px; margin-top: 30px; font-weight: bold; }
  .info-table { width: 100%; font-size: 13px; color: #ddd; margin-bottom: 20px; }
  .info-table td { padding: 5px 0; vertical-align: top; }
  .label { color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; width: 100px; }
  .item-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .item-row td { padding: 20px 0; border-bottom: 1px solid #222222; vertical-align: top; }
  .prod-img { width: 80px; height: 100px; object-fit: cover; display: block; border: 1px solid #333; background-color: #111; }
  .prod-info { padding-left: 10px; }
  .prod-name { margin: 0 0 5px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #ffffff; display: block; }
  .prod-meta { margin: 0; font-size: 12px; color: #888888; display: block; line-height: 1.5; }
  .prod-price { text-align: right; font-size: 14px; font-weight: bold; color: #ffffff; white-space: nowrap; }
  .total-section { margin-top: 20px; border-top: 1px solid #333; padding-top: 15px; text-align: right; }
  .total-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-right: 15px; }
  .total-amount { font-size: 20px; font-weight: bold; color: #fff; font-family: 'Times New Roman', serif; }
  .button { display: inline-block; padding: 14px 28px; background: #ffffff; color: #000000 !important; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
  .footer { padding: 30px; text-align: center; border-top: 1px solid #222222; font-size: 10px; color: #444444; letter-spacing: 1px; text-transform: uppercase; }
</style>
</head>
<body>
<div class="wrapper">
  <table class="main" cellspacing="0" cellpadding="0">
    <tr><td class="header"><a href="{{ $frontendUrl }}" class="logo">DREAMLIFE&reg;</a></td></tr>
    <tr><td class="content">@yield('content')</td></tr>
    <tr><td class="footer">Dreamlife Global Corp &copy; {{ date('Y') }}</td></tr>
  </table>
</div>
</body>
</html>
