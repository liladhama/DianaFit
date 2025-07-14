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
        console.log('[PROGRESS ROUTE] saveDayProgress userId:', userId);
        console.log('[PROGRESS ROUTE] saveDayProgress data:', { date, ate, workout, tasks });
        await logger.saveDayProgress({ date, ate, workout, tasks });
        console.log('[PROGRESS ROUTE] saveDayProgress completed successfully');
        res.json({ success: true });
    } catch (e) {
        console.error('[PROGRESS ROUTE] Ошибка сохранения прогресса:', e, '| userId:', userId);
        res.status(500).json({ error: 'Ошибка сохранения прогресса' });
    }
});

// Получить прогресс за день
router.get('/', async (req, res) => {
    const { userId, date } = req.query;
    console.log('[PROGRESS ROUTE] GET /api/progress query:', req.query);
    if (!userId || !date) {
        return res.status(400).json({ error: 'userId и date обязательны' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        console.log('[PROGRESS ROUTE] getDayProgress userId:', userId);
        const progress = await logger.getDayProgress(date);
        console.log('[PROGRESS ROUTE] getDayProgress result:', progress);
        res.json(progress);
    } catch (e) {
        console.error('[PROGRESS ROUTE] Ошибка получения прогресса:', e, '| userId:', userId);
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

// Получить прогресс по userId (для ProfilePage.js)
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'userId обязателен' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        // Можно возвращать прогресс за сегодня или summary, по желанию:
        // const today = new Date().toISOString().slice(0, 10);
        // const progress = logger.getDayProgress(today);
        // res.json(progress);
        // Или возвращать весь лог:
        const log = logger.loadLog();
        res.json(log);
    } catch (e) {
        res.status(500).json({ error: 'Ошибка получения прогресса' });
    }
});

export default router;
