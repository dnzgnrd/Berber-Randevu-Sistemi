<?php

declare(strict_types=1);

final class AdminController
{
    public static function pending(): void
    {
        Auth::requireAdmin();
        $stmt = db()->query(
            "SELECT a.id, a.appt_date, a.start_time, a.end_time, a.status, a.created_at,
                    u.name AS customer_name, u.phone AS customer_phone,
                    s.name AS service_name
             FROM appointments a
             JOIN users u ON u.id = a.user_id
             JOIN services s ON s.id = a.service_id
             WHERE a.status = 'pending'
             ORDER BY a.appt_date, a.start_time"
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['start_time'] = substr((string) $row['start_time'], 0, 5);
            $row['end_time'] = substr((string) $row['end_time'], 0, 5);
        }
        Response::ok($rows);
    }

    /** Bildirim özeti — bekleyen sayısı + son istekler */
    public static function notifications(): void
    {
        Auth::requireAdmin();
        $since = Request::query('since'); // ISO veya Y-m-d H:i:s

        $countStmt = db()->query(
            "SELECT COUNT(*) AS cnt FROM appointments WHERE status = 'pending'"
        );
        $pendingCount = (int) ($countStmt->fetch()['cnt'] ?? 0);

        $sql = "SELECT a.id, a.appt_date, a.start_time, a.end_time, a.status, a.created_at,
                       u.name AS customer_name, u.phone AS customer_phone,
                       s.name AS service_name
                FROM appointments a
                JOIN users u ON u.id = a.user_id
                JOIN services s ON s.id = a.service_id
                WHERE a.status = 'pending'";
        $params = [];
        if ($since !== null && $since !== '') {
            $sql .= ' AND a.created_at > ?';
            $params[] = $since;
        }
        $sql .= ' ORDER BY a.created_at DESC LIMIT 10';

        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['start_time'] = substr((string) $row['start_time'], 0, 5);
            $row['end_time'] = substr((string) $row['end_time'], 0, 5);
        }

        Response::ok([
            'pending_count' => $pendingCount,
            'server_time' => date('Y-m-d H:i:s'),
            'items' => $rows,
        ]);
    }

    public static function day(): void
    {
        Auth::requireAdmin();
        $date = Request::query('date');
        if ($date === null || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            Response::error('date parametresi gerekli.');
            return;
        }
        // Günlük takvimde tüm durumlar görünsün (onaylı, beklemede, iptal, red)
        $stmt = db()->prepare(
            "SELECT a.id, a.appt_date, a.start_time, a.end_time, a.status,
                    u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
                    s.name AS service_name, s.duration_min, s.price
             FROM appointments a
             JOIN users u ON u.id = a.user_id
             JOIN services s ON s.id = a.service_id
             WHERE a.appt_date = ?
             ORDER BY a.start_time, a.id"
        );
        $stmt->execute([$date]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['start_time'] = substr((string) $row['start_time'], 0, 5);
            $row['end_time'] = substr((string) $row['end_time'], 0, 5);
            $row['duration_min'] = (int) $row['duration_min'];
            $row['price'] = (float) $row['price'];
        }
        Response::ok(['date' => $date, 'appointments' => $rows]);
    }

    /** Tüm randevular — isteğe bağlı status filtresi */
    public static function listAll(): void
    {
        Auth::requireAdmin();
        $status = Request::query('status');
        $allowed = ['pending', 'approved', 'rejected', 'cancelled'];

        $sql = "SELECT a.id, a.appt_date, a.start_time, a.end_time, a.status, a.created_at,
                       u.name AS customer_name, u.phone AS customer_phone,
                       s.name AS service_name
                FROM appointments a
                JOIN users u ON u.id = a.user_id
                JOIN services s ON s.id = a.service_id";
        $params = [];
        if ($status !== null && $status !== '' && $status !== 'all') {
            if (!in_array($status, $allowed, true)) {
                Response::error('Geçersiz status.');
                return;
            }
            $sql .= ' WHERE a.status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY a.appt_date DESC, a.start_time DESC, a.id DESC LIMIT 100';

        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['start_time'] = substr((string) $row['start_time'], 0, 5);
            $row['end_time'] = substr((string) $row['end_time'], 0, 5);
        }
        Response::ok($rows);
    }

    public static function setStatus(int $id, string $status): void
    {
        Auth::requireAdmin();
        Csrf::requireValid();
        if (!in_array($status, ['approved', 'rejected'], true)) {
            Response::error('Geçersiz durum.');
            return;
        }

        $stmt = db()->prepare(
            "SELECT id, status FROM appointments WHERE id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        $appt = $stmt->fetch();
        if (!$appt) {
            Response::error('Randevu bulunamadı.', 404);
            return;
        }
        if ($appt['status'] !== 'pending') {
            Response::error('Sadece bekleyen randevular onaylanabilir/reddilebilir.');
            return;
        }

        $upd = db()->prepare('UPDATE appointments SET status = ? WHERE id = ? AND status = \'pending\'');
        $upd->execute([$status, $id]);
        Response::ok(['id' => $id, 'status' => $status]);
    }

    public static function updateWorkingHours(): void
    {
        Auth::requireAdmin();
        Csrf::requireValid();
        $body = Request::jsonBody();
        $items = $body['hours'] ?? null;
        if (!is_array($items)) {
            Response::error('hours dizisi gerekli.');
            return;
        }

        $pdo = db();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO working_hours (weekday, open_time, close_time, is_closed)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   open_time = VALUES(open_time),
                   close_time = VALUES(close_time),
                   is_closed = VALUES(is_closed)'
            );
            foreach ($items as $item) {
                $weekday = (int) ($item['weekday'] ?? -1);
                if ($weekday < 0 || $weekday > 6) {
                    continue;
                }
                $open = self::normalizeTime((string) ($item['open_time'] ?? '09:00'));
                $close = self::normalizeTime((string) ($item['close_time'] ?? '19:00'));
                $closed = !empty($item['is_closed']) ? 1 : 0;
                $stmt->execute([$weekday, $open, $close, $closed]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        Response::ok(['updated' => true]);
    }

    public static function addDayOff(): void
    {
        Auth::requireAdmin();
        Csrf::requireValid();
        $body = Request::jsonBody();
        $date = (string) ($body['date'] ?? '');
        $note = trim((string) ($body['note'] ?? ''));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            Response::error('Geçerli bir tarih gir.');
            return;
        }
        try {
            $stmt = db()->prepare('INSERT INTO days_off (off_date, note) VALUES (?, ?)');
            $stmt->execute([$date, $note !== '' ? $note : null]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000) {
                Response::error('Bu gün zaten tatil olarak kayıtlı.', 409);
                return;
            }
            throw $e;
        }
        Response::ok(['id' => (int) db()->lastInsertId()], 201);
    }

    public static function removeDayOff(int $id): void
    {
        Auth::requireAdmin();
        Csrf::requireValid();
        $stmt = db()->prepare('DELETE FROM days_off WHERE id = ?');
        $stmt->execute([$id]);
        Response::ok(['deleted' => true]);
    }

    private static function normalizeTime(string $time): string
    {
        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $time)) {
            return $time;
        }
        if (preg_match('/^\d{2}:\d{2}$/', $time)) {
            return $time . ':00';
        }
        return '09:00:00';
    }
}
