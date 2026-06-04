# Что загружать на PHP-хостинг

Эта папка уже собрана для загрузки в корень сайта (`httpdocs`, `public_html` или Document Root домена).

## Как загрузить

1. Откройте на хостинге корневую папку домена `exortaemon.gdh.kz`.
2. Загрузите **содержимое** этой папки `hosting-upload/` в корень сайта.
3. Не загружайте саму папку `hosting-upload` внутрь сайта — загружайте файлы и папки из неё.
4. В `api/` создайте файл `config.php` по образцу `api/config.example.php`.

После загрузки структура должна быть такой:

```text
корень сайта/
├── .htaccess
├── index.html
├── assets/
├── models/                # README + при желании локальные .glb модели
└── api/
    ├── config.php
    ├── config.example.php
    ├── db.php
    ├── helpers.php
    ├── test-db.php
    ├── products.php
    ├── auth.php
    ├── cart.php
    ├── orders.php
    ├── contact.php
    └── admin.php
```

## config.php

Создайте `api/config.php` с вашими данными MySQL:

```php
<?php

return [
    'db_host' => 'localhost',
    'db_name' => 'ИМЯ_БАЗЫ',
    'db_user' => 'ПОЛЬЗОВАТЕЛЬ_БАЗЫ',
    'db_pass' => 'ПАРОЛЬ_БАЗЫ',
];
```

## Проверка

1. `https://ваш-домен/api/test-db.php` должен вернуть JSON `success: true`.
2. `https://ваш-домен/api/products.php` должен вернуть JSON со списком товаров.
3. `https://ваш-домен/profile` должен открывать страницу личного кабинета.

## 3D-модель очков

Бинарный файл `classic-aviator.glb` не включён в эту upload-папку, чтобы PR/GitHub не ругался на бинарные файлы. Если нужна локальная AR-модель, вручную скопируйте `public/models/classic-aviator.glb` в `models/classic-aviator.glb` на хостинге. Если не копировать, сайт будет использовать внешние CDN-ссылки из карточек товаров.

Если `test.html`, `ping.php` или `api/test-db.php` не открываются, значит домен смотрит не в эту папку или на хостинге не включён PHP.
