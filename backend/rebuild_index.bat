@echo off
cd /d "c:\Users\user\Desktop\DianaFit\backend"
echo Установка зависимостей...
pip install -r requirements.txt
echo Запуск buildIndex.py...
python buildIndex.py
pause
