<?php

declare(strict_types=1);

final class Auth
{
    public static function user(): ?array
    {
        if (empty($_SESSION['user_id'])) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, name, phone, email, role, created_at FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([(int) $_SESSION['user_id']]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function requireLogin(): array
    {
        $user = self::user();
        if ($user === null) {
            Response::error('Giriş yapmalısın.', 401);
            exit;
        }
        return $user;
    }

    public static function requireAdmin(): array
    {
        $user = self::requireLogin();
        if (($user['role'] ?? '') !== 'admin') {
            Response::error('Bu işlem için yetkin yok.', 403);
            exit;
        }
        return $user;
    }

    public static function login(int $userId): void
    {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        Csrf::token();
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
        }
        session_destroy();
    }
}
