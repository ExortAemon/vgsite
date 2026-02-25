# Local Three.js vendor files

Если в вашей сети блокируются CDN (`jsDelivr`, `unpkg`) и AR пишет, что не удалось загрузить `GLTFLoader`,
положите сюда локальные файлы:

- `three.min.js`
- `GLTFLoader.js` (legacy, для `window.THREE.GLTFLoader`) **или** `GLTFLoader.module.js` (ESM)

Ожидаемые пути в приложении:

- `/vendor/three.min.js`
- `/vendor/GLTFLoader.js`
- `/vendor/GLTFLoader.module.js`

После добавления файлов перезапустите dev-сервер (`npm run dev`).
