@echo off
echo 🚀 Отправляем изменения на GitHub...

echo 📝 Добавляем все файлы...
git add .

echo 💬 Создаем коммит...
set /p commit_message="Введите сообщение коммита (или нажмите Enter для использования по умолчанию): "
if "%commit_message%"=="" set commit_message=Backend and frontend updates - %date% %time%

git commit -m "%commit_message%"

echo 🌐 Отправляем на GitHub...
git push origin main

echo ✅ Готово! Изменения отправлены на GitHub.
echo 🔗 Render автоматически обновит backend в течение 1-2 минут.

pause
