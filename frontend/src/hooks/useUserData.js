import { useUserDataCache } from './useUserDataCache';
import { useProgressCache } from './useProgressCache';

/**
 * Главный хук для управления всеми данными пользователя с кэшированием
 * @param {string} userId - ID пользователя
 * @returns {Object} - объект с данными и методами управления
 */
export const useUserData = (userId) => {
  // Хук для основных данных пользователя
  const {
    userData,
    isLoading: isLoadingUser,
    error: userError,
    lastSyncTime,
    loadUserData,
    updateUserData,
    refreshUserData,
    clearUserCache,
    isCacheValid
  } = useUserDataCache(userId);

  // Хук для данных прогресса
  const {
    progressData,
    isLoading: isLoadingProgress,
    error: progressError,
    loadDayStatus,
    logPlanExecution,
    clearProgressCache,
    refreshDayStatus
  } = useProgressCache(userId);

  // Объединенные состояния загрузки и ошибок
  const isLoading = isLoadingUser || isLoadingProgress;
  const error = userError || progressError;

  // Получение данных квиза
  const getQuizData = () => {
    return userData?.quiz || null;
  };

  // Получение истории диалога
  const getDialogHistory = () => {
    return userData?.dialogHistory || [];
  };

  // Обновление настроек квиза
  const updateQuizSettings = async (updates) => {
    return updateUserData(userId, updates, 'patch');
  };

  // Полное обновление квиза
  const updateFullQuiz = async (quizData) => {
    return updateUserData(userId, quizData, 'post');
  };

  // Логирование действий пользователя
  const logUserAction = async (actionType, actionData) => {
    try {
      if (actionType === 'plan_execution') {
        const { mealType, executed, reason } = actionData;
        return logPlanExecution(userId, mealType, executed, reason);
      }
      // Здесь можно добавить другие типы действий
      console.warn('⚠️ [USER DATA] Неизвестный тип действия:', actionType);
    } catch (error) {
      console.error('❌ [USER DATA] Ошибка логирования действия пользователя:', error);
      throw error;
    }
  };

  // Получение статуса дня
  const getDayStatus = async (date = null) => {
    return loadDayStatus(userId, date);
  };

  // Принудительное обновление всех данных
  const refreshAllData = async () => {
    try {
      console.log('🔄 [USER DATA] Принудительное обновление всех данных для userId:', userId);
      
      const promises = [
        refreshUserData(userId),
        refreshDayStatus(userId)
      ];
      
      const [userDataResult, progressDataResult] = await Promise.allSettled(promises);
      
      if (userDataResult.status === 'rejected') {
        console.error('❌ [USER DATA] Ошибка обновления пользовательских данных:', userDataResult.reason);
      }
      
      if (progressDataResult.status === 'rejected') {
        console.error('❌ [USER DATA] Ошибка обновления данных прогресса:', progressDataResult.reason);
      }
      
      console.log('✅ [USER DATA] Обновление всех данных завершено');
      
      return {
        userData: userDataResult.status === 'fulfilled' ? userDataResult.value : null,
        progressData: progressDataResult.status === 'fulfilled' ? progressDataResult.value : null
      };
    } catch (error) {
      console.error('❌ [USER DATA] Ошибка принудительного обновления всех данных:', error);
      throw error;
    }
  };

  // Очистка всех кэшей пользователя
  const clearAllCache = () => {
    try {
      console.log('🗑️ [USER DATA] Очистка всех кэшей для userId:', userId);
      clearUserCache(userId);
      clearProgressCache(userId);
      console.log('✅ [USER DATA] Все кэши очищены');
    } catch (error) {
      console.error('❌ [USER DATA] Ошибка очистки кэшей:', error);
    }
  };

  // Проверка готовности данных
  const isDataReady = () => {
    return !isLoading && userData && userData.quiz;
  };

  // Получение информации о кэше
  const getCacheInfo = () => {
    return {
      isCacheValid,
      lastSyncTime,
      hasUserData: !!userData,
      hasProgressData: !!progressData
    };
  };

  return {
    // Основные данные
    userData,
    progressData,
    
    // Состояния
    isLoading,
    error,
    isDataReady: isDataReady(),
    
    // Методы получения данных
    getQuizData,
    getDialogHistory,
    getDayStatus,
    
    // Методы обновления данных
    updateQuizSettings,
    updateFullQuiz,
    logUserAction,
    
    // Методы управления кэшем
    refreshAllData,
    clearAllCache,
    getCacheInfo,
    
    // Информация о кэше
    cacheInfo: getCacheInfo(),
    
    // Отдельные методы для совместимости
    loadUserData,
    refreshUserData,
    refreshDayStatus
  };
};

export default useUserData;
