@echo off
echo Запуск тестов Firestore...
cd /d "%~dp0"
cd backend
node test-firestore.js
pause
