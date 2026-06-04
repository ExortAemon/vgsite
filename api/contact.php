<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed.'], 405);
}

$input = read_json_body();
$name = trim((string) ($input['name'] ?? ''));
$email = trim((string) ($input['email'] ?? ''));
$phone = trim((string) ($input['phone'] ?? ''));
$message = trim((string) ($input['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    json_response(['error' => 'Заполните имя, email и сообщение.'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Введите корректный email.'], 400);
}

$stmt = $pdo->prepare(
    'INSERT INTO contact_messages (name, email, phone, message)
     VALUES (:name, :email, :phone, :message)'
);
$stmt->execute([
    ':name' => $name,
    ':email' => $email,
    ':phone' => $phone !== '' ? $phone : null,
    ':message' => $message,
]);

$user = current_user($pdo);
log_action($pdo, $user ? (int) $user['id'] : null, 'contact_message_created', ['email' => $email]);
json_response(['success' => true], 201);
