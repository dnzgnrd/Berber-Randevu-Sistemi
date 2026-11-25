<?php

declare(strict_types=1);

/**
 * sql/001_schema.sql ve sql/002_seed.sql dosyalarını çalıştırır.
 * Kullanım: php api/scripts/migrate.php
 */

require_once dirname(__DIR__) . '/config/env.php';
load_env(dirname(__DIR__) . '/.env');

$host = env('DB_HOST', '127.0.0.1');
$port = env('DB_PORT', '3306');
$user = env('DB_USER', 'root');
$pass = env('DB_PASS', '');

$root = dirname(__DIR__, 2);
$files = [
    $root . '/sql/001_schema.sql',
    $root . '/sql/002_seed.sql',
];

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $host, $port),
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    fwrite(STDERR, "MySQL bağlantısı başarısız: {$e->getMessage()}\n");
    exit(1);
}

foreach ($files as $file) {
    if (!is_file($file)) {
        fwrite(STDERR, "Dosya yok: {$file}\n");
        exit(1);
    }
    $sql = file_get_contents($file);
    if ($sql === false) {
        fwrite(STDERR, "Okunamadı: {$file}\n");
        exit(1);
    }
    echo 'Çalıştırılıyor: ' . basename($file) . "\n";
    $pdo->exec($sql);
}

echo "Migrasyon tamam.\n";
