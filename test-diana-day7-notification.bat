@echo off
echo Тестирование уведомления Дианы на 7 день...
echo.

echo 1. Проверяем статус уведомления для 7 дня...
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=demo_user_local_test&date=2025-01-26&dayOfWeek=7"
echo.
echo.

echo 2. Вызываем AI анализ недели...
curl -X POST http://localhost:3001/api/openai-diana-analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": \"demo_user_local_test\"}"
echo.
echo.

echo 3. Отмечаем уведомление как показанное...
curl -X POST http://localhost:3001/api/diana-notification-mark-shown ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": \"demo_user_local_test\", \"date\": \"2025-01-26\", \"dayOfWeek\": 7}"
echo.

pause
