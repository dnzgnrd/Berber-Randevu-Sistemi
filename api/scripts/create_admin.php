<?php

declare(strict_types=1);

/**
 * İlk admin hesabını .env değerleriyle oluşturur.
 * Kullanım (XAMPP php): php api/scripts/create_admin.php
 */

require_once dirname(__DIR__) . '/config/env.php';
load_env(dirname(__DIR__) . '/.env');
require_once dirname(__DIR__) . '/config/database.php';

$name = env('ADMIN_NAME', 'Admin');
$email = mb_strtolower((string) env('ADMIN_EMAIL', ''));
$phone = (string) env('ADMIN_PHONE', '');
$password = (string) env('ADMIN_PASSWORD', '');

if ($email === '' || $phone === '' || strlen($password) < 8) {
    fwrite(STDERR, "ADMIN_EMAIL, ADMIN_PHONE ve ADMIN_PASSWORD (.env) gerekli (şifre min 8).\n");
    exit(1);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$pdo = db();

$check = $pdo->prepare('SELECT id, role FROM users WHERE email = ? LIMIT 1');
$check->execute([$email]);
$existing = $check->fetch();

if ($existing) {
    $upd = $pdo->prepare(
        'UPDATE users SET name = ?, phone = ?, password_hash = ?, role = \'admin\' WHERE id = ?'
    );
    $upd->execute([$name, $phone, $hash, (int) $existing['id']]);
    echo "Admin güncellendi: {$email}\n";
    exit(0);
}

try {
    $ins = $pdo->prepare(
        'INSERT INTO users (name, phone, email, password_hash, role)
         VALUES (?, ?, ?, ?, \'admin\')'
    );
    $ins->execute([$name, $phone, $email, $hash]);
    echo "Admin oluşturuldu: {$email}\n";
} catch (PDOException $e) {
    fwrite(STDERR, 'Hata: ' . $e->getMessage() . "\n");
    exit(1);
}
