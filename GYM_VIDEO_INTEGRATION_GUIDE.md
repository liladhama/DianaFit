# Руководство по интеграции видео для тренировок в зале

## Структура папок для видео

Все видео должны быть размещены в папке: `frontend/public/videos/gym/`

### Папки по дням тренировок:

1. **day1_back_shoulders** - Тренировка 1: Спина/Плечи
2. **day2_glutes** - Тренировка 2: Ягодицы  
3. **day3_glutes_hamstrings** - Тренировка 3: Ягодицы/Задняя поверхность бедра
4. **day4_back_shoulders** - Тренировка 4: Спина/Плечи
5. **day5_glutes_focused** - Тренировка 5: Ягодицы (фокусированная)

## Названия видео файлов

Все видео должны быть в формате `.mp4` и названы в соответствии с английскими именами упражнений.

### Тренировка 1 (day1_back_shoulders):
- `lat_pulldown_wide_grip.mp4` - Тяга верхнего блока широким хватом
- `lat_pulldown_close_grip.mp4` - Тяга верхнего блока узким хватом  
- `hammer_machine_row_both_hands.mp4` - Тяга в тренажере Хаммер двумя руками
- `seated_dumbbell_press.mp4` - Жим гантелей сидя
- `dumbbell_lateral_raises.mp4` - Махи гантелей в стороны
- `rear_delt_flyes.mp4` - Отведения на заднюю дельту

### Тренировка 2 (day2_glutes):
- `leg_press_lying.mp4` - Жим платформы лежа
- `romanian_deadlift_smith_machine.mp4` - Румынская тяга в Смите
- `narrow_stance_squats.mp4` - Приседания с узкой постановкой ног
- `smith_machine_glute_bridge_short_range.mp4` - Ягодичный мост в Смите в короткую амплитуду

### Тренировка 3 (day3_glutes_hamstrings):
- `free_weight_glute_bridge.mp4` - Ягодичный мост со свободным весом
- `single_leg_press.mp4` - Жим платформы одной ногой
- `free_weight_romanian_deadlift.mp4` - Румынская тяга со свободным весом
- `lying_leg_curls.mp4` - Сгибания ног в тренажере на проработку задней поверхности бедра
- `seated_hip_abduction.mp4` - Отведения бедра сидя

### Тренировка 4 (day4_back_shoulders):
- `cable_row_close_grip.mp4` - Тяга нижнего блока узким хватом
- `single_arm_hammer_row.mp4` - Тяга одной рукой в тренажере Хаммер
- `lat_pulldown_wide_grip.mp4` - Тяга верхнего блока широким хватом
- `rear_delt_machine_flyes.mp4` - Отведения за заднюю дельту в тренажере бабочка
- `standing_dumbbell_lateral_raises.mp4` - Махи гантелей стоя
- `smith_machine_shoulder_press.mp4` - Жим на плечи в Смите

### Тренировка 5 (day5_glutes_focused):
- `hip_abduction_machine.mp4` - Отведения бедра в тренажере
- `free_weight_glute_bridge.mp4` - Ягодичный мост со свободным весом
- `smith_machine_narrow_squats.mp4` - Приседания с узкой постановкой ног в Смите

## Инструкции по размещению:

1. Создайте папки для каждого дня тренировок в `frontend/public/videos/gym/`
2. Переименуйте ваши видео файлы в соответствии с таблицей выше
3. Разместите видео в соответствующие папки
4. Проверьте, что все видео в формате `.mp4`
5. Запустите скрипт проверки: `check_videos.bat`

## Пример структуры:
```
frontend/public/videos/gym/
├── day1_back_shoulders/
│   ├── lat_pulldown_wide_grip.mp4
│   ├── lat_pulldown_close_grip.mp4
│   ├── hammer_machine_row_both_hands.mp4
│   ├── seated_dumbbell_press.mp4
│   ├── dumbbell_lateral_raises.mp4
│   └── rear_delt_flyes.mp4
├── day2_glutes/
│   ├── leg_press_lying.mp4
│   ├── romanian_deadlift_smith_machine.mp4
│   ├── narrow_stance_squats.mp4
│   └── smith_machine_glute_bridge_short_range.mp4
└── ...остальные дни
```

## Проверка интеграции:

После размещения видео запустите приложение и проверьте:
1. Видео отображаются на соответствующих тренировочных днях
2. Видео проигрываются корректно
3. Названия упражнений соответствуют видео

При возникновении проблем проверьте:
- Правильность названий файлов
- Формат видео (.mp4)
- Структуру папок
