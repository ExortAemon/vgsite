<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

$user = require_user($pdo);
require_role($user, ['admin']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $users = $pdo->query('SELECT id, username, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC')->fetchAll();
    $actions = $pdo->query(
        'SELECT ua.id, ua.action, ua.details, ua.ip_address, ua.user_agent, ua.created_at,
                u.username, u.name, u.role
         FROM user_actions ua
         LEFT JOIN users u ON u.id = ua.user_id
         ORDER BY ua.created_at DESC
         LIMIT 200'
    )->fetchAll();

    json_response(['users' => $users, 'actions' => $actions]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = read_json_body();
    $action = $input['action'] ?? '';

    if ($action === 'set_user_status') {
        $userId = (int) ($input['user_id'] ?? 0);
        $status = (string) ($input['status'] ?? '');
        if (!in_array($status, ['active', 'blocked'], true)) {
            json_response(['error' => 'Недопустимый статус пользователя.'], 400);
        }
        if ($userId === (int) $user['id']) {
            json_response(['error' => 'Нельзя заблокировать самого себя.'], 400);
        }
        $stmt = $pdo->prepare('UPDATE users SET status = :status WHERE id = :id');
        $stmt->execute([':status' => $status, ':id' => $userId]);
        log_action($pdo, (int) $user['id'], 'user_status_updated', ['user_id' => $userId, 'status' => $status]);
        json_response(['success' => true]);
    }
}

json_response(['error' => 'Not found.'], 404);
