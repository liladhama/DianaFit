# 🎯 ИНСТРУКЦИЯ ПО ИНТЕГРАЦИИ ВИДЕО ДЛЯ ДИАФИТ

## 📁 Структура создана!

Все папки для 5 тренировок созданы в `frontend/public/videos/gym/`:

```
gym/
├── day1_back_shoulders/     (6 видео)
├── day2_glutes/            (4 видео)  
├── day3_glutes_hamstrings/ (5 видео)
├── day4_back_shoulders/    (6 видео)
└── day5_glutes_focused/    (3 видео)
```

## 🎬 КАК ПЕРЕИМЕНОВАТЬ И РАЗМЕСТИТЬ ВИДЕО:

### 1️⃣ Переименуйте ваши видео файлы:

**День 1 (Спина/Плечи):**
- Тяга верхнего блока широким хватом → `lat_pulldown_wide_grip.mp4`
- Тяга верхнего блока узким хватом → `lat_pulldown_close_grip.mp4`
- Тяга в тренажере Хаммер двумя руками → `hammer_machine_row_both_hands.mp4`
- Жим гантелей сидя → `seated_dumbbell_press.mp4`
- Махи гантелей в стороны → `dumbbell_lateral_raises.mp4`
- Отведения на заднюю дельту → `rear_delt_flyes.mp4`

**День 2 (Ягодицы):**
- Жим платформы лежа → `leg_press_lying.mp4`
- Румынская тяга в Смите → `romanian_deadlift_smith_machine.mp4`
- Приседания с узкой постановкой ног → `narrow_stance_squats.mp4`
- Ягодичный мост в Смите в короткую амплитуду → `smith_machine_glute_bridge_short_range.mp4`

**День 3 (Ягодицы/Задняя поверхность бедра):**
- Ягодичный мост со свободным весом → `free_weight_glute_bridge.mp4`
- Жим платформы одной ногой → `single_leg_press.mp4`
- Румынская тяга со свободным весом → `free_weight_romanian_deadlift.mp4`
- Сгибания ног в тренажере → `lying_leg_curls.mp4`
- Отведения бедра сидя → `seated_hip_abduction.mp4`

**День 4 (Спина/Плечи):**
- Тяга нижнего блока узким хватом → `cable_row_close_grip.mp4`
- Тяга одной рукой в тренажере Хаммер → `single_arm_hammer_row.mp4`
- Тяга верхнего блока широким хватом → `lat_pulldown_wide_grip.mp4`
- Отведения за заднюю дельту в тренажере бабочка → `rear_delt_machine_flyes.mp4`
- Махи гантелей стоя → `standing_dumbbell_lateral_raises.mp4`
- Жим на плечи в Смите → `smith_machine_shoulder_press.mp4`

**День 5 (Ягодицы фокусированная):**
- Отведения бедра в тренажере → `hip_abduction_machine.mp4`
- Ягодичный мост со свободным весом → `free_weight_glute_bridge.mp4`
- Приседания с узкой постановкой ног в Смите → `smith_machine_narrow_squats.mp4`

### 2️⃣ Разместите видео в соответствующие папки:

```
frontend/public/videos/gym/day1_back_shoulders/
├── lat_pulldown_wide_grip.mp4
├── lat_pulldown_close_grip.mp4
├── hammer_machine_row_both_hands.mp4
├── seated_dumbbell_press.mp4
├── dumbbell_lateral_raises.mp4
└── rear_delt_flyes.mp4

frontend/public/videos/gym/day2_glutes/
├── leg_press_lying.mp4
├── romanian_deadlift_smith_machine.mp4
├── narrow_stance_squats.mp4
└── smith_machine_glute_bridge_short_range.mp4

... и так далее для всех дней
```

### 3️⃣ Проверьте интеграцию:

Запустите файл `check_gym_videos.bat` для проверки всех видео:

```
check_gym_videos.bat
```

Он покажет какие видео найдены ✅ и какие отсутствуют ❌

### 4️⃣ Форматы видео:

- ✅ Только `.mp4` формат
- ✅ Названия точно как указано выше
- ✅ Не используйте пробелы в названиях
- ✅ Используйте только английские символы

## 📋 Дополнительные файлы:

- `GYM_VIDEO_INTEGRATION_GUIDE.md` - подробное руководство
- `gym_workouts_mapping.json` - полная структура тренировок  
- `exercise_names_list.md` - все названия для копирования
- `exercise_mapping.json` - маппинг русских названий к английским

## 🚀 После размещения видео:

1. Запустите приложение: `npm start` в папке `frontend/`
2. Проверьте что видео отображаются в тренировках
3. Убедитесь что видео проигрываются

## ❓ При проблемах:

1. Проверьте названия файлов (точное соответствие)
2. Проверьте структуру папок
3. Убедитесь что формат `.mp4`
4. Запустите `check_gym_videos.bat` для диагностики

Готово! Теперь ваше приложение поддерживает 5 полноценных тренировок для зала! 💪
