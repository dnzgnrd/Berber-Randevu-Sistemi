<?php

declare(strict_types=1);

final class SlotService
{
    public static function slotMinutes(): int
    {
        $stmt = db()->prepare('SELECT setting_value FROM shop_settings WHERE setting_key = ?');
        $stmt->execute(['slot_minutes']);
        $row = $stmt->fetch();
        $n = (int) ($row['setting_value'] ?? 30);
        return $n > 0 ? $n : 30;
    }

    public static function cancelHoursBefore(): int
    {
        $stmt = db()->prepare('SELECT setting_value FROM shop_settings WHERE setting_key = ?');
        $stmt->execute(['cancel_hours_before']);
        $row = $stmt->fetch();
        $n = (int) ($row['setting_value'] ?? 2);
        return $n > 0 ? $n : 2;
    }

    /**
     * @return list<array{start:string,end:string,status:string}>
     */
    public static function daySlots(string $date): array
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new InvalidArgumentException('Geçersiz tarih.');
        }

        $dt = DateTimeImmutable::createFromFormat('Y-m-d', $date);
        if (!$dt || $dt->format('Y-m-d') !== $date) {
            throw new InvalidArgumentException('Geçersiz tarih.');
        }

        $weekday = (int) $dt->format('w'); // 0=Pazar

        $offStmt = db()->prepare('SELECT id FROM days_off WHERE off_date = ? LIMIT 1');
        $offStmt->execute([$date]);
        if ($offStmt->fetch()) {
            return [];
        }

        $whStmt = db()->prepare(
            'SELECT open_time, close_time, is_closed FROM working_hours WHERE weekday = ? LIMIT 1'
        );
        $whStmt->execute([$weekday]);
        $wh = $whStmt->fetch();
        if (!$wh || (int) $wh['is_closed'] === 1) {
            return [];
        }

        $slotMin = self::slotMinutes();
        $open = substr((string) $wh['open_time'], 0, 8);
        $close = substr((string) $wh['close_time'], 0, 8);

        $bookedStmt = db()->prepare(
            "SELECT start_time, end_time FROM appointments
             WHERE appt_date = ? AND status IN ('pending', 'approved')"
        );
        $bookedStmt->execute([$date]);
        $ranges = [];
        foreach ($bookedStmt->fetchAll() as $row) {
            $ranges[] = [
                'start' => substr((string) $row['start_time'], 0, 8),
                'end' => substr((string) $row['end_time'], 0, 8),
            ];
        }

        $tz = new DateTimeZone('Europe/Istanbul');
        $now = new DateTimeImmutable('now', $tz);
        $cursor = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $date . ' ' . $open, $tz);
        $endDay = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $date . ' ' . $close, $tz);
        if (!$cursor || !$endDay) {
            return [];
        }

        $slots = [];
        while ($cursor < $endDay) {
            $slotEnd = $cursor->modify('+' . $slotMin . ' minutes');
            if ($slotEnd > $endDay) {
                break;
            }
            $startKey = $cursor->format('H:i');
            $status = 'available';
            // Başlangıç saati geçtiyse alınamaz (bitişe kadar beklenmez)
            if ($cursor <= $now) {
                $status = 'past';
            } else {
                $s = $cursor->format('H:i:s');
                $e = $slotEnd->format('H:i:s');
                foreach ($ranges as $range) {
                    if ($s < $range['end'] && $e > $range['start']) {
                        $status = 'booked';
                        break;
                    }
                }
            }
            $slots[] = [
                'start' => $startKey,
                'end' => $slotEnd->format('H:i'),
                'status' => $status,
            ];
            $cursor = $slotEnd;
        }

        return $slots;
    }
}
