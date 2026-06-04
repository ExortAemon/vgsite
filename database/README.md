# База данных для phpMyAdmin

Файл `vgsite_phpmyadmin.sql` создает таблицы и тестовые данные для сайта магазина очков в уже выбранной MySQL/MariaDB базе данных.

## Что входит в SQL

- `users` — покупатели, продавец и администратор с ролями и статусами.
- `categories` — категории каталога.
- `products` — товары, цены в тенге, рейтинг, остатки, бейджи и ссылки на AR-модели.
- `product_images` — изображения товаров.
- `carts` и `cart_items` — корзины пользователей или гостевых сессий.
- `orders` и `order_items` — заказы и состав заказа.
- `contact_messages` — сообщения из формы обратной связи.
- `user_actions` — журнал входов, регистраций, заказов и админ-действий.
- `order_totals` — view для быстрого просмотра итоговой суммы заказа.

## Как импортировать в phpMyAdmin

1. Откройте phpMyAdmin.
2. В левом меню выберите вашу существующую базу данных, которую выдал хостинг. Например, это может быть не `vgsite`, а имя вида `exortaemon_vgsite`.
3. Перейдите во вкладку **Import / Импорт**.
4. Выберите файл `database/vgsite_phpmyadmin.sql`.
5. Убедитесь, что формат выбран **SQL**.
6. Нажмите **Go / Вперед**.

После импорта в выбранной базе появятся таблицы с тестовыми товарами, корзиной, заказами и сообщением из формы контактов.

## Ошибка `#1044 - access denied`

Если phpMyAdmin пишет `#1044 - Для пользователя ... доступ к базе данных ... закрыт`, значит пользователь MySQL на хостинге не имеет права создавать или выбирать эту базу данных. Поэтому в SQL-файле нет команд `CREATE DATABASE` и `USE`: сначала выберите разрешенную базу в phpMyAdmin, а потом импортируйте файл.

## Аккаунты для проверки

После импорта SQL можно войти в служебные кабинеты:

- продавец: логин `prodavec`, пароль `prodavec`;
- администратор: логин `admin`, пароль `admin`;
- тестовый покупатель: логин `ivan`, пароль `password`.

Продавец видит все заказы пользователей и может менять статус заказа. Администратор видит журнал действий пользователей и может блокировать/разблокировать аккаунты.

## Полезные запросы

```sql
-- Активные товары каталога
SELECT id, name, price_kzt, rating, reviews_count, stock_quantity
FROM products
WHERE is_active = 1
ORDER BY is_featured DESC, id ASC;
```

```sql
-- Корзина пользователя Иван Иванов
SELECT p.name, ci.quantity, ci.unit_price_kzt, ci.quantity * ci.unit_price_kzt AS total_kzt
FROM cart_items ci
JOIN carts c ON c.id = ci.cart_id
JOIN products p ON p.id = ci.product_id
WHERE c.user_id = 1 AND c.status = 'active';
```

```sql
-- Итоги заказов
SELECT order_number, status, payment_status, total_kzt, created_at
FROM order_totals
ORDER BY created_at DESC;
```
