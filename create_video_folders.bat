@echo off
echo Создание структуры папок для видео DianaFit...

cd /d "%~dp0"
cd frontend\public\videos

echo Создание папок для зала...
if not exist "gym\day1_glutes_hamstrings" mkdir "gym\day1_glutes_hamstrings"
if not exist "gym\day2_shoulders_triceps_abs" mkdir "gym\day2_shoulders_triceps_abs"
if not exist "gym\day3_back_biceps" mkdir "gym\day3_back_biceps"
if not exist "gym\day4_glutes_quads_calves" mkdir "gym\day4_glutes_quads_calves"

echo Создание папок для дома...
if not exist "home\day1_cardio_circuit" mkdir "home\day1_cardio_circuit"
if not exist "home\day2_functional_circuit" mkdir "home\day2_functional_circuit"
if not exist "home\day3_tabata" mkdir "home\day3_tabata"
if not exist "home\day4_hiit" mkdir "home\day4_hiit"
if not exist "home\day5_cardio_advanced" mkdir "home\day5_cardio_advanced"

echo.
echo ✅ Структура папок создана успешно!
echo.
echo 📁 Теперь можете добавлять видео в соответствующие папки:
echo    - Зал: frontend\public\videos\gym\
echo    - Дом: frontend\public\videos\home\
echo.
echo 📖 Подробные инструкции смотрите в VIDEO_INTEGRATION_GUIDE.md
echo.
pause
