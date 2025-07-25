@echo off
echo Тестирование гендерной логики уведомлений Дианы...
echo.

echo === ТЕСТ 1: Пользователь с мужским полом ===
echo Создаем тестового пользователя с полом male...
curl -X POST http://localhost:3001/api/user/quiz-answers ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": \"test_male_user\", \"quiz\": {\"sex\": \"male\"}, \"answers\": []}"
echo.

echo Проверяем уведомление для дня 1...
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=test_male_user&date=2025-07-25&dayOfWeek=1"
echo.

echo === ТЕСТ 2: Пользователь с женским полом ===
echo Создаем тестового пользователя с полом female...
curl -X POST http://localhost:3001/api/user/quiz-answers ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": \"test_female_user\", \"quiz\": {\"sex\": \"female\"}, \"answers\": []}"
echo.

echo Проверяем уведомление для дня 1...
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=test_female_user&date=2025-07-25&dayOfWeek=1"
echo.

echo === ТЕСТ 3: Пользователь без указанного пола (должны быть универсальные сообщения) ===
echo Создаем тестового пользователя без пола...
curl -X POST http://localhost:3001/api/user/quiz-answers ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": \"test_unknown_user\", \"quiz\": {}, \"answers\": []}"
echo.

echo Проверяем уведомление для дня 1...
curl -X GET "http://localhost:3001/api/diana-notification-status?userId=test_unknown_user&date=2025-07-25&dayOfWeek=1"
echo.

echo.
echo === Тестируем дни 2-6 для мужского пола ===
for /L %%i in (2,1,6) do (
    echo День %%i:
    curl -X GET "http://localhost:3001/api/diana-notification-status?userId=test_male_user&date=2025-07-25&dayOfWeek=%%i"
    echo.
)

pause
