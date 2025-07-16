@echo off
echo 🌐 Запуск DianaFit Backend в ПРОДАКШН режиме...
echo ☁️ Данные будут сохраняться в Firestore
echo 🔧 Конфигурация: PRODUCTION ENVIRONMENT

REM Устанавливаем переменные окружения для продакшн режима
set NODE_ENV=production
set USE_LOCAL_STORAGE=false
set FORCE_LOCAL_FILES=false

echo 🚀 Запускаем сервер...
node index.js

pause
