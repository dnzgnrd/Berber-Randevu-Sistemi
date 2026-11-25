<?php

declare(strict_types=1);

// Galeri dosyalarını güvenli servis etmek için basit yönlendirici (Apache Alias yoksa)
// Kullanım: /berber/api/public/uploads.php?f=gallery/xxx.webp

$f = $_GET['f'] ?? '';
$f = str_replace(['..', '\\'], '', $f);
$f = ltrim($f, '/');
$base = dirname(__DIR__) . '/uploads';
$full = realpath($base . '/' . $f);

if ($full === false || !str_starts_with($full, realpath($base)) || !is_file($full)) {
    http_response_code(404);
    exit('Not found');
}

$mime = mime_content_type($full) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=86400');
readfile($full);
