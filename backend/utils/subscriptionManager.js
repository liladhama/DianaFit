// Система управления подпиской и лимитами запросов к Диане
import { readUserData, writeUserData } from '../userDataStorage.js';

export class SubscriptionManager {
  constructor() {
    this.FREE_DAILY_LIMIT = 0; // Бесплатные пользователи не могут задавать вопросы
    this.PREMIUM_DAILY_LIMIT = 10; // Премиум пользователи могут задать 10 вопросов в день
    this.PREMIUM_DURATION_DAYS = 30; // Премиум подписка на 30 дней
  }

  // Проверка и получение статуса подписки пользователя
  async getSubscriptionStatus(userId) {
    const userData = await readUserData(userId);
    userId = String(userId);
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
      userId = String(userId);
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

  // ОПТИМИЗИРОВАНО: Проверка и активация премиума в одном вызове (убирает двойное чтение)
  async activatePremiumOptimized(userId) {
    try {
      const userData = await readUserData(userId);
      userId = String(userId);
      const subscription = userData.subscription || {};
      
      // Проверяем текущий статус
      if (subscription.premiumExpiresAt) {
        const now = new Date();
        const expireDate = new Date(subscription.premiumExpiresAt);
        
        if (now <= expireDate) {
          return {
            alreadyActive: true,
            isPremium: true,
            expiresAt: subscription.premiumExpiresAt,
            daysLeft: Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24))
          };
        }
      }
      
      // Активируем премиум
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (this.PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000));
      subscription.premiumActivatedAt = now.toISOString();
      subscription.premiumExpiresAt = expiresAt.toISOString();
      await this.saveSubscriptionData(userId, subscription);
      
      return {
        alreadyActive: false,
        success: true,
        activatedAt: subscription.premiumActivatedAt,
        expiresAt: subscription.premiumExpiresAt,
        daysLeft: this.PREMIUM_DURATION_DAYS
      };
    } catch (e) {
      console.error(`[activatePremiumOptimized] Ошибка для userId=${userId}:`, e.message);
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
    console.log('🔢 [subscriptionManager] incrementDailyRequests для userId:', userId);
    const userData = await readUserData(userId);
    const subscription = userData.subscription || {};
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 [subscriptionManager] Сегодняшняя дата:', today);
    
    if (!subscription.dailyRequests) {
      subscription.dailyRequests = {};
    }
    
    const oldValue = subscription.dailyRequests[today] || 0;
    console.log('📊 [subscriptionManager] Старое значение для', today, ':', oldValue);
    
    if (!subscription.dailyRequests[today]) {
      subscription.dailyRequests[today] = 0;
    }
    
    subscription.dailyRequests[today]++;
    const newValue = subscription.dailyRequests[today];
    console.log('📊 [subscriptionManager] Новое значение для', today, ':', newValue);
    
    // Очищаем старые записи (оставляем только последние 7 дней)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    Object.keys(subscription.dailyRequests).forEach(date => {
      if (new Date(date) < sevenDaysAgo) {
        delete subscription.dailyRequests[date];
      }
    });
    
    await this.saveSubscriptionData(userId, subscription);
    console.log('💾 [subscriptionManager] Данные сохранены');
    
    // Возвращаем полную информацию о лимитах после обновления
    const subscriptionStatus = await this.getSubscriptionStatus(userId);
    const dailyLimit = subscriptionStatus.isPremium ? this.PREMIUM_DAILY_LIMIT : this.FREE_DAILY_LIMIT;
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

  // Получение полной информации о подписке пользователя (для API)
  async getUserSubscription(userId) {
    try {
      userId = String(userId);
      
      // Сначала проверяем в legacy формате (userDataStorage)
      const userData = await readUserData(userId);
      const subscription = userData.subscription || {};
      
      if (subscription.premiumExpiresAt) {
        const now = new Date();
        const expireDate = new Date(subscription.premiumExpiresAt);
        const isActive = now <= expireDate;
        
        return {
          plan: 'premium',
          status: isActive ? 'active' : 'expired',
          startDate: subscription.premiumActivatedAt ? new Date(subscription.premiumActivatedAt) : null,
          expiresAt: expireDate,
          isActive: isActive,
          source: 'legacy'
        };
      }
      
      // Проверяем в Firestore
      const admin = await import('firebase-admin');
      const db = admin.default.firestore();
      
      const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
      
      if (subscriptionDoc.exists) {
        const data = subscriptionDoc.data();
        const now = new Date();
        const isActive = data.status === 'active' && 
                        data.expiresAt && 
                        data.expiresAt.toDate() > now;
        
        return {
          plan: data.plan || 'premium',
          status: isActive ? 'active' : 'expired',
          startDate: data.startDate,
          expiresAt: data.expiresAt,
          isActive: isActive,
          source: 'firestore'
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('[getUserSubscription] Ошибка:', error);
      throw error;
    }
  }

  // Сохранение данных подписки
  async saveSubscriptionData(userId, subscription) {
    userId = String(userId);
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
