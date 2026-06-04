<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

$user = require_user($pdo);

function fetch_orders(PDO $pdo, array $user): array
{
    $where = '';
    $params = [];
    if ($user['role'] === 'customer') {
        $where = 'WHERE o.user_id = :user_id';
        $params[':user_id'] = $user['id'];
    }

    $stmt = $pdo->prepare(
        "SELECT o.id, o.order_number, o.customer_name, o.customer_email, o.customer_phone,
                o.delivery_address, o.status, o.payment_status, o.created_at,
                ot.total_kzt, COUNT(oi.id) AS items_count
         FROM orders o
         JOIN order_totals ot ON ot.order_id = o.id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         {$where}
         GROUP BY o.id, o.order_number, o.customer_name, o.customer_email, o.customer_phone,
                  o.delivery_address, o.status, o.payment_status, o.created_at, ot.total_kzt
         ORDER BY o.created_at DESC"
    );
    $stmt->execute($params);
    return $stmt->fetchAll();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($user['role'] === 'admin') {
        json_response(['orders' => []]);
    }
    json_response(['orders' => fetch_orders($pdo, $user)]);
}

$input = read_json_body();
$action = $input['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    require_role($user, ['customer']);
    $deliveryAddress = trim((string) ($input['delivery_address'] ?? ''));
    $comment = trim((string) ($input['comment'] ?? ''));

    if ($deliveryAddress === '') {
        json_response(['error' => 'Укажите адрес доставки.'], 400);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT id FROM carts WHERE user_id = :user_id AND status = "active" LIMIT 1');
        $stmt->execute([':user_id' => $user['id']]);
        $cart = $stmt->fetch();

        if (!$cart) {
            throw new RuntimeException('Корзина пуста.');
        }

        $stmt = $pdo->prepare(
            'SELECT ci.product_id, ci.quantity, ci.unit_price_kzt, p.name
             FROM cart_items ci
             JOIN products p ON p.id = ci.product_id
             WHERE ci.cart_id = :cart_id'
        );
        $stmt->execute([':cart_id' => $cart['id']]);
        $items = $stmt->fetchAll();

        if (!$items) {
            throw new RuntimeException('Корзина пуста.');
        }

        $orderNumber = date('YmdHis') . '-' . (int) $user['id'];
        $stmt = $pdo->prepare(
            'INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, delivery_address, status, payment_status, comment)
             VALUES (:order_number, :user_id, :customer_name, :customer_email, :customer_phone, :delivery_address, "new", "pending", :comment)'
        );
        $stmt->execute([
            ':order_number' => $orderNumber,
            ':user_id' => $user['id'],
            ':customer_name' => $user['name'],
            ':customer_email' => $user['email'],
            ':customer_phone' => $user['phone'],
            ':delivery_address' => $deliveryAddress,
            ':comment' => $comment !== '' ? $comment : null,
        ]);
        $orderId = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_kzt)
             VALUES (:order_id, :product_id, :product_name, :quantity, :unit_price_kzt)'
        );
        foreach ($items as $item) {
            $stmt->execute([
                ':order_id' => $orderId,
                ':product_id' => $item['product_id'],
                ':product_name' => $item['name'],
                ':quantity' => $item['quantity'],
                ':unit_price_kzt' => $item['unit_price_kzt'],
            ]);
        }

        $stmt = $pdo->prepare('UPDATE carts SET status = "ordered" WHERE id = :id');
        $stmt->execute([':id' => $cart['id']]);
        log_action($pdo, (int) $user['id'], 'order_created', ['order_id' => $orderId, 'order_number' => $orderNumber]);
        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        json_response(['error' => $exception->getMessage()], 400);
    }

    json_response(['success' => true, 'orders' => fetch_orders($pdo, $user)], 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'status') {
    require_role($user, ['seller', 'admin']);
    $orderId = (int) ($input['order_id'] ?? 0);
    $status = (string) ($input['status'] ?? '');
    $allowed = ['new', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!in_array($status, $allowed, true)) {
        json_response(['error' => 'Недопустимый статус заказа.'], 400);
    }

    $stmt = $pdo->prepare('UPDATE orders SET status = :status WHERE id = :id');
    $stmt->execute([':status' => $status, ':id' => $orderId]);
    log_action($pdo, (int) $user['id'], 'order_status_updated', ['order_id' => $orderId, 'status' => $status]);
    json_response(['orders' => fetch_orders($pdo, $user)]);
}

json_response(['error' => 'Unknown orders action.'], 400);
