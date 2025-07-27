import express from 'express';
import UserProgressLogger from '../userProgressLogger.js';

const router = express.Router();

// Сохранить прогресс за день (еда/тренировка) - ОПТИМИЗИРОВАНО
router.post('/', async (req, res) => {
    const { userId, date, ate, workout, tasks } = req.body;
    if (!userId || !date) {
        return res.status(400).json({ error: 'userId и date обязательны' });
    }
    
    // ОПТИМИЗИРОВАНО: Валидация tasks для предотвращения ошибок
    if (tasks && !Array.isArray(tasks)) {
        return res.status(400).json({ error: 'tasks должен быть массивом' });
    }
    
    try {
        const logger = new UserProgressLogger(userId);
        await logger.saveDayProgress({ date, ate, workout, tasks });
        res.json({ success: true });
    } catch (e) {
        console.error('❌ [progressRoutes] Ошибка сохранения прогресса:', e.message);
        res.status(500).json({ error: 'Ошибка сохранения прогресса' });
    }
});

// Получить прогресс за день - ОПТИМИЗИРОВАНО
router.get('/', async (req, res) => {
    const { userId, date } = req.query;
    if (!userId || !date) {
        return res.status(400).json({ error: 'userId и date обязательны' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        const progress = await logger.getDayProgress(date);
        res.json(progress);
    } catch (e) {
        console.error('❌ [progressRoutes] Ошибка получения прогресса:', e.message);
        res.status(500).json({ error: 'Ошибка получения прогресса' });
    }
});

// Получить сводку прогресса за период - ОПТИМИЗИРОВАНО
router.get('/summary', async (req, res) => {
    const { userId, from, to } = req.query;
    if (!userId || !from || !to) {
        return res.status(400).json({ error: 'userId, from, to обязательны' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        const summary = await logger.getProgressSummary({ from, to });
        res.json(summary);
    } catch (e) {
        console.error('❌ [progressRoutes] Ошибка получения сводки прогресса:', e.message);
        res.status(500).json({ error: 'Ошибка получения сводки прогресса' });
    }
});

// Получить недельную историю прогресса - ОПТИМИЗИРОВАНО
router.get('/weekly-history', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'userId обязателен' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        const weeklyData = await logger.analyzeWeeklyProgressFromHistory();
        res.json(weeklyData);
    } catch (e) {
        console.error('❌ [progressRoutes] Ошибка получения недельной истории прогресса:', e.message);
        res.status(500).json({ error: 'Ошибка получения недельной истории прогресса' });
    }
});

// Получить прогресс по userId - ОПТИМИЗИРОВАНО
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'userId обязателен' });
    }
    try {
        const logger = new UserProgressLogger(userId);
        const log = await logger.loadLog();
        res.json(log);
    } catch (e) {
        console.error('❌ [progressRoutes] Ошибка получения прогресса пользователя:', e.message);
        res.status(500).json({ error: 'Ошибка получения прогресса' });
    }
});

export default router;
