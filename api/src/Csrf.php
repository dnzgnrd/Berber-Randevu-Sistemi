<?php

declare(strict_types=1);

final class Csrf
{
    private const SESSION_KEY = '_csrf_token';

    public static function token(): string
    {
        if (empty($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        }
        return $_SESSION[self::SESSION_KEY];
    }

    public static function validate(?string $token): bool
    {
        if ($token === null || $token === '') {
            return false;
        }
        $sessionToken = $_SESSION[self::SESSION_KEY] ?? '';
        if ($sessionToken === '') {
            return false;
        }
        return hash_equals($sessionToken, $token);
    }

    public static function requireValid(): void
    {
        $token = Request::header('X-CSRF-Token') ?? (Request::jsonBody()['csrf_token'] ?? null);
        if (!self::validate(is_string($token) ? $token : null)) {
            Response::error('CSRF doğrulaması başarısız.', 403);
            exit;
        }
    }
}
