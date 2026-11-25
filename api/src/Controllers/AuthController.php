<?php

declare(strict_types=1);

final class AuthController
{
    public static function csrf(): void
    {
        Response::ok(['csrf_token' => Csrf::token()]);
    }

    public static function me(): void
    {
        $user = Auth::user();
        Response::ok([
            'user' => $user,
            'csrf_token' => Csrf::token(),
        ]);
    }

    public static function register(): void
    {
        Csrf::requireValid();
        $body = Request::jsonBody();
        $name = trim((string) ($body['name'] ?? ''));
        $phone = preg_replace('/\s+/', '', (string) ($body['phone'] ?? '')) ?? '';
        $email = mb_strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        if ($name === '' || $phone === '' || $email === '' || strlen($password) < 8) {
            Response::error('Ad, telefon, e-posta ve en az 8 karakter şifre gerekli.');
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Geçerli bir e-posta gir.');
            return;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        try {
            $stmt = db()->prepare(
                'INSERT INTO users (name, phone, email, password_hash, role)
                 VALUES (?, ?, ?, ?, \'customer\')'
            );
            $stmt->execute([$name, $phone, $email, $hash]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000) {
                Response::error('Bu e-posta veya telefon zaten kayıtlı.', 409);
                return;
            }
            throw $e;
        }

        $id = (int) db()->lastInsertId();
        Auth::login($id);
        Response::ok([
            'user' => Auth::user(),
            'csrf_token' => Csrf::token(),
        ], 201);
    }

    public static function login(): void
    {
        Csrf::requireValid();
        $body = Request::jsonBody();
        $email = mb_strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $ip = Request::ip();

        if ($email === '' || $password === '') {
            Response::error('E-posta ve şifre gerekli.');
            return;
        }

        if (RateLimit::tooMany($email, $ip)) {
            Response::error('Çok fazla deneme. 15 dakika sonra tekrar dene.', 429);
            return;
        }

        $stmt = db()->prepare(
            'SELECT id, password_hash FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($password, $row['password_hash'])) {
            RateLimit::record($email, $ip);
            Response::error('E-posta veya şifre hatalı.', 401);
            return;
        }

        RateLimit::clear($email);
        Auth::login((int) $row['id']);
        Response::ok([
            'user' => Auth::user(),
            'csrf_token' => Csrf::token(),
        ]);
    }

    public static function logout(): void
    {
        Csrf::requireValid();
        Auth::logout();
        Response::ok(['logged_out' => true]);
    }
}
