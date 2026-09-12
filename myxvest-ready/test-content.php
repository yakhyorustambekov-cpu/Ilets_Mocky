<?php
// test-content.php - Sandboxed test content server for IELTS tests
$versionId = $_GET['versionId'] ?? '';
$requestedPath = $_GET['path'] ?? '';

if (!$versionId) {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (preg_match('#/test-content/([^/]+)(?:/(.*))?$#i', $uriPath, $m)) {
        $versionId = $m[1];
        $requestedPath = $m[2] ?? '';
    }
}

if (!$versionId) {
    http_response_code(400);
    echo "Missing versionId";
    exit;
}

// Load test.json
$testJsonPath = __DIR__ . '/test.json';
if (!file_exists($testJsonPath)) {
    http_response_code(404);
    echo "test.json not found";
    exit;
}

$tests = json_decode(file_get_contents($testJsonPath), true) ?: [];
$matchedVersion = null;
foreach ($tests as $t) {
    if (!empty($t['versions']) && is_array($t['versions'])) {
        foreach ($t['versions'] as $v) {
            if ($v['id'] === $versionId) {
                $matchedVersion = $v;
                break 2;
            }
        }
    }
}

if (!$matchedVersion) {
    http_response_code(404);
    echo "Test version not found";
    exit;
}

$storagePath = $matchedVersion['storagePath'];
$entryFile = $matchedVersion['entryFile'] ?? 'index.html';

$targetRel = $requestedPath ? $requestedPath : $entryFile;
$baseDir = realpath(__DIR__ . '/uploads/' . $storagePath);
$fullPath = realpath(__DIR__ . '/uploads/' . $storagePath . '/' . $targetRel);

// Prevent path traversal
if (!$fullPath || !$baseDir || strpos($fullPath, $baseDir) !== 0 || !file_exists($fullPath)) {
    $entryFullPath = realpath(__DIR__ . '/uploads/' . $storagePath . '/' . $entryFile);
    if ($entryFullPath && file_exists($entryFullPath)) {
        $fullPath = $entryFullPath;
    } else {
        http_response_code(404);
        echo "File not found";
        exit;
    }
}

header("Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; media-src 'self' data: blob: *; img-src 'self' data: blob: *; style-src 'self' 'unsafe-inline' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; font-src 'self' data: *; frame-ancestors *;");
header("X-Content-Type-Options: nosniff");
header("Cross-Origin-Resource-Policy: cross-origin");

$ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
$mimes = [
    'html' => 'text/html; charset=UTF-8',
    'htm' => 'text/html; charset=UTF-8',
    'css' => 'text/css; charset=UTF-8',
    'js' => 'application/javascript; charset=UTF-8',
    'json' => 'application/json',
    'svg' => 'image/svg+xml',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'wav' => 'audio/wav',
    'mp3' => 'audio/mpeg',
    'ogg' => 'audio/ogg',
    'woff' => 'font/woff',
    'woff2' => 'font/woff2',
    'ttf' => 'font/ttf',
];

$mime = $mimes[$ext] ?? 'application/octet-stream';
header("Content-Type: $mime");
header("Content-Length: " . filesize($fullPath));

readfile($fullPath);
exit;
