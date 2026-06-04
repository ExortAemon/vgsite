# AR Glasses Models

Эта папка оставлена для локальных 3D-моделей очков (`.glb`) на хостинге.

Бинарные `.glb`-файлы не добавлены в ветку `hosting-upload-package`, потому что GitHub/PR-интерфейс в этом окружении не поддерживает бинарные файлы в таком пакете.

## Что делать при загрузке на хостинг

Если хочешь использовать локальную модель, скопируй файл из основного проекта:

```text
public/models/classic-aviator.glb
```

в папку на хостинге:

```text
models/classic-aviator.glb
```

Если файл не загрузить, сайт всё равно сможет использовать внешние CDN-ссылки на модель из карточек товаров.

## Ожидаемые имена моделей

- `classic-aviator.glb`
- `modern-round.glb`
- `sport-pro.glb`
- `vintage-square.glb`
- `designer-cat-eye.glb`
- `urban-wayfarer.glb`
