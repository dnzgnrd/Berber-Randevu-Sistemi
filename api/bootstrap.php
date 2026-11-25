<?php

declare(strict_types=1);

require_once __DIR__ . '/config/env.php';
load_env(__DIR__ . '/.env');

date_default_timezone_set(env('APP_TIMEZONE', 'Europe/Istanbul') ?: 'Europe/Istanbul');

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/src/Request.php';
require_once __DIR__ . '/src/Response.php';
require_once __DIR__ . '/src/Csrf.php';
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/RateLimit.php';
require_once __DIR__ . '/src/Services/SlotService.php';
require_once __DIR__ . '/src/Controllers/ShopController.php';
require_once __DIR__ . '/src/Controllers/ServiceController.php';
require_once __DIR__ . '/src/Controllers/AuthController.php';
require_once __DIR__ . '/src/Controllers/AppointmentController.php';
require_once __DIR__ . '/src/Controllers/AdminController.php';
require_once __DIR__ . '/src/Controllers/GalleryController.php';

$origin = env('FRONTEND_ORIGIN', 'http://localhost:5173');
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if (Request::method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$sessionName = env('SESSION_NAME', 'bre_berber_session');
session_name($sessionName);

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
