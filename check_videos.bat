@echo off
chcp 65001 > nul
echo 🔍 Проверка наличия видео файлов DianaFit...
echo.

cd /d "%~dp0"
cd frontend\public\videos

set "missing_count=0"
set "found_count=0"

echo 🏋️ Проверка видео для ЗАЛА:
echo ==========================================

echo 📅 День 1 - Ягодицы, бицепс бедра:
call :check_file "gym\day1_glutes_hamstrings\glute_bridge_smith_machine.mp4" "Ягодичный мост в смите"
call :check_file "gym\day1_glutes_hamstrings\cable_kickback.mp4" "Отведение ноги в кроссовере"
call :check_file "gym\day1_glutes_hamstrings\good_morning.mp4" "Гудмонинг"
call :check_file "gym\day1_glutes_hamstrings\seated_leg_abduction_dropset.mp4" "Разведение ног сидя дроп-сет"
call :check_file "gym\day1_glutes_hamstrings\seated_leg_adduction.mp4" "Сведение ног сидя"

echo.
echo 📅 День 2 - Плечи, трицепс, пресс:
call :check_file "gym\day2_shoulders_triceps_abs\arnold_press_dropset.mp4" "Жим Арнольда дроп-сет"
call :check_file "gym\day2_shoulders_triceps_abs\cable_upright_row_lateral_raise_superset.mp4" "Тяга к подбородку + махи"
call :check_file "gym\day2_shoulders_triceps_abs\horizontal_cable_chest_pull.mp4" "Горизонтальная тяга к груди"
call :check_file "gym\day2_shoulders_triceps_abs\dumbbell_lateral_raises_dropset.mp4" "Махи в стороны дроп-сет"
call :check_file "gym\day2_shoulders_triceps_abs\lying_tricep_extension_plate.mp4" "Французский жим лежа"
call :check_file "gym\day2_shoulders_triceps_abs\prayer_exercise.mp4" "Молитва"

echo.
echo 📅 День 3 - Спина, бицепс:
call :check_file "gym\day3_back_biceps\assisted_pullups_wide_grip.mp4" "Подтягивания в гравитроне"
call :check_file "gym\day3_back_biceps\horizontal_row.mp4" "Горизонтальная тяга"
call :check_file "gym\day3_back_biceps\single_arm_dumbbell_row.mp4" "Тяга гантели одной рукой"
call :check_file "gym\day3_back_biceps\vertical_pulldown.mp4" "Вертикальная тяга"
call :check_file "gym\day3_back_biceps\reverse_grip_dumbbell_curls.mp4" "Подъемы на бицепс обратным хватом"
call :check_file "gym\day3_back_biceps\hanging_leg_raises.mp4" "Подъемы ног в висе"

echo.
echo 📅 День 4 - Ягодицы, квадрицепс, икры:
call :check_file "gym\day4_glutes_quads_calves\seated_leg_extension_dropset.mp4" "Разгибание ног сидя дроп-сет"
call :check_file "gym\day4_glutes_quads_calves\smith_machine_lunges.mp4" "Выпады в смите"
call :check_file "gym\day4_glutes_quads_calves\front_squat.mp4" "Фронтальные приседания"
call :check_file "gym\day4_glutes_quads_calves\cable_side_leg_raise.mp4" "Махи ногой в сторону"
call :check_file "gym\day4_glutes_quads_calves\seated_leg_abduction_glute_hyperextension_superset.mp4" "Разведение ног + гиперэкстензия"
call :check_file "gym\day4_glutes_quads_calves\seated_calf_raises.mp4" "Подъемы на носки сидя"

echo.
echo 🏠 Проверка видео для ДОМА:
echo ==========================================

echo 📅 День 1 - Кардио:
call :check_file "home\day1_cardio_circuit\squats_with_steps_forward_backward.mp4" "Приседания с шагами"
call :check_file "home\day1_cardio_circuit\reverse_plank_knee_raise.mp4" "Обратная планка с подъемом колена"
call :check_file "home\day1_cardio_circuit\shoulder_stand.mp4" "Стойка на плечах"
call :check_file "home\day1_cardio_circuit\lazy_burpees_with_squat.mp4" "Ленивые берпи"
call :check_file "home\day1_cardio_circuit\cross_lunges.mp4" "Перекрестные выпады"

