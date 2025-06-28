# Структура видео для тренировок DianaFit

## Папки

### `/gym/` - Тренировки для зала
- `day1_glutes_hamstrings/` - День 1: Ягодицы, бицепс бедра
- `day2_shoulders_triceps_abs/` - День 2: Плечи, трицепс, пресс  
- `day3_back_biceps/` - День 3: Спина, бицепс
- `day4_glutes_quads_calves/` - День 4: Ягодицы, квадрицепс, икры

### `/home/` - Домашние тренировки
- `day1_cardio_circuit/` - День 1: Кардио (5 кругов)
- `day2_functional_circuit/` - День 2: Функциональная (5 кругов)
- `day3_tabata/` - День 3: Табата (20с/10с, 6 кругов)
- `day4_hiit/` - День 4: HIIT (40с/20с, 5 подходов)
- `day5_cardio_advanced/` - День 5: Кардио продвинутое (5 кругов)

## Формат именования видео

Каждое видео должно называться по английскому имени упражнения из `video-mapping.json`:

### Пример для зала:
- `glute_bridge_smith_machine.mp4` - Ягодичный мост в смите
- `arnold_press_dropset.mp4` - Жим Арнольда дроп-сет
- `assisted_pullups_wide_grip.mp4` - Подтягивания в гравитроне

### Пример для дома:
- `jumping_jacks.mp4` - Прыгающий джек
- `squat_reverse_lunge_combo.mp4` - Присед + выпад назад
- `plank_hold.mp4` - Планка

## Использование в коде

Система будет автоматически подставлять видео по следующей схеме:

```javascript
const videoPath = `/videos/${location}/${dayId}/${exerciseName}.mp4`;
// Например: /videos/home/day1_cardio_circuit/jumping_jacks.mp4
```

Где:
- `location` - "gym" или "home"
- `dayId` - день тренировки (например: "day1_glutes_hamstrings")
- `exerciseName` - английское название упражнения

## Полный список упражнений

См. файл `video-mapping.json` для полного соответствия русских и английских названий.
