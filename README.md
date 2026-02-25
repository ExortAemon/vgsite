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
