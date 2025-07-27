@echo off
echo ========================================
echo ТЕСТИРОВАНИЕ ОПТИМИЗИРОВАННЫХ ENDPOINTS
echo ========================================

echo.
echo 1. GET /api/progress - получение прогресса за день
curl -X GET "http://localhost:3001/api/progress?userId=test_user&date=2024-07-27"

echo.
echo.
echo 2. POST /api/progress - сохранение прогресса (ОПТИМИЗИРОВАННЫЙ)
curl -X POST "http://localhost:3001/api/progress" -H "Content-Type: application/json" -d "{\"userId\":\"test_user\",\"date\":\"2024-07-27\",\"tasks\":[{\"name\":\"Приседания\",\"type\":\"workout\",\"done\":true},{\"name\":\"Завтрак\",\"type\":\"meal\",\"done\":true}]}"

echo.
echo.
echo 3. GET /api/user/quiz-answers/:userId - получение quiz данных (ОПТИМИЗИРОВАННЫЙ)
curl -X GET "http://localhost:3001/api/user/quiz-answers/test_user"

echo.
echo.
echo 4. POST /api/user/quiz-answers/:userId - сохранение quiz данных (ОПТИМИЗИРОВАННЫЙ)
curl -X POST "http://localhost:3001/api/user/quiz-answers/test_user" -H "Content-Type: application/json" -d "{\"calories\":1800,\"gender\":\"female\",\"weight\":65}"

echo.
echo.
echo 5. GET /api/subscription/status/:userId - статус подписки (ОПТИМИЗИРОВАННЫЙ)
curl -X GET "http://localhost:3001/api/subscription/status/test_user"

echo.
echo.
echo 6. POST /api/subscription/activate-premium - активация премиума (ОПТИМИЗИРОВАННЫЙ)
curl -X POST "http://localhost:3001/api/subscription/activate-premium" -H "Content-Type: application/json" -d "{\"userId\":\"test_user\"}"

echo.
echo.
echo 7. GET /api/progress/weekly-history - недельная история (ОПТИМИЗИРОВАННЫЙ)
curl -X GET "http://localhost:3001/api/progress/weekly-history?userId=test_user"

echo.
echo.
echo 8. GET /api/progress/summary - сводка прогресса (ОПТИМИЗИРОВАННЫЙ)
curl -X GET "http://localhost:3001/api/progress/summary?userId=test_user&from=2024-07-20&to=2024-07-27"

echo.
echo ========================================
echo ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ========================================
pause
