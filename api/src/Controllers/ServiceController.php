<?php

declare(strict_types=1);

final class ServiceController
{
    public static function listPublic(): void
    {
        $stmt = db()->query(
            'SELECT id, name, duration_min, price
             FROM services
             WHERE is_active = 1
             ORDER BY sort_order, id'
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['duration_min'] = (int) $row['duration_min'];
            $row['price'] = (float) $row['price'];
        }
        Response::ok($rows);
    }

    public static function listAdmin(): void
    {
        Auth::requireAdmin();
        $stmt = db()->query(
            'SELECT id, name, duration_min, price, is_active, sort_order
             FROM services
             ORDER BY sort_order, id'
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['duration_min'] = (int) $row['duration_min'];
            $row['price'] = (float) $row['price'];
            $row['is_active'] = (int) $row['is_active'] === 1;
            $row['sort_order'] = (int) $row['sort_order'];
        }
        Response::ok($rows);
    }

    public static function create(): void
    {
        Auth::requireAdmin();
        Csrf::requireValid();
        $body = Request::jsonBody();
        $name = trim((string) ($body['name'] ?? ''));
        $duration = (int) ($body['duration_min'] ?? 0);
        $price = (float) ($body['price'] ?? -1);
        $sort = (int) ($body['sort_order'] ?? 0);

        if ($name === '' || $duration <= 0 || $price < 0) {
            Response::error('Hizmet bilgileri eksik veya geçersiz.');
            return;
        }

        $stmt = db()->prepare(
            'INSERT INTO services (name, duration_min, price, sort_order) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$name, $duration, $price, $sort]);
        Response::ok(['id' => (int) db()->lastInsertId()], 201);
    }

    public static function update(int $id): void
    {
        Auth::requireAdmin();
        Csrf::requireValid();
        $body = Request::jsonBody();
        $name = trim((string) ($body['name'] ?? ''));
        $duration = (int) ($body['duration_min'] ?? 0);
        $price = (float) ($body['price'] ?? -1);
        $sort = (int) ($body['sort_order'] ?? 0);
        $active = !empty($body['is_active']) ? 1 : 0;

        if ($name === '' || $duration <= 0 || $price < 0) {
            Response::error('Hizmet bilgileri eksik veya geçersiz.');
            return;
        }

        $stmt = db()->prepare(
            'UPDATE services
             SET name = ?, duration_min = ?, price = ?, sort_order = ?, is_active = ?
             WHERE id = ?'
        );
        $stmt->execute([$name, $duration, $price, $sort, $active, $id]);
        Response::ok(['updated' => true]);
    }
}
