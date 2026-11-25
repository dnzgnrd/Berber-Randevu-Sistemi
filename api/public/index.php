<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

$method = Request::method();
$path = Request::path();
if ($path === '') {
    $path = '/';
}

try {
    // Sağlık
    if ($method === 'GET' && ($path === '/' || $path === '/health')) {
        Response::ok(['service' => 'Bre Berber API', 'time' => date('c')]);
        exit;
    }

    // CSRF / auth
    if ($method === 'GET' && $path === '/csrf') {
        AuthController::csrf();
        exit;
    }
    if ($method === 'GET' && $path === '/auth/me') {
        AuthController::me();
        exit;
    }
    if ($method === 'POST' && $path === '/auth/register') {
        AuthController::register();
        exit;
    }
    if ($method === 'POST' && $path === '/auth/login') {
        AuthController::login();
        exit;
    }
    if ($method === 'POST' && $path === '/auth/logout') {
        AuthController::logout();
        exit;
    }

    // Shop
    if ($method === 'GET' && $path === '/shop/settings') {
        ShopController::settings();
        exit;
    }
    if ($method === 'GET' && $path === '/shop/working-hours') {
        ShopController::workingHours();
        exit;
    }
    if ($method === 'GET' && $path === '/shop/days-off') {
        ShopController::daysOff();
        exit;
    }

    // Services
    if ($method === 'GET' && $path === '/services') {
        ServiceController::listPublic();
        exit;
    }
    if ($method === 'GET' && $path === '/admin/services') {
        ServiceController::listAdmin();
        exit;
    }
    if ($method === 'POST' && $path === '/admin/services') {
        ServiceController::create();
        exit;
    }
    if ($method === 'PUT' && preg_match('#^/admin/services/(\d+)$#', $path, $m)) {
        ServiceController::update((int) $m[1]);
        exit;
    }

    // Appointments (customer)
    if ($method === 'GET' && $path === '/appointments/slots') {
        AppointmentController::slots();
        exit;
    }
    if ($method === 'POST' && $path === '/appointments') {
        AppointmentController::create();
        exit;
    }
    if ($method === 'GET' && $path === '/appointments/mine') {
        AppointmentController::mine();
        exit;
    }
    if ($method === 'POST' && preg_match('#^/appointments/(\d+)/cancel$#', $path, $m)) {
        AppointmentController::cancel((int) $m[1]);
        exit;
    }

    // Admin appointments
    if ($method === 'GET' && $path === '/admin/notifications') {
        AdminController::notifications();
        exit;
    }
    if ($method === 'GET' && $path === '/admin/appointments/pending') {
        AdminController::pending();
        exit;
    }
    if ($method === 'GET' && $path === '/admin/appointments/day') {
        AdminController::day();
        exit;
    }
    if ($method === 'GET' && $path === '/admin/appointments') {
        AdminController::listAll();
        exit;
    }
    if ($method === 'POST' && preg_match('#^/admin/appointments/(\d+)/approve$#', $path, $m)) {
        AdminController::setStatus((int) $m[1], 'approved');
        exit;
    }
    if ($method === 'POST' && preg_match('#^/admin/appointments/(\d+)/reject$#', $path, $m)) {
        AdminController::setStatus((int) $m[1], 'rejected');
        exit;
    }
    if ($method === 'PUT' && $path === '/admin/working-hours') {
        AdminController::updateWorkingHours();
        exit;
    }
    if ($method === 'POST' && $path === '/admin/days-off') {
        AdminController::addDayOff();
        exit;
    }
    if ($method === 'DELETE' && preg_match('#^/admin/days-off/(\d+)$#', $path, $m)) {
        AdminController::removeDayOff((int) $m[1]);
        exit;
    }

    // Gallery
    if ($method === 'GET' && $path === '/gallery') {
        GalleryController::listPublic();
        exit;
    }
    if ($method === 'POST' && $path === '/admin/gallery') {
        GalleryController::upload();
        exit;
    }
    if ($method === 'DELETE' && preg_match('#^/admin/gallery/(\d+)$#', $path, $m)) {
        GalleryController::delete((int) $m[1]);
        exit;
    }

    Response::error('Endpoint bulunamadı.', 404);
} catch (Throwable $e) {
    $msg = env('APP_ENV', 'local') === 'local'
        ? $e->getMessage()
        : 'Sunucu hatası.';
    Response::error($msg, 500);
}
