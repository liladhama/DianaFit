@echo off
echo Тестирование уведомлений Дианы на дни 1-6...
echo.

echo === День 1 (приветствие) ===
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=demo_user_local_test&date=2025-01-26&dayOfWeek=1"
echo.

echo === День 2 (мотивация при пропусках) ===
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=demo_user_local_test&date=2025-01-26&dayOfWeek=2"
echo.

echo === День 3 ===
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=demo_user_local_test&date=2025-01-26&dayOfWeek=3"
echo.

echo === День 4 ===
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=demo_user_local_test&date=2025-01-26&dayOfWeek=4"
echo.

echo === День 5 ===
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=demo_user_local_test&date=2025-01-26&dayOfWeek=5"
echo.

echo === День 6 ===
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=demo_user_local_test&date=2025-01-26&dayOfWeek=6"
echo.

echo Отмечаем уведомления как показанные...
curl -X POST http://localhost:3001/api/diana-notification-mark-shown ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": \"demo_user_local_test\", \"date\": \"2025-01-26\", \"dayOfWeek\": 1}"
echo.

pause
