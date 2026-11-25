<?php

declare(strict_types=1);

final class RateLimit
{
    private const MAX_ATTEMPTS = 8;
    private const WINDOW_MINUTES = 15;

    public static function tooMany(string $email, string $ip): bool
    {
        $stmt = db()->prepare(
            'SELECT COUNT(*) AS cnt FROM login_attempts
             WHERE attempted_at >= (NOW() - INTERVAL ? MINUTE)
               AND (email = ? OR ip_address = ?)'
        );
        $stmt->execute([self::WINDOW_MINUTES, mb_strtolower($email), $ip]);
        $row = $stmt->fetch();
        return (int) ($row['cnt'] ?? 0) >= self::MAX_ATTEMPTS;
    }

    public static function record(string $email, string $ip): void
    {
        $stmt = db()->prepare(
            'INSERT INTO login_attempts (email, ip_address) VALUES (?, ?)'
        );
        $stmt->execute([mb_strtolower($email), $ip]);
    }

    public static function clear(string $email): void
    {
        $stmt = db()->prepare('DELETE FROM login_attempts WHERE email = ?');
        $stmt->execute([mb_strtolower($email)]);
    }
}
