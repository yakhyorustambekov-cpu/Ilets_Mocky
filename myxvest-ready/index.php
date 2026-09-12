<?php
// IELTS Mock Platform - Root Universal Router & SPA Entry
// Automatically serves index.html and falls back to API/test-content handlers

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);

// 1. If requesting API (/api or /api/*)
if ($path === '/api' || strpos($path, '/api/') === 0) {
    $endpoint = preg_replace('#^/api/?#', '', $path);
    $_GET['endpoint'] = $endpoint;
    require_once __DIR__ . '/api/index.php';
    exit;
}

// 2. If requesting test content (/test-content/*)
if (strpos($path, '/test-content/') === 0) {
    $sub = preg_replace('#^/test-content/?#', '', $path);
    $parts = explode('/', $sub, 2);
    $_GET['versionId'] = $parts[0] ?? '';
    $_GET['path'] = $parts[1] ?? '';
    require_once __DIR__ . '/test-content.php';
    exit;
}

// 3. If requesting an actual static file (like assets, images, etc.)
$realFile = __DIR__ . '/' . ltrim($path, '/');
if ($path !== '/' && file_exists($realFile) && !is_dir($realFile)) {
    $ext = strtolower(pathinfo($realFile, PATHINFO_EXTENSION));
    $mimes = [
        'js' => 'application/javascript; charset=UTF-8',
        'css' => 'text/css; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'wav' => 'audio/wav',
        'mp3' => 'audio/mpeg',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'html' => 'text/html; charset=UTF-8',
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
    }
    readfile($realFile);
    exit;
}

// 4. Default: Serve React Single Page Application index.html
$indexPath = __DIR__ . '/index.html';
if (file_exists($indexPath)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($indexPath);
    exit;
}

http_response_code(404);
echo "Error: index.html not found in " . htmlspecialchars(__DIR__);