echo.
echo 📅 День 2 - Функциональная:
call :check_file "home\day2_functional_circuit\squats_with_leg_curl_back.mp4" "Приседания с подъемом ноги"
call :check_file "home\day2_functional_circuit\plank_leg_kickback.mp4" "Планка с отведением ноги"
call :check_file "home\day2_functional_circuit\squat_jump_to_plank.mp4" "Прыжок из приседа в планку"
call :check_file "home\day2_functional_circuit\boat_pose_leg_raises.mp4" "Лодочка с подъемами ног"
call :check_file "home\day2_functional_circuit\high_knees_running.mp4" "Бег с высоким подниманием колен"
call :check_file "home\day2_functional_circuit\step_ups_with_leg_swing.mp4" "Зашагивания с махом ноги"

echo.
echo 📅 День 3 - Табата:
call :check_file "home\day3_tabata\jumping_jacks.mp4" "Прыгающий джек"
call :check_file "home\day3_tabata\squat_reverse_lunge_combo.mp4" "Присед + выпад назад"
call :check_file "home\day3_tabata\seated_book_crunches.mp4" "Складка сидя"
call :check_file "home\day3_tabata\plank_up_down_shoulder_tap.mp4" "Планка вверх-вниз + касание плеч"
call :check_file "home\day3_tabata\side_lunge_leg_raise.mp4" "Боковой выпад + подъем ноги"
call :check_file "home\day3_tabata\diagonal_toe_touch_corner.mp4" "Диагональное касание носка"
call :check_file "home\day3_tabata\knee_to_stand_jump.mp4" "Подъем с колена в прыжок"

echo.
echo 📅 День 4 - HIIT:
call :check_file "home\day4_hiit\stand_to_plank_walkout.mp4" "Переход из стойки в планку"
call :check_file "home\day4_hiit\lying_crunches.mp4" "Скручивания лежа"
call :check_file "home\day4_hiit\squat_good_morning_combo.mp4" "Присед + наклон"
call :check_file "home\day4_hiit\plank_jumping_jacks.mp4" "Планка с прыжками"
call :check_file "home\day4_hiit\pushup_leg_kickback.mp4" "Отжимания с отведением ноги"
call :check_file "home\day4_hiit\sumo_squat_calf_raises.mp4" "Приседания сумо + подъемы на носки"

echo.
echo 📅 День 5 - Кардио продвинутое:
call :check_file "home\day5_cardio_advanced\lunge_knee_raise_combo.mp4" "Выпад + подъем колена"
call :check_file "home\day5_cardio_advanced\plank_hold.mp4" "Планка статическая"
call :check_file "home\day5_cardio_advanced\single_leg_glute_bridge.mp4" "Ягодичный мост на одной ноге"
call :check_file "home\day5_cardio_advanced\half_amplitude_crunches.mp4" "Скручивания в половину амплитуды"
call :check_file "home\day5_cardio_advanced\boat_pose_shoulder_blade_squeeze.mp4" "Лодочка со сведением лопаток"
call :check_file "home\day5_cardio_advanced\squat_box_jump.mp4" "Присед + запрыгивание на коробку"

echo.
echo ==========================================
echo 📊 ИТОГОВАЯ СТАТИСТИКА:
echo ✅ Найдено видео: %found_count%
echo ❌ Отсутствует видео: %missing_count%
echo ==========================================
echo.

if %missing_count% equ 0 (
    echo 🎉 Все видео на месте! Можно запускать приложение.
) else (
    echo 📋 Добавьте недостающие видео согласно инструкции в VIDEO_INTEGRATION_GUIDE.md
)

echo.
pause
goto :eof

:check_file
if exist "%~1" (
    echo   ✅ %~2
    set /a "found_count+=1"
) else (
    echo   ❌ %~2
    set /a "missing_count+=1"
)
goto :eof
