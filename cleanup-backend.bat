@echo off
echo Очистка бэкенда от ненужных файлов...

rem Переходим в директорию бэкенда
cd c:\Users\user\Desktop\DianaFit\backend

rem Создаем бэкап файлов перед удалением
echo Создание бэкапа файлов...
mkdir backup_files 2>nul
copy buildIndex.py backup_files\ 2>nul
copy qa.py backup_files\ 2>nul
copy kb_faiss.index backup_files\ 2>nul
copy kb_meta.jsonl backup_files\ 2>nul
copy requirements.txt backup_files\ 2>nul
copy rebuild_index.bat backup_files\ 2>nul

rem Удаляем ненужные файлы
echo Удаление ненужных файлов...
del buildIndex.py 2>nul
del qa.py 2>nul
del kb_faiss.index 2>nul
del kb_meta.jsonl 2>nul
del requirements.txt 2>nul
del rebuild_index.bat 2>nul

echo Очистка завершена!
echo Файлы сохранены в папке backup_files
echo Оставлены только файлы, необходимые для работы с Mistral AI

pause
