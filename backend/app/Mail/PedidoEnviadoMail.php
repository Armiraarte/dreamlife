<?php

namespace App\Mail;

use App\Models\Pedido;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PedidoEnviadoMail extends Mailable
{
    public function __construct(public Pedido $pedido)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tu pedido '.$this->pedido->numero().' va en camino');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.pedido-enviado',
            text: 'emails.pedido-enviado-text',
            with: ['frontendUrl' => config('services.frontend.url')],
        );
    }
}
