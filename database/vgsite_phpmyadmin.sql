-- SQL dump for the VG eyewear shop.
-- Import this file in phpMyAdmin to create a MySQL/MariaDB database
-- with product catalog, users, carts, orders, contact messages, and seed data.

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `vgsite`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `vgsite`;

START TRANSACTION;

DROP VIEW IF EXISTS `order_totals`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `carts`;
DROP TABLE IF EXISTS `contact_messages`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(40) DEFAULT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(140) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED DEFAULT NULL,
  `name` VARCHAR(160) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price_kzt` INT UNSIGNED NOT NULL,
  `old_price_kzt` INT UNSIGNED DEFAULT NULL,
  `stock_quantity` INT UNSIGNED NOT NULL DEFAULT 0,
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  `reviews_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `tag` VARCHAR(60) DEFAULT NULL,
  `ar_model_name` VARCHAR(120) DEFAULT NULL,
  `ar_model_url` TEXT DEFAULT NULL,
  `main_image_url` TEXT DEFAULT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_category_id_index` (`category_id`),
  KEY `products_active_featured_index` (`is_active`, `is_featured`),
  CONSTRAINT `products_category_id_fk`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `image_url` TEXT NOT NULL,
  `alt_text` VARCHAR(180) DEFAULT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_images_product_id_index` (`product_id`),
  CONSTRAINT `product_images_product_id_fk`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contact_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(40) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'in_progress', 'answered', 'closed') NOT NULL DEFAULT 'new',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_messages_status_index` (`status`),
  KEY `contact_messages_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `carts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `session_id` VARCHAR(191) DEFAULT NULL,
  `status` ENUM('active', 'ordered', 'abandoned') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `carts_user_id_index` (`user_id`),
  KEY `carts_session_id_index` (`session_id`),
  CONSTRAINT `carts_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cart_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price_kzt` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_items_cart_product_unique` (`cart_id`, `product_id`),
  KEY `cart_items_product_id_index` (`product_id`),
  CONSTRAINT `cart_items_cart_id_fk`
    FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `cart_items_product_id_fk`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `cart_items_quantity_positive_chk` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(40) NOT NULL,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_email` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(40) DEFAULT NULL,
  `delivery_address` TEXT DEFAULT NULL,
  `status` ENUM('new', 'paid', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'new',
  `payment_status` ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
  `delivery_price_kzt` INT UNSIGNED NOT NULL DEFAULT 0,
  `comment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_unique` (`order_number`),
  KEY `orders_user_id_index` (`user_id`),
  KEY `orders_status_index` (`status`),
  CONSTRAINT `orders_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED DEFAULT NULL,
  `product_name` VARCHAR(160) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price_kzt` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_index` (`order_id`),
  KEY `order_items_product_id_index` (`product_id`),
  CONSTRAINT `order_items_order_id_fk`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_fk`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `order_items_quantity_positive_chk` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`) VALUES
  (1, 'Иван Иванов', 'ivan@example.kz', '+7 (777) 123-45-67', NULL, 'customer'),
  (2, 'Администратор VG', 'admin@eyewear.kz', '+7 (727) 123-45-67', NULL, 'admin');

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `sort_order`) VALUES
  (1, 'Авиаторы', 'aviators', 'Классические очки-авиаторы для ежедневного образа.', 10),
  (2, 'Круглые', 'round', 'Современные круглые оправы.', 20),
  (3, 'Спортивные', 'sport', 'Легкие спортивные модели для активного отдыха.', 30),
  (4, 'Винтажные', 'vintage', 'Ретро-стиль и квадратные формы.', 40),
  (5, 'Премиум', 'premium', 'Дизайнерские модели премиального уровня.', 50),
  (6, 'Городские', 'urban', 'Универсальные модели для города.', 60);

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price_kzt`, `stock_quantity`, `rating`, `reviews_count`, `tag`, `ar_model_name`, `ar_model_url`, `main_image_url`, `is_featured`) VALUES
  (1, 1, 'Classic Aviator', 'classic-aviator', 'Популярная модель в стиле aviator с AR-примеркой.', 39900, 24, 4.9, 127, 'Популярное', 'Aviator Gold', '/models/classic-aviator.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb', 'https://images.unsplash.com/photo-1663344467434-66949a837661?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdmlhdG9yJTIwc3VuZ2xhc3NlcyUyMG1lbnxlbnwxfHx8fDE3NjkwOTk0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 1),
  (2, 2, 'Modern Round', 'modern-round', 'Серебристая круглая оправа для современного образа.', 32400, 32, 4.8, 89, 'Новинка', 'Round Silver', '/models/modern-round.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb', 'https://images.unsplash.com/photo-1624917906988-2f607bae714f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjB3ZWFyaW5nJTIwZ2xhc3Nlc3xlbnwxfHx8fDE3NjkwOTk0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 1),
  (3, 3, 'Sport Pro', 'sport-pro', 'Спортивные солнцезащитные очки с карбоновой эстетикой.', 44900, 18, 5.0, 156, 'Топ продаж', 'Sport Carbon', '/models/sport-pro.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb', 'https://images.unsplash.com/photo-1620138996011-943081eb5a10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBzdW5nbGFzc2VzJTIwbWVufGVufDF8fHx8MTc2OTA5OTQ5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 1),
  (4, 4, 'Vintage Square', 'vintage-square', 'Матовая квадратная модель в винтажном стиле.', 29900, 40, 4.7, 92, NULL, 'Vintage Matte', '/models/vintage-square.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb', 'https://images.unsplash.com/photo-1714356590155-f896e15d21c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBzdW5nbGFzc2VzfGVufDF8fHx8MTc2OTA5OTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 0),
  (5, 5, 'Designer Cat Eye', 'designer-cat-eye', 'Премиальная дизайнерская модель Cat Eye.', 47400, 12, 4.9, 143, 'Премиум', 'Cat Eye Premium', '/models/designer-cat-eye.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb', 'https://images.unsplash.com/photo-1732139637068-41c50825dca1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zJTIwZXlld2VhciUyMHN0eWxlfGVufDF8fHx8MTc2OTA5OTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 1),
  (6, 6, 'Urban Wayfarer', 'urban-wayfarer', 'Универсальная городская модель Wayfarer.', 34900, 27, 4.8, 108, NULL, 'Wayfarer Urban', '/models/urban-wayfarer.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb', 'https://images.unsplash.com/photo-1723179754179-61a91b48d702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwc3VuZ2xhc3NlcyUyMHByb2R1Y3R8ZW58MXx8fHwxNzY5MDk5NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', 0);

INSERT INTO `product_images` (`product_id`, `image_url`, `alt_text`, `sort_order`)
SELECT `id`, `main_image_url`, `name`, 10
FROM `products`;

INSERT INTO `contact_messages` (`name`, `email`, `phone`, `message`, `status`) VALUES
  ('Алия Садыкова', 'aliya@example.kz', '+7 (701) 111-22-33', 'Здравствуйте! Есть ли самовывоз из Алматы?', 'new');

INSERT INTO `carts` (`id`, `user_id`, `session_id`, `status`) VALUES
  (1, 1, NULL, 'active');

INSERT INTO `cart_items` (`cart_id`, `product_id`, `quantity`, `unit_price_kzt`) VALUES
  (1, 1, 1, 39900),
  (1, 2, 2, 32400);

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `delivery_address`, `status`, `payment_status`, `delivery_price_kzt`, `created_at`) VALUES
  (1, '12345', 1, 'Иван Иванов', 'ivan@example.kz', '+7 (777) 123-45-67', 'Алматы, пр. Абая, 150', 'delivered', 'paid', 0, '2026-01-15 10:30:00'),
  (2, '12344', 1, 'Иван Иванов', 'ivan@example.kz', '+7 (777) 123-45-67', 'Алматы, пр. Абая, 150', 'shipped', 'paid', 0, '2026-01-10 14:20:00'),
  (3, '12343', 1, 'Иван Иванов', 'ivan@example.kz', '+7 (777) 123-45-67', 'Алматы, пр. Абая, 150', 'delivered', 'paid', 0, '2026-01-05 09:15:00');

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `quantity`, `unit_price_kzt`) VALUES
  (1, 1, 'Classic Aviator', 1, 39900),
  (1, 2, 'Modern Round', 1, 32400),
  (2, 1, 'Classic Aviator', 1, 39900),
  (3, 3, 'Sport Pro', 1, 44900),
  (3, 5, 'Designer Cat Eye', 1, 47400),
  (3, 4, 'Vintage Square', 1, 10400);

CREATE VIEW `order_totals` AS
SELECT
  `o`.`id` AS `order_id`,
  `o`.`order_number`,
  `o`.`status`,
  `o`.`payment_status`,
  `o`.`customer_email`,
  COALESCE(SUM(`oi`.`quantity` * `oi`.`unit_price_kzt`), 0) AS `items_total_kzt`,
  `o`.`delivery_price_kzt`,
  COALESCE(SUM(`oi`.`quantity` * `oi`.`unit_price_kzt`), 0) + `o`.`delivery_price_kzt` AS `total_kzt`,
  `o`.`created_at`
FROM `orders` `o`
LEFT JOIN `order_items` `oi` ON `oi`.`order_id` = `o`.`id`
GROUP BY
  `o`.`id`,
  `o`.`order_number`,
  `o`.`status`,
  `o`.`payment_status`,
  `o`.`customer_email`,
  `o`.`delivery_price_kzt`,
  `o`.`created_at`;

COMMIT;
