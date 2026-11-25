<?php

declare(strict_types=1);

final class GalleryController
{
    public static function listPublic(): void
    {
        $stmt = db()->query(
            'SELECT id, file_path, alt_text, sort_order FROM gallery ORDER BY sort_order, id'
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['sort_order'] = (int) $row['sort_order'];
        }
        Response::ok($rows);
    }

    public static function upload(): void
    {
        Auth::requireAdmin();
        Csrf::requireValid();

        if (!isset($_FILES['photo']) || !is_array($_FILES['photo'])) {
            Response::error('photo dosyası gerekli.');
            return;
        }
        $file = $_FILES['photo'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error('Dosya yüklenemedi.');
            return;
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];
        if (!is_string($mime) || !isset($allowed[$mime])) {
            Response::error('Sadece JPG, PNG veya WebP.');
            return;
        }
        if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
            Response::error('Dosya en fazla 5 MB olabilir.');
            return;
        }

        $dir = dirname(__DIR__, 2) . '/uploads/gallery';
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            Response::error('Yükleme klasörü oluşturulamadı.', 500);
            return;
        }

        $name = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
        $dest = $dir . '/' . $name;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            Response::error('Dosya kaydedilemedi.', 500);
            return;
        }

        $alt = trim((string) ($_POST['alt_text'] ?? ''));
        $sort = (int) ($_POST['sort_order'] ?? 0);
        $rel = 'uploads/gallery/' . $name;

        $stmt = db()->prepare(
            'INSERT INTO gallery (file_path, alt_text, sort_order) VALUES (?, ?, ?)'
        );
        $stmt->execute([$rel, $alt, $sort]);
        Response::ok([
            'id' => (int) db()->lastInsertId(),
            'file_path' => $rel,
            'alt_text' => $alt,
        ], 201);
    }

    public static function delete(int $id): void
    {
        Auth::requireAdmin();
        Csrf::requireValid();

        $stmt = db()->prepare('SELECT id, file_path FROM gallery WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            Response::error('Fotoğraf bulunamadı.', 404);
            return;
        }

        $del = db()->prepare('DELETE FROM gallery WHERE id = ?');
        $del->execute([$id]);

        $full = dirname(__DIR__, 2) . '/' . ltrim((string) $row['file_path'], '/');
        if (is_file($full)) {
            @unlink($full);
        }
        Response::ok(['deleted' => true]);
    }
}
