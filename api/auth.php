<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? 'me';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'me') {
    $user = current_user($pdo);
    json_response(['user' => $user ? public_user($user) : null]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $input = read_json_body();
    $login = trim((string) ($input['login'] ?? ''));
    $password = (string) ($input['password'] ?? '');

    if ($login === '' || $password === '') {
        json_response(['error' => 'Введите логин и пароль.'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = :login OR email = :login LIMIT 1');
    $stmt->execute([':login' => $login]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] !== 'active' || !password_verify($password, $user['password_hash'] ?? '')) {
        log_action($pdo, $user ? (int) $user['id'] : null, 'login_failed', ['login' => $login]);
        json_response(['error' => 'Неверный логин или пароль.'], 401);
    }

    $_SESSION['user_id'] = (int) $user['id'];
    log_action($pdo, (int) $user['id'], 'login_success');
    json_response(['user' => public_user($user)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'register') {
    $input = read_json_body();
    $username = trim((string) ($input['username'] ?? ''));
    $name = trim((string) ($input['name'] ?? ''));
    $email = trim((string) ($input['email'] ?? ''));
    $phone = trim((string) ($input['phone'] ?? ''));
    $password = (string) ($input['password'] ?? '');

    if ($username === '' || $name === '' || $email === '' || $password === '') {
        json_response(['error' => 'Заполните логин, имя, email и пароль.'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'Введите корректный email.'], 400);
    }

    if (strlen($password) < 6) {
        json_response(['error' => 'Пароль должен быть не короче 6 символов.'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO users (username, name, email, phone, password_hash, role, status)
         VALUES (:username, :name, :email, :phone, :password_hash, "customer", "active")'
    );

    try {
        $stmt->execute([
            ':username' => $username,
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone !== '' ? $phone : null,
            ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
    } catch (PDOException $exception) {
        json_response(['error' => 'Пользователь с таким логином или email уже существует.'], 409);
    }

    $_SESSION['user_id'] = (int) $pdo->lastInsertId();
    $user = require_user($pdo);
    log_action($pdo, (int) $user['id'], 'register');
    json_response(['user' => public_user($user)], 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    $user = current_user($pdo);
    if ($user) {
        log_action($pdo, (int) $user['id'], 'logout');
    }
    session_destroy();
    json_response(['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'profile') {
    $user = require_user($pdo);
    $input = read_json_body();
    $name = trim((string) ($input['name'] ?? ''));
    $email = trim((string) ($input['email'] ?? ''));
    $phone = trim((string) ($input['phone'] ?? ''));

    if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'Введите имя и корректный email.'], 400);
    }

    $stmt = $pdo->prepare('UPDATE users SET name = :name, email = :email, phone = :phone WHERE id = :id');
    try {
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone !== '' ? $phone : null,
            ':id' => $user['id'],
        ]);
    } catch (PDOException $exception) {
        json_response(['error' => 'Такой email уже используется.'], 409);
    }

    log_action($pdo, (int) $user['id'], 'profile_updated');
    $updatedUser = require_user($pdo);
    json_response(['user' => public_user($updatedUser)]);
}

json_response(['error' => 'Not found.'], 404);
