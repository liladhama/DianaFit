// Роуты для управления подпиской и лимитами
import express from 'express';
import * as subscriptionManager from '../utils/subscriptionManager.js';

const router = express.Router();

// Получение текущего статуса подписки
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const subscriptionStatus = await subscriptionManager.getSubscriptionStatus(userId);
    const limitInfo = await subscriptionManager.checkDailyLimit(userId);
    const usageStats = await subscriptionManager.getUsageStats(userId);

    res.json({
      subscription: subscriptionStatus,
      limits: limitInfo,
      usage: usageStats
    });
  } catch (error) {
    console.error('Ошибка получения статуса подписки:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Активация премиум подписки
router.post('/activate-premium', async (req, res) => {
  console.log('[SUBSCRIPTION] POST /activate-premium входящий запрос:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  });
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Проверяем текущий статус
    const currentStatus = await subscriptionManager.getSubscriptionStatus(userId);
    
    if (currentStatus.isPremium) {
      return res.json({
        success: true,
        message: 'Премиум подписка уже активна',
        ...currentStatus
      });
    }

    // Активируем премиум
    const activationResult = await subscriptionManager.activatePremium(userId);
    
    console.log(`[PREMIUM] Активирована премиум подписка для пользователя ${userId}`);
    
    res.json({
      success: true,
      message: 'Премиум подписка успешно активирована на 30 дней!',
      ...activationResult
    });
  } catch (error) {
    console.error('Ошибка активации премиум подписки:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение лимитов запросов
router.get('/limits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const limitInfo = await subscriptionManager.checkDailyLimit(userId);
    
    res.json({
      ...limitInfo,
      message: subscriptionManager.formatLimitMessage(limitInfo)
    });
  } catch (error) {
    console.error('Ошибка получения лимитов:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение статистики использования
router.get('/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const usageStats = await subscriptionManager.getUsageStats(userId);
    
    res.json(usageStats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as default };
