@echo off
echo ====== Проверка диагностики чата с Дианой ======
echo.

echo Проверка версии Node.js...
node --version
echo.

echo Проверка наличия файлов скриптов...
dir check-mistral-api.js test-diana-chat.js
echo.

echo Проверка наличия .env файла...
dir backend\.env
echo.

echo Проверка конфигурации backend...
type backend\package.json
echo.

echo Проверка статуса API Mistral...
node check-mistral-api.js
echo.

echo Примечание: Если API работает корректно, но чат все равно не отвечает,
echo проверьте логи сервера после запуска backend и отправки тестового сообщения.
echo.
echo Нажмите любую клавишу, чтобы запустить backend для тестирования...
pause > nul

start cmd /k "cd /d %~dp0 && call start-backend.bat"

echo Ожидание запуска backend (5 секунд)...
timeout /t 5 > nul

echo.
echo Отправка тестового сообщения в чат с Дианой...
node test-diana-chat.js

echo.
echo Примечание: 
echo 1. Проверьте вывод в окне backend на наличие ошибок
echo 2. Если проблема с ключом API, получите новый ключ на https://console.mistral.ai/
echo 3. Обновите ключ в файле backend/.env
echo.
echo Нажмите любую клавишу для выхода...
pause > nul
