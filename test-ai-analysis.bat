@echo off
echo "Тестируем AI анализ недели..."
echo "Отправляем POST запрос к API..."

curl -X POST http://localhost:3001/api/openai-diana-analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"demo_user_local_test\"}" ^
  --verbose

pause
