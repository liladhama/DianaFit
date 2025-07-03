@echo off
echo Тестирование разнообразия блюд в DianaFit...
echo.

:: Проверяем, установлены ли зависимости
if not exist "node_modules" (
    echo Установка зависимостей...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Ошибка при установке зависимостей!
        pause
        exit /b 1
    )
)

:: Проверяем backend зависимости
if not exist "backend\node_modules" (
    echo Установка зависимостей backend...
    cd backend
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Ошибка при установке зависимостей backend!
        pause
        exit /b 1
    )
)

echo Проверка работы backend...
call npm run check-backend-status

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend не запущен! Запускаем...
    start cmd /k "cd backend && npm start"
    echo Ожидание запуска backend...
    timeout /t 10
)

echo.
echo Запуск тестов разнообразия блюд...
call npm run test-diversity

echo.
echo Тестирование завершено.
pause
