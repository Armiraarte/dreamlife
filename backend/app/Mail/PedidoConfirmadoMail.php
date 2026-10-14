<?php

namespace App\Mail;

use App\Models\Pedido;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PedidoConfirmadoMail extends Mailable
{
    public function __construct(public Pedido $pedido)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Confirmacion de pedido '.$this->pedido->numero());
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.pedido-confirmado',
            text: 'emails.pedido-confirmado-text',
            with: ['frontendUrl' => config('services.frontend.url')],
        );
    }
}
