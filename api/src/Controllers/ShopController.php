<?php

declare(strict_types=1);

final class ShopController
{
    public static function settings(): void
    {
        $stmt = db()->query('SELECT setting_key, setting_value FROM shop_settings');
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[$row['setting_key']] = $row['setting_value'];
        }
        Response::ok($out);
    }

    public static function workingHours(): void
    {
        $stmt = db()->query(
            'SELECT weekday, open_time, close_time, is_closed FROM working_hours ORDER BY weekday'
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['open_time'] = substr((string) $row['open_time'], 0, 5);
            $row['close_time'] = substr((string) $row['close_time'], 0, 5);
            $row['is_closed'] = (int) $row['is_closed'] === 1;
            $row['weekday'] = (int) $row['weekday'];
        }
        Response::ok($rows);
    }

    public static function daysOff(): void
    {
        $from = Request::query('from');
        $to = Request::query('to');
        $sql = 'SELECT id, off_date, note FROM days_off';
        $params = [];
        if ($from && $to) {
            $sql .= ' WHERE off_date BETWEEN ? AND ?';
            $params = [$from, $to];
        }
        $sql .= ' ORDER BY off_date';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        Response::ok($stmt->fetchAll());
    }
}
