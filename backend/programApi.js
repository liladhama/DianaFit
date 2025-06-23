// Заглушка API для генерации и выдачи недельного плана
import express from 'express';
const router = express.Router();

// В памяти (для примера)
const programs = {};

// POST /api/program — генерация и сохранение полной программы
router.post('/program', (req, res) => {
  const { userId, profile } = req.body;
  // Здесь должна быть логика генерации программы на основе базы знаний Дианы
  // Пока просто создаём фейковую структуру
  const programId = userId + '-' + Date.now();
  const startDate = profile.start_date || new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 60 }, (_, i) => {
    const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: date.toISOString().slice(0, 10),
      title: `День ${i + 1}`,
      workout: i % 2 === 0 ? { title: 'Тренировка', exercises: ['Приседания', 'Планка'] } : null,
      meals: [
        { type: 'Завтрак', menu: 'Овсянка, творог' },
        { type: 'Обед', menu: 'Курица, овощи' },
        { type: 'Ужин', menu: 'Рыба, салат' }
      ],
      completed: false
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

export default router;
