// Заглушка API для генерации и выдачи недельного плана
import express from 'express';
const router = express.Router();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

// В памяти (для примера)
const programs = {};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Удалена загрузка knowledge_base_full.jsonl, так как она не используется

// Функции для получения тренировок
function getGymWorkoutTitle(dayNumber) {
  const titles = {
    1: 'День 1 | Силовая: ягодицы, бицепс бедра',
    2: 'День 2 | Плечи, трицепс, пресс',
    3: 'День 3 | Спина, бицепс',
    4: 'День 4 | Ягодицы, квадрицепс, икры'
  };
  return titles[((dayNumber - 1) % 4) + 1];
}

function getHomeWorkoutTitle(dayNumber) {
  const titles = {
    1: 'День 1 | К (вт) — 5 кругов, отдых 1 мин',
    2: 'День 2 | Ф (нп) — 5 кругов',
    3: 'День 3 | T — 20 с работа / 10 с отдых, 6 кругов',
    4: 'День 4 | HIIT (вт) — 40 с работа / 20 с отдых',
    5: 'День 5 | К (нп) — 5 кругов, бег на месте'
  };
  return titles[((dayNumber - 1) % 5) + 1];
}

function getGymExercises(dayNumber) {
  const exercisesByDay = {
    1: [
      { name: 'Ягодичный мост в смите', reps: 15 },
      { name: 'Мах ногой назад в кроссовере', reps: 15 },
      { name: 'Гуд Морнинг', reps: 15 }
    ],
    2: [
      { name: 'Жим Арнольда дроп-сет', reps: 16 },
      { name: 'Тяга в нижнем кроссовере к подбородку', reps: 15 },
      { name: 'Отведения рук с гантелями дроп-сет', reps: 15 }
    ],
    3: [
      { name: 'Подтягивания в гравитроне', reps: 12 },
      { name: 'Горизонтальная тяга', reps: 15 },
      { name: 'Тяга гантели в наклоне', reps: 15 }
    ],
    4: [
      { name: 'Разгибание ног сидя дроп-сет', reps: 15 },
      { name: 'Выпады в смите', reps: 15 },
      { name: 'Фронтальный присед', reps: 12 }
    ]
  };
  return exercisesByDay[((dayNumber - 1) % 4) + 1];
}

function getHomeExercises(dayNumber) {
  const exercisesByDay = {
    1: [
      { name: 'Приседания с шагами вперёд', reps: 12 },
      { name: 'Обратная планка с подъёмом колена', reps: 18 },
      { name: 'Берёзка', reps: 18 }
    ],
    2: [
      { name: 'Приседания с захлёстом ноги назад', reps: 10 },
      { name: 'Планка с махом ноги назад', reps: 8 },
      { name: 'Прыжок в планку из положения приседа', reps: 12 }
    ],
    3: [
      { name: 'Прыгающий джек', reps: 20 },
      { name: 'Присед + выпад назад', reps: 15 },
      { name: 'Книжка сидя на ягодицах', reps: 20 }
    ],
    4: [
      { name: 'Выход в планку из положения стоя', reps: 12 },
      { name: 'Скручивания лёжа', reps: 20 },
      { name: 'Присед + гудмонинг', reps: 15 }
    ],
    5: [
      { name: 'Выпад + подъём колена', reps: 12 },
      { name: 'Планка', reps: 30 },
      { name: 'Ягодичный мостик на 1 ноге', reps: 15 }
    ]
  };
  return exercisesByDay[((dayNumber - 1) % 5) + 1];
}

// POST /api/program — генерация и сохранение полной программы через ИИ
router.post('/program', async (req, res) => {
  const { userId, profile } = req.body;
  const programId = userId + '-' + Date.now();
  const startDate = profile.start_date || new Date().toISOString().slice(0, 10);
  const workoutsPerWeek = profile.workouts_per_week || 3; // по умолчанию 3 тренировки
  const location = profile.gym_or_home || 'home'; // зал или дом

  // --- ЗАГЛУШКА: возвращаем фейковый план без вызова ИИ ---
  const days = Array.from({ length: 7 }).map((_, i) => {
    const isWorkoutDay = i < workoutsPerWeek; // первые N дней недели - тренировочные
    
    return {
      title: `День ${i + 1}`,
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      workout: isWorkoutDay ? {
        name: location === 'gym' ? `Тренировка в зале ${i + 1}` : `Домашняя тренировка ${i + 1}`,
        title: location === 'gym' ? getGymWorkoutTitle(i + 1) : getHomeWorkoutTitle(i + 1),
        exercises: location === 'gym' ? getGymExercises(i + 1) : getHomeExercises(i + 1)
      } : null,
      meals: [
        { name: 'Завтрак', menu: 'Овсянка, банан, чай' },
        { name: 'Обед', menu: 'Курица, гречка, салат' },
        { name: 'Ужин', menu: 'Творог, яблоко' }
      ],
      completedWorkout: false,
      completedMeals: false,
      completedExercises: isWorkoutDay ? [false, false, false] : [],
      completedMealsArr: [false, false, false]
    };
  });
  
  programs[programId] = { userId, profile, days };
  res.json({ success: true, programId });
});

// GET /api/program/week?programId=...&week=1
router.get('/program/week', (req, res) => {
  const { programId, week = 1 } = req.query;
  const program = programs[programId];
  if (!program) return res.status(404).json({ error: 'not found' });
  const start = (week - 1) * 7;
  const days = program.days.slice(start, start + 7);
  res.json({
    weekStart: days[0]?.date,
    days
  });
});

// GET /api/program/week-stats?programId=...&week=1
router.get('/program/week-stats', (req, res) => {
  const { programId, week = 1 } = req.query;
  const program = programs[programId];
  if (!program) return res.status(404).json({ error: 'not found' });
  const start = (week - 1) * 7;
  const days = program.days.slice(start, start + 7);
  const stats = {
    total: days.length,
    workoutDone: days.filter(d => d.completedWorkout).length,
    mealsDone: days.filter(d => d.completedMeals).length,
    workoutMissed: days.filter(d => d.workout && !d.completedWorkout).length,
    mealsMissed: days.filter(d => d.meals && !d.completedMeals).length,
  };
  res.json(stats);
});

// PATCH /api/program/day-complete
router.patch('/program/day-complete', (req, res) => {
  const { programId, date, completedWorkout, completedMeals, completedExercises, completedMealsArr } = req.body;
  const program = programs[programId];
  if (!program) return res.status(404).json({ error: 'not found' });
  const day = program.days.find(d => d.date === date);
  if (!day) return res.status(404).json({ error: 'day not found' });
  if (typeof completedWorkout === 'boolean') day.completedWorkout = completedWorkout;
  if (typeof completedMeals === 'boolean') day.completedMeals = completedMeals;
  if (Array.isArray(completedExercises)) day.completedExercises = completedExercises;
  if (Array.isArray(completedMealsArr)) day.completedMealsArr = completedMealsArr;
  res.json({ success: true });
});

export default router;
