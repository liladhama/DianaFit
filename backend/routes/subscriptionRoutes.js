// Роуты для управления подпиской и лимитами
import express from 'express';
import subscriptionManager from '../utils/subscriptionManager.js';

const router = express.Router();

// Получение информации о подписке для профиля - ОПТИМИЗИРОВАНО
router.get('/info/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const subscriptionStatus = await subscriptionManager.getSubscriptionStatus(userId);
    
    res.json({
      isActive: subscriptionStatus.isPremium,
      startDate: subscriptionStatus.startDate,
      endDate: subscriptionStatus.endDate,
      type: subscriptionStatus.type || 'premium'
    });
  } catch (error) {
    console.error('❌ [subscription] Ошибка получения информации о подписке:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение текущего статуса подписки - ОПТИМИЗИРОВАНО
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
    console.error('❌ [subscription] Ошибка получения статуса подписки:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Активация премиум подписки - ОПТИМИЗИРОВАНО
router.post('/activate-premium', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // ОПТИМИЗИРОВАНО: Объединяем проверку и активацию в одном вызове
    const activationResult = await subscriptionManager.activatePremiumOptimized(userId);
    
    if (activationResult.alreadyActive) {
      return res.json({
        success: true,
        message: 'Премиум подписка уже активна',
        ...activationResult
      });
    }
    
    res.json({
      success: true,
      message: 'Премиум подписка успешно активирована на 30 дней!',
      ...activationResult
    });
  } catch (error) {
    console.error('❌ [subscription] Ошибка активации премиум:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение лимитов запросов - ОПТИМИЗИРОВАНО
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
    console.error('❌ [subscription] Ошибка получения лимитов:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение статистики использования - ОПТИМИЗИРОВАНО
router.get('/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const usageStats = await subscriptionManager.getUsageStats(userId);
    
    res.json(usageStats);
  } catch (error) {
    console.error('❌ [subscription] Ошибка получения статистики:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as default };
