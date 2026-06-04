<?php

declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
$config = file_exists($configFile) ? require $configFile : [];

$host = $config['db_host'] ?? getenv('DB_HOST') ?: 'localhost';
$dbname = $config['db_name'] ?? getenv('DB_NAME') ?: '';
$username = $config['db_user'] ?? getenv('DB_USER') ?: '';
$password = $config['db_pass'] ?? getenv('DB_PASS') ?: '';

if ($dbname === '' || $username === '') {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Database config is missing. Copy api/config.example.php to api/config.php and fill db_name, db_user and db_pass.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $exception) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Database connection failed.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
