<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Kreait\Firebase\JWT\IdTokenVerifier;
use RuntimeException;
use Symfony\Component\Cache\Adapter\Psr16Adapter;
use Throwable;

/**
 * Verifica ID tokens de Firebase Auth (firma, expiracion, audiencia).
 * Las llaves publicas de Google se guardan en la cache de Laravel.
 */
class FirebaseTokenVerifier
{
    private ?IdTokenVerifier $verifier = null;

    public function __construct(private readonly ?string $projectId)
    {
    }

    /**
     * @return array{uid: string, email: ?string, email_verified: bool, name: ?string}
     *
     * @throws RuntimeException si el token no es valido.
     */
    public function verify(string $idToken): array
    {
        try {
            $payload = $this->verifier()->verifyIdTokenWithLeeway($idToken, 60)->payload();
        } catch (Throwable $e) {
            throw new RuntimeException('Token de Firebase invalido.', 0, $e);
        }

        return [
            'uid' => (string) $payload['sub'],
            'email' => isset($payload['email']) ? strtolower((string) $payload['email']) : null,
            'email_verified' => (bool) ($payload['email_verified'] ?? false),
            'name' => $payload['name'] ?? null,
        ];
    }

    private function verifier(): IdTokenVerifier
    {
        if (! $this->projectId) {
            throw new RuntimeException('FIREBASE_PROJECT_ID no esta configurado.');
        }

        return $this->verifier ??= IdTokenVerifier::createWithProjectIdAndCache(
            $this->projectId,
            new Psr16Adapter(Cache::store(), 'firebase_keys'),
        );
    }
}
