# vg

This is a code bundle for `vg`. The original project is available at:
https://www.figma.com/design/DdDCtqW30NBfNZ6Vzi1eG0/vg

## Запуск проекта

1. Установите Node.js 20+.
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите dev-сервер:
   ```bash
   npm run dev
   ```

## Если появляется ошибка `"vite" не является внутренней или внешней командой`

Обычно это значит, что зависимости не установились (нет `node_modules`).

1. Удалите старые артефакты (если есть):
   ```bash
   rm -rf node_modules package-lock.json
   ```
   На Windows PowerShell:
   ```powershell
   Remove-Item node_modules -Recurse -Force
   Remove-Item package-lock.json -Force
   ```
2. Переустановите зависимости:
   ```bash
   npm install
   ```
3. Проверьте, что vite установлен локально:
   ```bash
   npx vite --version
   ```
4. Снова запустите:
   ```bash
   npm run dev
   ```

## Если в браузере `ERR_CONNECTION_REFUSED` на `localhost:5173`

Это означает, что dev-сервер не запущен (или запущен на другом хосте/порту).

1. Запустите сервер и не закрывайте этот терминал:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
2. Проверьте в терминале строку вида:
   - `Local: http://localhost:5173/`
3. Если порт занят, запустите на другом порту:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 4173
   ```
   и откройте `http://localhost:4173`.
4. Для проверки, что файл модели действительно доступен, откройте:
   - `http://localhost:5173/models/classic-aviator.glb`
   - или `http://localhost:4173/models/classic-aviator.glb` (если меняли порт)
