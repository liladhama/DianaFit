@echo off
echo Starting DianaFit Full Stack...
echo.
echo Starting Backend first...
start "DianaFit Backend" cmd /k "cd /d c:\Users\user\Desktop\DianaFit\backend && npm start"

timeout /t 5 /nobreak > nul

echo Starting Frontend...
start "DianaFit Frontend" cmd /k "cd /d c:\Users\user\Desktop\DianaFit\frontend && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
pause
