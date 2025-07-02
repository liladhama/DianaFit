@echo off
echo 🔍 Проверка DianaFit серверов...
echo.

echo 📡 Проверка Backend (localhost:3001)...
curl -s http://localhost:3001/ > nul
if %errorlevel% == 0 (
    echo ✅ Backend доступен на порту 3001
) else (
    echo ❌ Backend недоступен на порту 3001
    echo 💡 Запустите: cd backend && npm start
)

echo.
echo 🌐 Проверка Frontend (localhost:3000)...
curl -s http://localhost:3000/ > nul
if %errorlevel% == 0 (
    echo ✅ Frontend доступен на порту 3000
) else (
    echo ❌ Frontend недоступен на порту 3000
    echo 💡 Запустите: cd frontend && npm start
)

echo.
echo 🧪 Тестирование API...
curl -s -o nul -w "Backend Health: %%{http_code}\n" http://localhost:3001/
curl -s -o nul -w "Quiz Config: %%{http_code}\n" http://localhost:3001/api/quiz-config

echo.
echo 🎯 Полезные ссылки:
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000  
echo Тест соединения: http://localhost:3000/connection-test.html
echo Тест видео: http://localhost:3000/test-videos.html
echo.

pause
