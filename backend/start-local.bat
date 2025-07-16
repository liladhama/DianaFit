@echo off
echo 🏠 Запуск DianaFit Backend в ЛОКАЛЬНОМ режиме...
echo 💾 Данные будут сохраняться в папку: backup_files/users/
echo 🔧 Конфигурация: LOCAL ENVIRONMENT

REM Устанавливаем переменные окружения для локального режима
set NODE_ENV=development
set USE_LOCAL_STORAGE=true
set FORCE_LOCAL_FILES=true
set PORT=3001

REM Проверяем существование папки для локального хранения
if not exist "backup_files\users" (
    echo 📁 Создаем папку для локального хранения...
    mkdir "backup_files\users"
)

echo 🚀 Запускаем сервер...
node index.js

pause
