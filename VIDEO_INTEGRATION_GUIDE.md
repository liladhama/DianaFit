# Инструкция по добавлению тренировочных видео в DianaFit

## 📁 Структура файлов

Все видео должны располагаться в папке `frontend/public/videos/` в следующей структуре:

```
videos/
├── gym/                    # Тренировки для зала
│   ├── day1_glutes_hamstrings/
│   ├── day2_shoulders_triceps_abs/
│   ├── day3_back_biceps/
│   └── day4_glutes_quads_calves/
└── home/                   # Домашние тренировки
    ├── day1_cardio_circuit/
    ├── day2_functional_circuit/
    ├── day3_tabata/
    ├── day4_hiit/
    └── day5_cardio_advanced/
```

## 🎬 Формат видео

- **Формат:** MP4 (рекомендуется H.264)
- **Разрешение:** Оптимально 720p или 1080p
- **Размер:** Старайтесь оптимизировать до 5-10 МБ на видео для быстрой загрузки
- **Длительность:** 15-30 секунд на упражнение

## 📝 Правила именования

Имена файлов должны **точно** соответствовать английским названиям из `video-mapping.json`:

### Для зала (gym):

**День 1 - Ягодицы, бицепс бедра:**
- `glute_bridge_smith_machine.mp4` ← Ягодичный мост в смите
- `cable_kickback.mp4` ← Отведение ноги в кроссовере
- `good_morning.mp4` ← Гудмонинг
- `seated_leg_abduction_dropset.mp4` ← Разведение ног сидя дроп-сет
- `seated_leg_adduction.mp4` ← Сведение ног сидя

**День 2 - Плечи, трицепс, пресс:**
- `arnold_press_dropset.mp4` ← Жим Арнольда дроп-сет
- `cable_upright_row_lateral_raise_superset.mp4` ← Тяга к подбородку + махи в стороны суперсет
- `horizontal_cable_chest_pull.mp4` ← Горизонтальная тяга к груди
- `dumbbell_lateral_raises_dropset.mp4` ← Махи в стороны дроп-сет
- `lying_tricep_extension_plate.mp4` ← Французский жим лежа с блином
- `prayer_exercise.mp4` ← Молитва

**День 3 - Спина, бицепс:**
- `assisted_pullups_wide_grip.mp4` ← Подтягивания в гравитроне широким хватом
- `horizontal_row.mp4` ← Горизонтальная тяга
- `single_arm_dumbbell_row.mp4` ← Тяга гантели одной рукой
- `vertical_pulldown.mp4` ← Вертикальная тяга
- `reverse_grip_dumbbell_curls.mp4` ← Подъемы на бицепс обратным хватом
- `hanging_leg_raises.mp4` ← Подъемы ног в висе

**День 4 - Ягодицы, квадрицепс, икры:**
- `seated_leg_extension_dropset.mp4` ← Разгибание ног сидя дроп-сет
- `smith_machine_lunges.mp4` ← Выпады в смите
- `front_squat.mp4` ← Фронтальные приседания
- `cable_side_leg_raise.mp4` ← Махи ногой в сторону в кроссовере
- `seated_leg_abduction_glute_hyperextension_superset.mp4` ← Разведение ног + гиперэкстензия суперсет
- `seated_calf_raises.mp4` ← Подъемы на носки сидя

### Для дома (home):

**День 1 - Кардио:**
- `squats_with_steps_forward_backward.mp4` ← Приседания с шагами вперед-назад
- `reverse_plank_knee_raise.mp4` ← Обратная планка с подъемом колена
- `shoulder_stand.mp4` ← Стойка на плечах
- `lazy_burpees_with_squat.mp4` ← Ленивые берпи с приседом
- `cross_lunges.mp4` ← Перекрестные выпады

**День 2 - Функциональная:**
- `squats_with_leg_curl_back.mp4` ← Приседания с подъемом ноги назад
- `plank_leg_kickback.mp4` ← Планка с отведением ноги
- `squat_jump_to_plank.mp4` ← Прыжок из приседа в планку
- `boat_pose_leg_raises.mp4` ← Лодочка с подъемами ног
- `high_knees_running.mp4` ← Бег с высоким подниманием колен
- `step_ups_with_leg_swing.mp4` ← Зашагивания с махом ноги

**День 3 - Табата:**
- `jumping_jacks.mp4` ← Прыгающий джек
- `squat_reverse_lunge_combo.mp4` ← Присед + выпад назад
- `seated_book_crunches.mp4` ← Складка сидя
- `plank_up_down_shoulder_tap.mp4` ← Планка вверх-вниз + касание плеч
- `side_lunge_leg_raise.mp4` ← Боковой выпад + подъем ноги
- `diagonal_toe_touch_corner.mp4` ← Диагональное касание носка к углу
- `knee_to_stand_jump.mp4` ← Подъем с колена в прыжок

**День 4 - HIIT:**
- `stand_to_plank_walkout.mp4` ← Переход из стойки в планку
- `lying_crunches.mp4` ← Скручивания лежа
- `squat_good_morning_combo.mp4` ← Присед + наклон
- `plank_jumping_jacks.mp4` ← Планка с прыжками
- `pushup_leg_kickback.mp4` ← Отжимания с отведением ноги
- `sumo_squat_calf_raises.mp4` ← Приседания сумо + подъемы на носки

**День 5 - Кардио продвинутое:**
- `lunge_knee_raise_combo.mp4` ← Выпад + подъем колена
- `plank_hold.mp4` ← Планка статическая
- `single_leg_glute_bridge.mp4` ← Ягодичный мост на одной ноге
- `half_amplitude_crunches.mp4` ← Скручивания в половину амплитуды
- `boat_pose_shoulder_blade_squeeze.mp4` ← Лодочка со сведением лопаток
- `squat_box_jump.mp4` ← Присед + запрыгивание на коробку

## 🚀 Как добавить видео:

1. **Переименуйте** ваши видео согласно списку выше
2. **Поместите** каждое видео в соответствующую папку:
   - Зал: `frontend/public/videos/gym/dayX_название/`
   - Дом: `frontend/public/videos/home/dayX_название/`
3. **Проверьте**, что все имена файлов написаны строчными буквами и содержат подчеркивания вместо пробелов

## ✅ Проверка

После добавления видео они автоматически появятся в приложении. Система найдет их по пути:
`/videos/{location}/{dayId}/{exerciseName}.mp4`

Если видео не отображается, проверьте:
- Правильность имени файла (точное соответствие)
- Путь к файлу
- Формат (должен быть .mp4)
