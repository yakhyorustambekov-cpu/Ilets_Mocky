<?php
// IELTS Platform API Router for PHP Hosting (MyXvest.ru / cPanel / Apache)
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=UTF-8');

define('TEST_JSON_FILE', __DIR__ . '/../test.json');
define('USERS_FILE', __DIR__ . '/../data/users.json');
define('ATTEMPTS_FILE', __DIR__ . '/../data/attempts.json');
define('SETTINGS_FILE', __DIR__ . '/../data/settings.json');
define('UPLOADS_DIR', __DIR__ . '/../uploads');
define('JWT_SECRET', 'ielts-mock-super-secure-production-secret-key-987654');

function json_input() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?: [];
}

function json_res($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_err($message, $code = 400) {
    json_res(['error' => $message], $code);
}

function read_json($path, $default = []) {
    if (!file_exists($path)) return $default;
    $raw = file_get_contents($path);
    return json_decode($raw, true) ?: $default;
}

function write_json($path, $data) {
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

function create_token($payload) {
    $header = base64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload['iat'] = time();
    $payload['exp'] = time() + (86400 * 30);
    $body = base64url_encode(json_encode($payload));
    $sig = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$sig";
}

function verify_token($token) {
    if (!$token) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    list($header, $body, $sig) = $parts;
    $calc = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (!hash_equals($calc, $sig)) return null;
    $payload = json_decode(base64url_decode($body), true);
    if (!$payload || (isset($payload['exp']) && $payload['exp'] < time())) return null;
    return $payload;
}

function get_auth_user() {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$auth && function_exists('getallheaders')) {
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (preg_match('/Bearer\s+(\S+)/i', $auth, $m)) {
        $p = verify_token($m[1]);
        if ($p && isset($p['id'])) {
            $users = read_json(USERS_FILE);
            foreach ($users as $u) {
                if ($u['id'] === $p['id']) return $u;
            }
        }
    }
    return null;
}

function require_auth() {
    $u = get_auth_user();
    if (!$u) json_err('Unauthorized', 401);
    return $u;
}

function require_admin() {
    $u = require_auth();
    if (($u['role'] ?? '') !== 'ADMIN') json_err('Forbidden: Admin access required', 403);
    return $u;
}

$method = $_SERVER['REQUEST_METHOD'];

$endpoint = $_GET['endpoint'] ?? '';
if (!$endpoint) {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (preg_match('#/api(?:/index\.php)?/?(.*)$#i', $uriPath, $m)) {
        $endpoint = $m[1];
    } elseif (preg_match('#/index\.php/?(.*)$#i', $uriPath, $m)) {
        $endpoint = $m[1];
    } elseif (!empty($_SERVER['PATH_INFO'])) {
        $endpoint = $_SERVER['PATH_INFO'];
    }
}
$endpoint = '/' . trim($endpoint, '/');
$parts = explode('/', trim($endpoint, '/'));

// 1. AUTH
if ($parts[0] === 'auth') {
    $sub = $parts[1] ?? '';
    $users = read_json(USERS_FILE);

    if ($sub === 'login' && $method === 'POST') {
        $in = json_input();
        $email = strtolower(trim($in['email'] ?? ''));
        $pass = $in['password'] ?? '';

        foreach ($users as $u) {
            if (strtolower($u['email']) === $email) {
                if ($u['password'] === $pass || password_verify($pass, $u['password'])) {
                    $token = create_token(['id' => $u['id'], 'email' => $u['email'], 'role' => $u['role']]);
                    unset($u['password']);
                    json_res(['token' => $token, 'user' => $u]);
                }
            }
        }
        json_err('Invalid email or password', 401);
    }

    if ($sub === 'signup' && $method === 'POST') {
        $in = json_input();
        $email = strtolower(trim($in['email'] ?? ''));
        $pass = $in['password'] ?? '';
        $first = trim($in['firstName'] ?? '');
        $last = trim($in['lastName'] ?? '');

        if (!$email || !$pass || !$first || !$last) json_err('All fields are required', 400);

        foreach ($users as $u) {
            if (strtolower($u['email']) === $email) json_err('User with this email already exists', 409);
        }

        $newId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
        $candNum = 'CDI-' . str_pad(count($users) + 1, 6, '0', STR_PAD_LEFT);
        $newUser = [
            'id' => $newId,
            'email' => $email,
            'password' => $pass,
            'firstName' => $first,
            'lastName' => $last,
            'candidateNumber' => $candNum,
            'role' => 'STUDENT',
            'createdAt' => date('c'),
            'profile' => ['bio' => '', 'targetBand' => null, 'examDate' => null, 'phone' => '']
        ];
        $users[] = $newUser;
        write_json(USERS_FILE, $users);

        $token = create_token(['id' => $newId, 'email' => $email, 'role' => 'STUDENT']);
        unset($newUser['password']);
        json_res(['token' => $token, 'user' => $newUser], 201);
    }

    if ($sub === 'logout' && $method === 'POST') {
        json_res(['message' => 'Logged out']);
    }

    if ($sub === 'me' && $method === 'GET') {
        $u = require_auth();
        unset($u['password']);
        json_res(['user' => $u]);
    }

    if ($sub === 'reset-password' && $method === 'POST') {
        $in = json_input();
        $email = strtolower(trim($in['email'] ?? ''));
        $newPass = $in['newPassword'] ?? '';
        if (!$email || !$newPass) json_err('Email and new password are required');

        $found = false;
        foreach ($users as &$u) {
            if (strtolower($u['email']) === $email) {
                $u['password'] = $newPass;
                $found = true;
                break;
            }
        }
        if (!$found) json_err('User not found', 404);
        write_json(USERS_FILE, $users);
        json_res(['message' => 'Password reset successfully']);
    }
}

// 2. TESTS
if ($parts[0] === 'tests') {
    $tests = read_json(TEST_JSON_FILE);

    if (count($parts) === 2 && $parts[1] === 'counts' && $method === 'GET') {
        $published = array_filter($tests, function($t) {
            return ($t['status'] ?? '') === 'PUBLISHED';
        });
        $l = count(array_filter($published, function($t) { return ($t['section'] ?? '') === 'LISTENING'; }));
        $r = count(array_filter($published, function($t) { return ($t['section'] ?? '') === 'READING'; }));
        $w = count(array_filter($published, function($t) { return ($t['section'] ?? '') === 'WRITING'; }));
        json_res(['listening' => $l, 'reading' => $r, 'writing' => $w, 'total' => $l + $r + $w]);
    }

    if (count($parts) === 1 && $method === 'GET') {
        $user = get_auth_user();
        $sec = strtoupper($_GET['section'] ?? '');
        $attempts = read_json(ATTEMPTS_FILE);

        $res = [];
        foreach ($tests as $t) {
            if (($t['status'] ?? '') !== 'PUBLISHED') continue;
            if ($sec && strtoupper($t['section'] ?? '') !== $sec) continue;

            $versions = $t['versions'] ?? [];
            $activeVer = null;
            foreach ($versions as $v) {
                if (!empty($v['isActive'])) { $activeVer = $v; break; }
            }
            if (!$activeVer && !empty($versions[0])) $activeVer = $versions[0];

            $userAtts = [];
            if ($user) {
                $userAtts = array_values(array_filter($attempts, function($a) use ($user, $t) {
                    return ($a['userId'] ?? '') === $user['id'] && ($a['testId'] ?? '') === $t['id'];
                }));
            }

            $completedAtts = array_values(array_filter($userAtts, function($a) {
                return ($a['status'] ?? '') === 'COMPLETED';
            }));

            $bestBand = null;
            foreach ($completedAtts as $ca) {
                if (isset($ca['bandScore']) && ($bestBand === null || $ca['bandScore'] > $bestBand)) {
                    $bestBand = $ca['bandScore'];
                }
            }

            $res[] = [
                'id' => $t['id'],
                'section' => $t['section'],
                'testNumber' => $t['testNumber'],
                'title' => $t['title'],
                'description' => $t['description'] ?? '',
                'timeLimitMinutes' => $t['timeLimitMinutes'] ?? 60,
                'status' => $t['status'],
                'createdAt' => $t['createdAt'] ?? date('c'),
                'activeVersion' => $activeVer,
                'userStats' => [
                    'totalAttempts' => count($userAtts),
                    'completedAttempts' => count($completedAtts),
                    'latestAttempt' => $userAtts[0] ?? null,
                    'bestBandScore' => $bestBand
                ]
            ];
        }
        usort($res, function($a, $b) { return ($a['testNumber'] ?? 0) - ($b['testNumber'] ?? 0); });
        json_res($res);
    }

    if (count($parts) === 2 && $method === 'GET') {
        $id = $parts[1];
        foreach ($tests as $t) {
            if ($t['id'] === $id) json_res($t);
        }
        json_err('Test not found', 404);
    }
}

// 3. ATTEMPTS
if ($parts[0] === 'attempts') {
    $u = require_auth();
    $attempts = read_json(ATTEMPTS_FILE);
    $tests = read_json(TEST_JSON_FILE);

    if (count($parts) === 2 && $parts[1] === 'start' && $method === 'POST') {
        $in = json_input();
        $testId = $in['testId'] ?? '';
        $matched = null;
        foreach ($tests as $t) {
            if ($t['id'] === $testId) { $matched = $t; break; }
        }
        if (!$matched) json_err('Test not found', 404);

        $activeVer = null;
        foreach ($matched['versions'] ?? [] as $v) {
            if (!empty($v['isActive'])) { $activeVer = $v; break; }
        }
        if (!$activeVer && !empty($matched['versions'][0])) $activeVer = $matched['versions'][0];
        if (!$activeVer) json_err('No active version available', 400);

        $attId = 'att_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
        $newAtt = [
            'id' => $attId,
            'userId' => $u['id'],
            'testId' => $matched['id'],
            'testVersionId' => $activeVer['id'],
            'section' => $matched['section'],
            'status' => 'IN_PROGRESS',
            'startedAt' => date('c'),
            'test' => $matched,
            'testVersion' => $activeVer
        ];
        $attempts[] = $newAtt;
        write_json(ATTEMPTS_FILE, $attempts);

        json_res([
            'attempt' => $newAtt,
            'contentUrl' => '/test-content/' . $activeVer['id'] . '/' . ($activeVer['entryFile'] ?? 'index.html')
        ], 201);
    }

    if (count($parts) === 2 && $parts[1] === 'my' && $method === 'GET') {
        $myAtts = array_values(array_filter($attempts, function($a) use ($u) {
            return ($a['userId'] ?? '') === $u['id'];
        }));
        json_res($myAtts);
    }

    if (count($parts) === 2 && $method === 'GET') {
        $id = $parts[1];
        foreach ($attempts as $a) {
            if ($a['id'] === $id) json_res($a);
        }
        json_err('Attempt not found', 404);
    }

    if (count($parts) === 3 && $parts[2] === 'complete' && $method === 'POST') {
        $id = $parts[1];
        $in = json_input();
        foreach ($attempts as &$a) {
            if ($a['id'] === $id) {
                $a['status'] = 'COMPLETED';
                $a['completedAt'] = date('c');
                $a['rawScore'] = $in['rawScore'] ?? null;
                $a['maxScore'] = $in['maxScore'] ?? null;
                $a['bandScore'] = $in['bandScore'] ?? null;
                $a['timeSpentSeconds'] = $in['timeSpentSeconds'] ?? null;
                $a['resultData'] = $in['resultData'] ?? null;
                write_json(ATTEMPTS_FILE, $attempts);
                json_res($a);
            }
        }
        json_err('Attempt not found', 404);
    }

    if (count($parts) === 3 && $parts[2] === 'abandon' && $method === 'POST') {
        $id = $parts[1];
        foreach ($attempts as &$a) {
            if ($a['id'] === $id) {
                $a['status'] = 'ABANDONED';
                write_json(ATTEMPTS_FILE, $attempts);
                json_res($a);
            }
        }
        json_err('Attempt not found', 404);
    }
}

// 4. MOCKS
if ($parts[0] === 'mocks') {
    $u = require_auth();
    $tests = read_json(TEST_JSON_FILE);
    $attempts = read_json(ATTEMPTS_FILE);

    if (count($parts) === 2 && $parts[1] === 'current' && $method === 'GET') {
        $activeMock = null;
        foreach ($attempts as $a) {
            if (!empty($a['isMock']) && ($a['userId'] ?? '') === $u['id'] && ($a['status'] ?? '') === 'IN_PROGRESS') {
                $activeMock = $a;
                break;
            }
        }
        json_res(['activeMock' => $activeMock]);
    }

    if (count($parts) === 2 && $parts[1] === 'start' && $method === 'POST') {
        $lTests = array_values(array_filter($tests, function($t) { return ($t['section'] ?? '') === 'LISTENING' && ($t['status'] ?? '') === 'PUBLISHED'; }));
        $rTests = array_values(array_filter($tests, function($t) { return ($t['section'] ?? '') === 'READING' && ($t['status'] ?? '') === 'PUBLISHED'; }));
        $wTests = array_values(array_filter($tests, function($t) { return ($t['section'] ?? '') === 'WRITING' && ($t['status'] ?? '') === 'PUBLISHED'; }));

        if (empty($lTests) || empty($rTests) || empty($wTests)) json_err('Not enough published tests to start full mock', 400);

        $l = $lTests[array_rand($lTests)];
        $r = $rTests[array_rand($rTests)];
        $w = $wTests[array_rand($wTests)];

        $lVer = $l['versions'][0] ?? null;
        $rVer = $r['versions'][0] ?? null;
        $wVer = $w['versions'][0] ?? null;

        $mockId = 'mock_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
        $mock = [
            'id' => $mockId,
            'userId' => $u['id'],
            'isMock' => true,
            'mockNumber' => count(array_filter($attempts, function($a) use ($u) { return !empty($a['isMock']) && ($a['userId'] ?? '') === $u['id']; })) + 1,
            'listeningTest' => $l,
            'listeningVersion' => $lVer,
            'readingTest' => $r,
            'readingVersion' => $rVer,
            'writingTest' => $w,
            'writingVersion' => $wVer,
            'currentSection' => 'LISTENING',
            'status' => 'IN_PROGRESS',
            'startedAt' => date('c'),
            'testAttempts' => []
        ];

        $firstAttId = 'att_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
        $firstAtt = [
            'id' => $firstAttId,
            'userId' => $u['id'],
            'testId' => $l['id'],
            'testVersionId' => $lVer['id'],
            'section' => 'LISTENING',
            'fullMockAttemptId' => $mockId,
            'status' => 'IN_PROGRESS',
            'startedAt' => date('c'),
            'test' => $l,
            'testVersion' => $lVer
        ];
        $mock['testAttempts'][] = $firstAtt;

        $attempts[] = $mock;
        $attempts[] = $firstAtt;
        write_json(ATTEMPTS_FILE, $attempts);

        json_res([
            'resumed' => false,
            'mock' => $mock,
            'currentSection' => 'LISTENING',
            'currentAttempt' => $firstAtt,
            'contentUrl' => '/test-content/' . $lVer['id'] . '/' . ($lVer['entryFile'] ?? 'index.html')
        ], 201);
    }

    if (count($parts) === 2 && $method === 'GET') {
        $id = $parts[1];
        foreach ($attempts as $a) {
            if ($a['id'] === $id && !empty($a['isMock'])) json_res($a);
        }
        json_err('Mock not found', 404);
    }

    if (count($parts) === 3 && $parts[2] === 'next-section' && $method === 'POST') {
        $id = $parts[1];
        $in = json_input();
        foreach ($attempts as &$a) {
            if ($a['id'] === $id && !empty($a['isMock'])) {
                if ($a['currentSection'] === 'LISTENING') $a['currentSection'] = 'READING';
                elseif ($a['currentSection'] === 'READING') $a['currentSection'] = 'WRITING';
                elseif ($a['currentSection'] === 'WRITING') {
                    $a['currentSection'] = 'COMPLETED';
                    $a['status'] = 'COMPLETED';
                    $a['completedAt'] = date('c');
                }
                write_json(ATTEMPTS_FILE, $attempts);
                json_res($a);
            }
        }
        json_err('Mock not found', 404);
    }

    if (count($parts) === 3 && $parts[2] === 'abandon' && $method === 'POST') {
        $id = $parts[1];
        foreach ($attempts as &$a) {
            if ($a['id'] === $id && !empty($a['isMock'])) {
                $a['status'] = 'ABANDONED';
                write_json(ATTEMPTS_FILE, $attempts);
                json_res($a);
            }
        }
        json_err('Mock not found', 404);
    }
}

// 5. PROFILE
if ($parts[0] === 'profile') {
    $u = require_auth();
    $users = read_json(USERS_FILE);

    if ($method === 'GET') {
        unset($u['password']);
        json_res($u);
    }

    if ($method === 'PUT' && ($parts[1] ?? '') === 'password') {
        $in = json_input();
        $curr = $in['currentPassword'] ?? '';
        $newP = $in['newPassword'] ?? '';
        if ($u['password'] !== $curr && !password_verify($curr, $u['password'])) {
            json_err('Incorrect current password', 400);
        }
        foreach ($users as &$usr) {
            if ($usr['id'] === $u['id']) {
                $usr['password'] = $newP;
                break;
            }
        }
        write_json(USERS_FILE, $users);
        json_res(['message' => 'Password updated successfully']);
    }

    if ($method === 'PUT') {
        $in = json_input();
        foreach ($users as &$usr) {
            if ($usr['id'] === $u['id']) {
                if (isset($in['firstName'])) $usr['firstName'] = $in['firstName'];
                if (isset($in['lastName'])) $usr['lastName'] = $in['lastName'];
                if (isset($in['targetBand'])) $usr['profile']['targetBand'] = $in['targetBand'];
                if (isset($in['examDate'])) $usr['profile']['examDate'] = $in['examDate'];
                if (isset($in['phone'])) $usr['profile']['phone'] = $in['phone'];
                if (isset($in['bio'])) $usr['profile']['bio'] = $in['bio'];
                write_json(USERS_FILE, $users);
                unset($usr['password']);
                json_res($usr);
            }
        }
    }
}

// 6. ADMIN (Direct test.json management)
if ($parts[0] === 'admin') {
    require_admin();
    $sub = $parts[1] ?? '';
    $tests = read_json(TEST_JSON_FILE);
    $users = read_json(USERS_FILE);
    $attempts = read_json(ATTEMPTS_FILE);

    if ($sub === 'dashboard' && $method === 'GET') {
        $totalTests = count($tests);
        $published = count(array_filter($tests, function($t) { return ($t['status'] ?? '') === 'PUBLISHED'; }));
        $draft = count(array_filter($tests, function($t) { return ($t['status'] ?? '') === 'DRAFT'; }));
        $archived = count(array_filter($tests, function($t) { return ($t['status'] ?? '') === 'ARCHIVED'; }));

        $l = count(array_filter($tests, function($t) { return ($t['section'] ?? '') === 'LISTENING' && ($t['status'] ?? '') === 'PUBLISHED'; }));
        $r = count(array_filter($tests, function($t) { return ($t['section'] ?? '') === 'READING' && ($t['status'] ?? '') === 'PUBLISHED'; }));
        $w = count(array_filter($tests, function($t) { return ($t['section'] ?? '') === 'WRITING' && ($t['status'] ?? '') === 'PUBLISHED'; }));

        $students = array_filter($users, function($u) { return ($u['role'] ?? '') === 'STUDENT'; });

        json_res([
            'stats' => [
                'totalStudents' => count($students),
                'totalTests' => $totalTests,
                'publishedTests' => $published,
                'draftTests' => $draft,
                'archivedTests' => $archived,
                'sectionBreakdown' => ['listening' => $l, 'reading' => $r, 'writing' => $w],
                'attempts' => ['total' => count($attempts), 'completed' => count(array_filter($attempts, function($a) { return ($a['status'] ?? '') === 'COMPLETED'; }))],
                'fullMocks' => ['total' => 0, 'completed' => 0]
            ],
            'recentAttempts' => array_slice(array_reverse($attempts), 0, 10)
        ]);
    }

    if ($sub === 'tests') {
        if (count($parts) === 2 && $method === 'GET') {
            $sec = strtoupper($_GET['section'] ?? '');
            $stat = strtoupper($_GET['status'] ?? '');
            $search = strtolower($_GET['search'] ?? '');

            $res = [];
            foreach ($tests as $t) {
                if ($sec && strtoupper($t['section'] ?? '') !== $sec) continue;
                if ($stat && strtoupper($t['status'] ?? '') !== $stat) continue;
                if ($search && strpos(strtolower($t['title'] . ' ' . ($t['description'] ?? '')), $search) === false) continue;

                $versions = $t['versions'] ?? [];
                $activeVer = null;
                foreach ($versions as $v) {
                    if (!empty($v['isActive'])) { $activeVer = $v; break; }
                }
                if (!$activeVer && !empty($versions[0])) $activeVer = $versions[0];

                $res[] = [
                    'id' => $t['id'],
                    'section' => $t['section'],
                    'testNumber' => $t['testNumber'],
                    'title' => $t['title'],
                    'description' => $t['description'] ?? '',
                    'timeLimitMinutes' => $t['timeLimitMinutes'] ?? 60,
                    'status' => $t['status'],
                    'createdAt' => $t['createdAt'] ?? date('c'),
                    'updatedAt' => $t['updatedAt'] ?? date('c'),
                    'activeVersion' => $activeVer,
                    'allVersions' => $versions,
                    'attemptsCount' => 0
                ];
            }
            usort($res, function($a, $b) {
                if ($a['section'] !== $b['section']) return strcmp($a['section'], $b['section']);
                return ($a['testNumber'] ?? 0) - ($b['testNumber'] ?? 0);
            });
            json_res($res);
        }

        if (count($parts) === 2 && $method === 'POST') {
            if (empty($_FILES['file'])) json_err('Please upload an HTML or ZIP file', 400);

            $section = strtoupper(trim($_POST['section'] ?? ''));
            $testNumber = (int)($_POST['testNumber'] ?? 1);
            $title = trim($_POST['title'] ?? '');
            $desc = trim($_POST['description'] ?? '');
            $timeLimit = (int)($_POST['timeLimitMinutes'] ?? ($section === 'LISTENING' ? 32 : 60));
            $status = strtoupper(trim($_POST['status'] ?? 'DRAFT'));

            if (!$section || !$testNumber || !$title) json_err('Section, testNumber, and title are required', 400);

            $testId = 'test_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
            $verId = 'ver_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
            $storageSubdir = "tests/$testId/v1";
            $destDir = UPLOADS_DIR . '/' . $storageSubdir;
            if (!is_dir($destDir)) mkdir($destDir, 0777, true);

            $origName = $_FILES['file']['name'];
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $entryFile = 'index.html';
            $fileType = 'HTML';

            if ($ext === 'zip') {
                $fileType = 'ZIP';
                $zip = new ZipArchive();
                if ($zip->open($_FILES['file']['tmp_name']) === true) {
                    $zip->extractTo($destDir);
                    $zip->close();
                } else {
                    json_err('Could not extract uploaded zip archive', 400);
                }
                if (!file_exists("$destDir/index.html") && !file_exists("$destDir/index.htm")) {
                    $htmls = glob("$destDir/*.html");
                    if (!empty($htmls)) $entryFile = basename($htmls[0]);
                }
            } else {
                $entryFile = $origName;
                move_uploaded_file($_FILES['file']['tmp_name'], "$destDir/$entryFile");
            }

            $version = [
                'id' => $verId,
                'testId' => $testId,
                'versionNumber' => 1,
                'originalName' => $origName,
                'storagePath' => $storageSubdir,
                'entryFile' => $entryFile,
                'fileType' => $fileType,
                'fileSize' => $_FILES['file']['size'],
                'uploadedAt' => date('c'),
                'isActive' => true,
                'files' => []
            ];

            $newTest = [
                'id' => $testId,
                'section' => $section,
                'testNumber' => $testNumber,
                'title' => $title,
                'description' => $desc,
                'timeLimitMinutes' => $timeLimit,
                'status' => $status,
                'createdAt' => date('c'),
                'updatedAt' => date('c'),
                'versions' => [$version]
            ];

            $tests[] = $newTest;
            write_json(TEST_JSON_FILE, $tests);

            json_res([
                'test' => $newTest,
                'version' => $version,
                'previewUrl' => "/test-content/$verId/$entryFile"
            ], 201);
        }

        if (count($parts) === 3 && $method === 'GET') {
            $id = $parts[2];
            foreach ($tests as $t) {
                if ($t['id'] === $id) json_res($t);
            }
            json_err('Test not found', 404);
        }

        if (count($parts) === 3 && $method === 'PUT') {
            $id = $parts[2];
            $in = json_input();
            foreach ($tests as &$t) {
                if ($t['id'] === $id) {
                    if (isset($in['title'])) $t['title'] = $in['title'];
                    if (isset($in['description'])) $t['description'] = $in['description'];
                    if (isset($in['timeLimitMinutes'])) $t['timeLimitMinutes'] = (int)$in['timeLimitMinutes'];
                    if (isset($in['status'])) $t['status'] = strtoupper($in['status']);
                    if (isset($in['testNumber'])) $t['testNumber'] = (int)$in['testNumber'];
                    $t['updatedAt'] = date('c');
                    write_json(TEST_JSON_FILE, $tests);
                    json_res($t);
                }
            }
            json_err('Test not found', 404);
        }

        if (count($parts) === 4 && $parts[3] === 'version' && $method === 'POST') {
            $id = $parts[2];
            if (empty($_FILES['file'])) json_err('Please upload an HTML or ZIP file', 400);

            $matchedIdx = null;
            foreach ($tests as $idx => $t) {
                if ($t['id'] === $id) { $matchedIdx = $idx; break; }
            }
            if ($matchedIdx === null) json_err('Test not found', 404);

            $curTest = $tests[$matchedIdx];
            $nextVer = count($curTest['versions'] ?? []) + 1;
            $verId = 'ver_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
            $storageSubdir = "tests/$id/v$nextVer";
            $destDir = UPLOADS_DIR . '/' . $storageSubdir;
            if (!is_dir($destDir)) mkdir($destDir, 0777, true);

            $origName = $_FILES['file']['name'];
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $entryFile = 'index.html';
            $fileType = 'HTML';

            if ($ext === 'zip') {
                $fileType = 'ZIP';
                $zip = new ZipArchive();
                if ($zip->open($_FILES['file']['tmp_name']) === true) {
                    $zip->extractTo($destDir);
                    $zip->close();
                } else {
                    json_err('Could not extract zip', 400);
                }
                if (!file_exists("$destDir/index.html") && !file_exists("$destDir/index.htm")) {
                    $htmls = glob("$destDir/*.html");
                    if (!empty($htmls)) $entryFile = basename($htmls[0]);
                }
            } else {
                $entryFile = $origName;
                move_uploaded_file($_FILES['file']['tmp_name'], "$destDir/$entryFile");
            }

            foreach ($tests[$matchedIdx]['versions'] as &$ov) {
                $ov['isActive'] = false;
            }

            $newVerRecord = [
                'id' => $verId,
                'testId' => $id,
                'versionNumber' => $nextVer,
                'originalName' => $origName,
                'storagePath' => $storageSubdir,
                'entryFile' => $entryFile,
                'fileType' => $fileType,
                'fileSize' => $_FILES['file']['size'],
                'uploadedAt' => date('c'),
                'isActive' => true,
                'files' => []
            ];

            array_unshift($tests[$matchedIdx]['versions'], $newVerRecord);
            $tests[$matchedIdx]['updatedAt'] = date('c');
            write_json(TEST_JSON_FILE, $tests);

            json_res([
                'message' => "Version $nextVer successfully uploaded and set active",
                'version' => $newVerRecord,
                'previewUrl' => "/test-content/$verId/$entryFile"
            ], 201);
        }

        if (count($parts) === 3 && $method === 'DELETE') {
            $id = $parts[2];
            foreach ($tests as $idx => $t) {
                if ($t['id'] === $id) {
                    array_splice($tests, $idx, 1);
                    write_json(TEST_JSON_FILE, $tests);
                    json_res(['message' => 'Test completely deleted']);
                }
            }
            json_err('Test not found', 404);
        }
    }

    if ($sub === 'students' && $method === 'GET') {
        $students = array_values(array_filter($users, function($u) { return ($u['role'] ?? '') === 'STUDENT'; }));
        foreach ($students as &$s) unset($s['password']);
        json_res($students);
    }

    if ($sub === 'settings') {
        $settings = read_json(SETTINGS_FILE, []);
        if ($method === 'GET') json_res($settings);
        if ($method === 'PUT') {
            $in = json_input();
            foreach ($in as $k => $v) $settings[$k] = (string)$v;
            write_json(SETTINGS_FILE, $settings);
            json_res($settings);
        }
    }

    if ($sub === 'admins') {
        if ($method === 'GET') {
            $admins = array_values(array_filter($users, function($u) { return ($u['role'] ?? '') === 'ADMIN'; }));
            foreach ($admins as &$a) unset($a['password']);
            json_res($admins);
        }
        if ($method === 'POST') {
            $in = json_input();
            $email = strtolower(trim($in['email'] ?? ''));
            $pass = $in['password'] ?? '';
            $first = trim($in['firstName'] ?? '');
            $last = trim($in['lastName'] ?? '');
            if (!$email || !$pass || !$first || !$last) json_err('All fields required', 400);

            $adminId = 'usr_adm_' . time();
            $newAdm = [
                'id' => $adminId,
                'email' => $email,
                'password' => $pass,
                'firstName' => $first,
                'lastName' => $last,
                'candidateNumber' => 'CDI-ADM' . str_pad(count($users) + 1, 3, '0', STR_PAD_LEFT),
                'role' => 'ADMIN',
                'createdAt' => date('c'),
                'profile' => ['bio' => 'Administrator']
            ];
            $users[] = $newAdm;
            write_json(USERS_FILE, $users);
            unset($newAdm['password']);
            json_res(['admin' => $newAdm], 201);
        }
    }
}

json_err('Endpoint not found: ' . $endpoint, 404);
