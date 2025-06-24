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

// POST /api/program — генерация и сохранение полной программы через ИИ
router.post('/program', async (req, res) => {
  const { userId, profile } = req.body;
  const programId = userId + '-' + Date.now();
  const startDate = profile.start_date || new Date().toISOString().slice(0, 10);

  // --- ЗАГЛУШКА: возвращаем фейковый план без вызова ИИ ---
  const days = Array.from({ length: 7 }).map((_, i) => ({
    title: `День ${i + 1}`,
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    workout: {
      name: 'Тренировка дома',
      exercises: [
        { name: 'Приседания', reps: 15 },
        { name: 'Отжимания', reps: 10 },
        { name: 'Планка', reps: 30 }
      ]
    },
    meals: [
      { name: 'Завтрак', menu: 'Овсянка, банан, чай' },
      { name: 'Обед', menu: 'Курица, гречка, салат' },
      { name: 'Ужин', menu: 'Творог, яблоко' }
    ],
    completedWorkout: false,
    completedMeals: false,
    completedExercises: [false, false, false],
    completedMealsArr: [false, false, false]
  }));
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
