<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed.'], 405);
}

$stmt = $pdo->query(
    'SELECT id, name, slug, description, price_kzt, stock_quantity, rating, reviews_count,
            tag, ar_model_name, ar_model_url, main_image_url
     FROM products
     WHERE is_active = 1
     ORDER BY is_featured DESC, id ASC'
);

json_response(['products' => $stmt->fetchAll()]);
