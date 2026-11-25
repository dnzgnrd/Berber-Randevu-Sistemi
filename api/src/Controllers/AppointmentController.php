<?php

declare(strict_types=1);

final class AppointmentController
{
    public static function slots(): void
    {
        $date = Request::query('date');
        if ($date === null) {
            Response::error('date parametresi gerekli.');
            return;
        }
        try {
            $slots = SlotService::daySlots($date);
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage());
            return;
        }
        Response::ok([
            'date' => $date,
            'slot_minutes' => SlotService::slotMinutes(),
            'slots' => $slots,
        ]);
    }

    public static function create(): void
    {
        $user = Auth::requireLogin();
        if (($user['role'] ?? '') === 'admin') {
            Response::error('Admin hesabı ile müşteri randevusu alınamaz. Randevuları admin panelinden yönet.', 403);
            return;
        }
        Csrf::requireValid();
        $body = Request::jsonBody();

        $serviceId = (int) ($body['service_id'] ?? 0);
        $date = (string) ($body['date'] ?? '');
        $start = (string) ($body['start_time'] ?? '');

        if ($serviceId <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $start)) {
            Response::error('Hizmet, tarih ve saat gerekli.');
            return;
        }

        $svcStmt = db()->prepare(
            'SELECT id, duration_min FROM services WHERE id = ? AND is_active = 1 LIMIT 1'
        );
        $svcStmt->execute([$serviceId]);
        $service = $svcStmt->fetch();
        if (!$service) {
            Response::error('Hizmet bulunamadı.');
            return;
        }

        $slots = SlotService::daySlots($date);
        $match = null;
        foreach ($slots as $slot) {
            if ($slot['start'] === $start) {
                $match = $slot;
                break;
            }
        }
        if ($match === null || $match['status'] !== 'available') {
            Response::error('Bu saat müsait değil.');
            return;
        }

        $duration = (int) $service['duration_min'];
        $startDt = DateTimeImmutable::createFromFormat('Y-m-d H:i', $date . ' ' . $start);
        if (!$startDt) {
            Response::error('Geçersiz saat.');
            return;
        }
        $endDt = $startDt->modify('+' . $duration . ' minutes');

        // Çoklu slot hizmetler: kapsanan tüm 30dk dilimler boş olmalı
        $slotMin = SlotService::slotMinutes();
        $needed = (int) ceil($duration / $slotMin);
        $cursor = $startDt;
        for ($i = 0; $i < $needed; $i++) {
            $key = $cursor->format('H:i');
            $ok = false;
            foreach ($slots as $slot) {
                if ($slot['start'] === $key && $slot['status'] === 'available') {
                    $ok = true;
                    break;
                }
            }
            if (!$ok) {
                Response::error('Seçilen hizmet için yeterli boş süre yok.');
                return;
            }
            $cursor = $cursor->modify('+' . $slotMin . ' minutes');
        }

        $pdo = db();
        try {
            $pdo->beginTransaction();

            // Aynı günün aktif randevularını kilitle, sonra çakışma bak
            $lock = $pdo->prepare(
                "SELECT id FROM appointments
                 WHERE appt_date = ? AND status IN ('pending', 'approved')
                 FOR UPDATE"
            );
            $lock->execute([$date]);

            $overlap = $pdo->prepare(
                "SELECT id FROM appointments
                 WHERE appt_date = ?
                   AND status IN ('pending', 'approved')
                   AND start_time < ?
                   AND end_time > ?
                 LIMIT 1"
            );
            $overlap->execute([
                $date,
                $endDt->format('H:i:s'),
                $startDt->format('H:i:s'),
            ]);
            if ($overlap->fetch()) {
                $pdo->rollBack();
                Response::error('Bu saat dilimi dolu.', 409);
                return;
            }

            $ins = $pdo->prepare(
                'INSERT INTO appointments (user_id, service_id, appt_date, start_time, end_time, status)
                 VALUES (?, ?, ?, ?, ?, \'pending\')'
            );
            $ins->execute([
                (int) $user['id'],
                $serviceId,
                $date,
                $startDt->format('H:i:s'),
                $endDt->format('H:i:s'),
            ]);
            $apptId = (int) $pdo->lastInsertId();
            $pdo->commit();
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            if ((int) $e->getCode() === 23000) {
                Response::error('Bu saat dilimi dolu.', 409);
                return;
            }
            throw $e;
        }

        Response::ok(['id' => $apptId, 'status' => 'pending'], 201);
    }

    public static function mine(): void
    {
        $user = Auth::requireLogin();
        $stmt = db()->prepare(
            'SELECT a.id, a.appt_date, a.start_time, a.end_time, a.status, a.created_at,
                    s.name AS service_name, s.duration_min, s.price
             FROM appointments a
             JOIN services s ON s.id = a.service_id
             WHERE a.user_id = ?
             ORDER BY a.appt_date DESC, a.start_time DESC'
        );
        $stmt->execute([(int) $user['id']]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['start_time'] = substr((string) $row['start_time'], 0, 5);
            $row['end_time'] = substr((string) $row['end_time'], 0, 5);
            $row['duration_min'] = (int) $row['duration_min'];
            $row['price'] = (float) $row['price'];
            $row['can_cancel'] = self::canCancel($row['appt_date'], $row['start_time'], $row['status']);
        }
        Response::ok($rows);
    }

    public static function cancel(int $id): void
    {
        $user = Auth::requireLogin();
        Csrf::requireValid();

        $stmt = db()->prepare(
            'SELECT id, user_id, appt_date, start_time, status FROM appointments WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $appt = $stmt->fetch();
        if (!$appt || (int) $appt['user_id'] !== (int) $user['id']) {
            Response::error('Randevu bulunamadı.', 404);
            return;
        }
        if (!in_array($appt['status'], ['pending', 'approved'], true)) {
            Response::error('Bu randevu iptal edilemez.');
            return;
        }
        $start = substr((string) $appt['start_time'], 0, 5);
        if (!self::canCancel($appt['appt_date'], $start, $appt['status'])) {
            Response::error('İptal için en az 2 saat önce olmalı.');
            return;
        }

        $upd = db()->prepare(
            "UPDATE appointments SET status = 'cancelled' WHERE id = ? AND user_id = ?"
        );
        $upd->execute([$id, (int) $user['id']]);
        Response::ok(['cancelled' => true]);
    }

    private static function canCancel(string $date, string $startHm, string $status): bool
    {
        if (!in_array($status, ['pending', 'approved'], true)) {
            return false;
        }
        $start = DateTimeImmutable::createFromFormat('Y-m-d H:i', $date . ' ' . $startHm);
        if (!$start) {
            return false;
        }
        $hours = SlotService::cancelHoursBefore();
        $deadline = $start->modify('-' . $hours . ' hours');
        return new DateTimeImmutable('now') <= $deadline;
    }
}
