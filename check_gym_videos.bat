@echo off
chcp 65001 > nul
echo 🔍 Проверка наличия видео файлов DianaFit (Новая структура)...
echo.

cd /d "%~dp0"
cd frontend\public\videos

set "missing_count=0"
set "found_count=0"

echo 🏋️ Проверка видео для ЗАЛА (5 тренировок):
echo ==========================================

echo 📅 День 1 - Спина/Плечи:
call :check_file "gym\day1_back_shoulders\lat_pulldown_wide_grip.mp4" "Тяга верхнего блока широким хватом"
call :check_file "gym\day1_back_shoulders\lat_pulldown_close_grip.mp4" "Тяга верхнего блока узким хватом"
call :check_file "gym\day1_back_shoulders\hammer_machine_row_both_hands.mp4" "Тяга в тренажере Хаммер двумя руками"
call :check_file "gym\day1_back_shoulders\seated_dumbbell_press.mp4" "Жим гантелей сидя"
call :check_file "gym\day1_back_shoulders\dumbbell_lateral_raises.mp4" "Махи гантелей в стороны"
call :check_file "gym\day1_back_shoulders\rear_delt_flyes.mp4" "Отведения на заднюю дельту"

echo.
echo 📅 День 2 - Ягодицы:
call :check_file "gym\day2_glutes\leg_press_lying.mp4" "Жим платформы лежа"
call :check_file "gym\day2_glutes\romanian_deadlift_smith_machine.mp4" "Румынская тяга в Смите"
call :check_file "gym\day2_glutes\narrow_stance_squats.mp4" "Приседания с узкой постановкой ног"
call :check_file "gym\day2_glutes\smith_machine_glute_bridge_short_range.mp4" "Ягодичный мост в Смите в короткую амплитуду"

echo.
echo 📅 День 3 - Ягодицы/Задняя поверхность бедра:
call :check_file "gym\day3_glutes_hamstrings\free_weight_glute_bridge.mp4" "Ягодичный мост со свободным весом"
call :check_file "gym\day3_glutes_hamstrings\single_leg_press.mp4" "Жим платформы одной ногой"
call :check_file "gym\day3_glutes_hamstrings\free_weight_romanian_deadlift.mp4" "Румынская тяга со свободным весом"
call :check_file "gym\day3_glutes_hamstrings\lying_leg_curls.mp4" "Сгибания ног в тренажере"
call :check_file "gym\day3_glutes_hamstrings\seated_hip_abduction.mp4" "Отведения бедра сидя"

echo.
echo 📅 День 4 - Спина/Плечи:
call :check_file "gym\day4_back_shoulders\cable_row_close_grip.mp4" "Тяга нижнего блока узким хватом"
call :check_file "gym\day4_back_shoulders\single_arm_hammer_row.mp4" "Тяга одной рукой в тренажере Хаммер"
call :check_file "gym\day4_back_shoulders\lat_pulldown_wide_grip.mp4" "Тяга верхнего блока широким хватом"
call :check_file "gym\day4_back_shoulders\rear_delt_machine_flyes.mp4" "Отведения за заднюю дельту в тренажере бабочка"
call :check_file "gym\day4_back_shoulders\standing_dumbbell_lateral_raises.mp4" "Махи гантелей стоя"
call :check_file "gym\day4_back_shoulders\smith_machine_shoulder_press.mp4" "Жим на плечи в Смите"

echo.
echo 📅 День 5 - Ягодицы (фокусированная тренировка):
call :check_file "gym\day5_glutes_focused\hip_abduction_machine.mp4" "Отведения бедра в тренажере"
call :check_file "gym\day5_glutes_focused\free_weight_glute_bridge.mp4" "Ягодичный мост со свободным весом"
call :check_file "gym\day5_glutes_focused\smith_machine_narrow_squats.mp4" "Приседания с узкой постановкой ног в Смите"

echo.
echo 🏠 Проверка видео для ДОМА:
echo ==========================================

echo 📅 День 1 - Кардио контур:
call :check_file "home\day1_cardio_circuit\squats_with_steps_forward_backward.mp4" "Приседания с шагами"
call :check_file "home\day1_cardio_circuit\reverse_plank_knee_raise.mp4" "Обратная планка с подъемом колена"
call :check_file "home\day1_cardio_circuit\shoulder_stand.mp4" "Стойка на плечах"
call :check_file "home\day1_cardio_circuit\lazy_burpees_with_squat.mp4" "Ленивые берпи с приседом"
call :check_file "home\day1_cardio_circuit\cross_lunges.mp4" "Перекрестные выпады"

echo.
echo 📅 День 2 - Функциональный контур:
call :check_file "home\day2_functional_circuit\squats_with_leg_curl_back.mp4" "Приседания с подъемом ноги назад"
call :check_file "home\day2_functional_circuit\plank_leg_kickback.mp4" "Планка с отведением ноги"
call :check_file "home\day2_functional_circuit\squat_jump_to_plank.mp4" "Прыжок из приседа в планку"
call :check_file "home\day2_functional_circuit\boat_pose_leg_raises.mp4" "Лодочка с подъемами ног"
call :check_file "home\day2_functional_circuit\high_knees_running.mp4" "Бег с высоким подниманием колен"
call :check_file "home\day2_functional_circuit\step_ups_with_leg_swing.mp4" "Зашагивания с махом ноги"

echo.
echo ==========================================
echo 📊 ИТОГОВАЯ СТАТИСТИКА:
echo ✅ Найдено файлов: %found_count%
echo ❌ Отсутствует файлов: %missing_count%
echo.

if %missing_count% equ 0 (
    echo 🎉 Все видео файлы на месте! Готово к работе!
) else (
    echo ⚠️  Обнаружены отсутствующие файлы. 
    echo 📋 Проверьте руководство GYM_VIDEO_INTEGRATION_GUIDE.md
)

echo.
pause
goto :eof

:check_file
if exist "%~1" (
    echo ✅ %~2
    set /a found_count+=1
) else (
    echo ❌ %~2 - ОТСУТСТВУЕТ
    set /a missing_count+=1
)
goto :eof
