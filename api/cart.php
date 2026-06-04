<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

$user = require_user($pdo);
require_role($user, ['customer']);

function active_cart_id(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare('SELECT id FROM carts WHERE user_id = :user_id AND status = "active" LIMIT 1');
    $stmt->execute([':user_id' => $userId]);
    $cart = $stmt->fetch();

    if ($cart) {
        return (int) $cart['id'];
    }

    $stmt = $pdo->prepare('INSERT INTO carts (user_id, status) VALUES (:user_id, "active")');
    $stmt->execute([':user_id' => $userId]);
    return (int) $pdo->lastInsertId();
}

function cart_payload(PDO $pdo, int $cartId): array
{
    $stmt = $pdo->prepare(
        'SELECT ci.id, ci.product_id, ci.quantity, ci.unit_price_kzt,
                p.name, p.main_image_url, p.stock_quantity
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.cart_id = :cart_id
         ORDER BY ci.id ASC'
    );
    $stmt->execute([':cart_id' => $cartId]);
    $items = $stmt->fetchAll();

    $total = 0;
    foreach ($items as &$item) {
        $item['id'] = (int) $item['id'];
        $item['product_id'] = (int) $item['product_id'];
        $item['quantity'] = (int) $item['quantity'];
        $item['unit_price_kzt'] = (int) $item['unit_price_kzt'];
        $item['line_total_kzt'] = $item['quantity'] * $item['unit_price_kzt'];
        $total += $item['line_total_kzt'];
    }

    return ['items' => $items, 'total_kzt' => $total];
}

$cartId = active_cart_id($pdo, (int) $user['id']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response(['cart' => cart_payload($pdo, $cartId)]);
}

$input = read_json_body();
$action = $input['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add') {
    $productId = (int) ($input['product_id'] ?? 0);
    $quantity = max(1, (int) ($input['quantity'] ?? 1));

    $stmt = $pdo->prepare('SELECT id, price_kzt FROM products WHERE id = :id AND is_active = 1 LIMIT 1');
    $stmt->execute([':id' => $productId]);
    $product = $stmt->fetch();

    if (!$product) {
        json_response(['error' => 'Товар не найден.'], 404);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_kzt)
         VALUES (:cart_id, :product_id, :quantity, :unit_price_kzt)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), unit_price_kzt = VALUES(unit_price_kzt)'
    );
    $stmt->execute([
        ':cart_id' => $cartId,
        ':product_id' => $productId,
        ':quantity' => $quantity,
        ':unit_price_kzt' => $product['price_kzt'],
    ]);

    log_action($pdo, (int) $user['id'], 'cart_item_added', ['product_id' => $productId, 'quantity' => $quantity]);
    json_response(['cart' => cart_payload($pdo, $cartId)], 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'quantity') {
    $itemId = (int) ($input['item_id'] ?? 0);
    $quantity = max(1, (int) ($input['quantity'] ?? 1));

    $stmt = $pdo->prepare('UPDATE cart_items SET quantity = :quantity WHERE id = :id AND cart_id = :cart_id');
    $stmt->execute([':quantity' => $quantity, ':id' => $itemId, ':cart_id' => $cartId]);
    log_action($pdo, (int) $user['id'], 'cart_quantity_updated', ['item_id' => $itemId, 'quantity' => $quantity]);
    json_response(['cart' => cart_payload($pdo, $cartId)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'remove') {
    $itemId = (int) ($input['item_id'] ?? 0);
    $stmt = $pdo->prepare('DELETE FROM cart_items WHERE id = :id AND cart_id = :cart_id');
    $stmt->execute([':id' => $itemId, ':cart_id' => $cartId]);
    log_action($pdo, (int) $user['id'], 'cart_item_removed', ['item_id' => $itemId]);
    json_response(['cart' => cart_payload($pdo, $cartId)]);
}

json_response(['error' => 'Unknown cart action.'], 400);
