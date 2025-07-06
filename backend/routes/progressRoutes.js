import express from 'express';
import UserProgressLogger from '../userProgressLogger.js';

const router = express.Router();

// Сохранить прогресс за день (еда/тренировка)
router.post('/', async (req, res) => {
    const { userId, date, ate, workout, tasks } = req.body;
    console.log('[PROGRESS ROUTE] POST /api/progress body:', req.body);
    if (!userId || !date) {
        return res.status(400).json({ error: 'userId и date обязательны' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        console.log('[PROGRESS ROUTE] saveDayProgress tasks:', tasks);
        await logger.saveDayProgress({ date, ate, workout, tasks });
        res.json({ success: true });
    } catch (e) {
        console.error('[PROGRESS ROUTE] Ошибка сохранения прогресса:', e);
        res.status(500).json({ error: 'Ошибка сохранения прогресса' });
    }
});

// Получить прогресс за день
router.get('/', (req, res) => {
    const { userId, date } = req.query;
    if (!userId || !date) {
        return res.status(400).json({ error: 'userId и date обязательны' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        const progress = logger.getDayProgress(date);
        res.json(progress);
    } catch (e) {
        res.status(500).json({ error: 'Ошибка получения прогресса' });
    }
});

// Получить сводку прогресса за период
router.get('/summary', (req, res) => {
    const { userId, from, to } = req.query;
    if (!userId || !from || !to) {
        return res.status(400).json({ error: 'userId, from, to обязательны' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        const summary = logger.getProgressSummary({ from, to });
        res.json(summary);
    } catch (e) {
        res.status(500).json({ error: 'Ошибка получения сводки прогресса' });
    }
});

export default router;
