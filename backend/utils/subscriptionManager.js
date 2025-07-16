// Система управления подпиской и лимитами запросов к Диане
import { readUserData, writeUserData } from '../userDataStorage.js';

export class SubscriptionManager {
  constructor() {
    this.FREE_DAILY_LIMIT = 10; // Максимум 10 запросов в день для бесплатных пользователей
    this.PREMIUM_DAILY_LIMIT = 1000; // Практически безлимитно для премиум пользователей
    this.PREMIUM_DURATION_DAYS = 30; // Премиум подписка на 30 дней
  }

  // Проверка и получение статуса подписки пользователя
  async getSubscriptionStatus(userId) {
    const userData = await readUserData(userId);
    const subscription = userData.subscription || {};
    
    // Проверяем, активна ли премиум подписка
    if (subscription.premiumExpiresAt) {
      const now = new Date();
      const expireDate = new Date(subscription.premiumExpiresAt);
      
      if (now <= expireDate) {
        return {
          isPremium: true,
          expiresAt: subscription.premiumExpiresAt,
          daysLeft: Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24))
        };
      } else {
        // Премиум подписка истекла, очищаем данные
        subscription.premiumExpiresAt = null;
        subscription.premiumActivatedAt = null;
        await this.saveSubscriptionData(userId, subscription);
      }
    }
    
    return {
      isPremium: false,
      expiresAt: null,
      daysLeft: 0
    };
  }

  // Активация премиум подписки
  async activatePremium(userId) {
    try {
      const userData = await readUserData(userId);
      const subscription = userData.subscription || {};
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (this.PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000));
      subscription.premiumActivatedAt = now.toISOString();
      subscription.premiumExpiresAt = expiresAt.toISOString();
      await this.saveSubscriptionData(userId, subscription);
      return {
        success: true,
        activatedAt: subscription.premiumActivatedAt,
        expiresAt: subscription.premiumExpiresAt,
        daysLeft: this.PREMIUM_DURATION_DAYS
      };
    } catch (e) {
      console.error(`[activatePremium] Ошибка активации премиума для userId=${userId}:`, e);
      if (e && e.stack) console.error(e.stack);
      throw e;
    }
  }

  // Проверка лимита запросов к Диане
  async checkDailyLimit(userId) {
    const userData = await readUserData(userId);
    const subscription = userData.subscription || {};
    const subscriptionStatus = await this.getSubscriptionStatus(userId);
    
    // Определяем лимит в зависимости от подписки
    const dailyLimit = subscriptionStatus.isPremium ? this.PREMIUM_DAILY_LIMIT : this.FREE_DAILY_LIMIT;
    
    // Получаем текущую дату в формате YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Инициализируем счетчик запросов для сегодняшнего дня
    if (!subscription.dailyRequests) {
      subscription.dailyRequests = {};
    }
    
    if (!subscription.dailyRequests[today]) {
      subscription.dailyRequests[today] = 0;
    }
    
    const todayRequests = subscription.dailyRequests[today];
    
    return {
      canMakeRequest: todayRequests < dailyLimit,
      requestsUsed: todayRequests,
      dailyLimit: dailyLimit,
      requestsLeft: Math.max(0, dailyLimit - todayRequests),
      isPremium: subscriptionStatus.isPremium,
      premiumDaysLeft: subscriptionStatus.daysLeft
    };
  }

  // Увеличение счетчика запросов
  async incrementDailyRequests(userId) {
    const userData = await readUserData(userId);
    const subscription = userData.subscription || {};
    
    const today = new Date().toISOString().split('T')[0];
    
    if (!subscription.dailyRequests) {
      subscription.dailyRequests = {};
    }
    
    if (!subscription.dailyRequests[today]) {
      subscription.dailyRequests[today] = 0;
    }
    
    subscription.dailyRequests[today]++;
    
    // Очищаем старые записи (оставляем только последние 7 дней)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    Object.keys(subscription.dailyRequests).forEach(date => {
      if (new Date(date) < sevenDaysAgo) {
        delete subscription.dailyRequests[date];
      }
    });
    
    await this.saveSubscriptionData(userId, subscription);
    
    return subscription.dailyRequests[today];
  }

  // Сохранение данных подписки
  async saveSubscriptionData(userId, subscription) {
    const userData = await readUserData(userId);
    userData.subscription = subscription;
    await writeUserData(userId, userData);
  }

  // Получение статистики использования за последние дни
  async getUsageStats(userId) {
    const userData = await readUserData(userId);
    const subscription = userData.subscription || {};
    const subscriptionStatus = await this.getSubscriptionStatus(userId);
    
    const stats = {
      isPremium: subscriptionStatus.isPremium,
      premiumDaysLeft: subscriptionStatus.daysLeft,
      dailyLimit: subscriptionStatus.isPremium ? this.PREMIUM_DAILY_LIMIT : this.FREE_DAILY_LIMIT,
      recentUsage: {}
    };
    
    // Получаем статистику за последние 7 дней
    const dailyRequests = subscription.dailyRequests || {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      stats.recentUsage[dateStr] = dailyRequests[dateStr] || 0;
    }
    
    return stats;
  }

  // Форматирование сообщения о лимите для пользователя
  formatLimitMessage(limitInfo) {
    if (limitInfo.isPremium) {
      return `✨ У вас премиум подписка! Осталось дней: ${limitInfo.premiumDaysLeft}. Запросов использовано сегодня: ${limitInfo.requestsUsed}`;
    } else {
      if (limitInfo.canMakeRequest) {
        return `📊 Запросов к Диане сегодня: ${limitInfo.requestsUsed}/${limitInfo.dailyLimit}. Осталось: ${limitInfo.requestsLeft}`;
      } else {
        return `❌ Дневной лимит запросов к Диане исчерпан (${limitInfo.dailyLimit}). Попробуйте завтра или активируйте премиум подписку!`;
      }
    }
  }
}

const subscriptionManager = new SubscriptionManager();
export { subscriptionManager as default };
