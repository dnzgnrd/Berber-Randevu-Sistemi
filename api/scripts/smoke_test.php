<?php

declare(strict_types=1);

/**
 * Aşama (a) duman testi — PHP + MySQL ayaktayken:
 * php api/scripts/smoke_test.php
 */

require_once dirname(__DIR__) . '/config/env.php';
load_env(dirname(__DIR__) . '/.env');
require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/src/Services/SlotService.php';

$fail = 0;
function check(string $label, bool $ok, string $detail = ''): void
{
    global $fail;
    if ($ok) {
        echo "[OK] {$label}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    } else {
        echo "[FAIL] {$label}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
        $fail++;
    }
}

try {
    $pdo = db();
    check('PDO bağlantısı', true);
} catch (Throwable $e) {
    check('PDO bağlantısı', false, $e->getMessage());
    exit(1);
}

$tables = ['users', 'services', 'appointments', 'working_hours', 'days_off', 'gallery', 'login_attempts', 'shop_settings'];
foreach ($tables as $t) {
    $stmt = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($t));
    check("Tablo {$t}", (bool) $stmt->fetch());
}

$svc = $pdo->query('SELECT COUNT(*) AS c FROM services')->fetch();
check('Hizmet seed', (int) ($svc['c'] ?? 0) >= 3, (string) ($svc['c'] ?? 0) . ' kayıt');

$wh = $pdo->query('SELECT COUNT(*) AS c FROM working_hours')->fetch();
check('Çalışma saati seed', (int) ($wh['c'] ?? 0) === 7);

$name = $pdo->prepare('SELECT setting_value FROM shop_settings WHERE setting_key = ?');
$name->execute(['shop_name']);
$row = $name->fetch();
check('shop_name', ($row['setting_value'] ?? '') === 'Bre Berber');

// Yarın için slot üret (Pazar ise öbür gün)
$d = new DateTimeImmutable('tomorrow');
for ($i = 0; $i < 7; $i++) {
    $candidate = $d->modify("+{$i} day");
    if ((int) $candidate->format('w') !== 0) {
        $d = $candidate;
        break;
    }
}
$slots = SlotService::daySlots($d->format('Y-m-d'));
check('Slot üretimi', count($slots) > 0, $d->format('Y-m-d') . ' → ' . count($slots) . ' slot');

// Unique slot_key var mı
$col = $pdo->query("SHOW COLUMNS FROM appointments LIKE 'slot_key'")->fetch();
check('slot_key kolonu', (bool) $col);

echo $fail === 0 ? "\nTüm kontroller geçti.\n" : "\n{$fail} kontrol başarısız.\n";
exit($fail === 0 ? 0 : 1);
