# Local Three.js vendor files

Если в вашей сети блокируются CDN (`jsDelivr`, `unpkg`) и AR пишет, что не удалось загрузить `GLTFLoader`,
используйте автоматическое копирование:

```bash
npm install
npm run prepare:vendor
```

Команда положит сюда локальные файлы:

- `three.min.js`
- `three.module.js`
- `GLTFLoader.js` (legacy, для `window.THREE.GLTFLoader`) **или** `GLTFLoader.module.js` (ESM)

Ожидаемые пути в приложении:

- `/vendor/three.min.js`
- `/vendor/three.module.js`
- `/vendor/GLTFLoader.js`
- `/vendor/GLTFLoader.module.js`

`prepare:vendor` автоматически патчит импорт внутри `GLTFLoader.module.js` с `from "three"` на `from "/vendor/three.module.js"`.

После добавления файлов перезапустите dev-сервер (`npm run dev`).

Дополнительно AR пробует ESM-зеркала `esm.sh`, `esm.run`, `skypack` и `jspm`, если классические CDN недоступны.
