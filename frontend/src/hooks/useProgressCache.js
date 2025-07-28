import { useState, useCallback } from 'react';
import { API_URL } from '../config/api';

const PROGRESS_CACHE_KEY = 'dianafit_progress_cache';
const PROGRESS_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 минут для прогресса

/**
 * Хук для кэширования данных прогресса пользователя
 * @param {string} userId - ID пользователя
 * @returns {Object} - объект с данными прогресса и методами управления
 */
export const useProgressCache = (userId) => {
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Получение ключа кэша для прогресса
  const getProgressCacheKey = useCallback((userId, date = null) => {
    const dateStr = date || new Date().toISOString().split('T')[0];
    return `${PROGRESS_CACHE_KEY}_${userId}_${dateStr}`;
  }, []);

  // Проверка валидности кэша прогресса
  const isProgressCacheValid = useCallback((cacheData) => {
    if (!cacheData || !cacheData.timestamp) return false;
    const now = Date.now();
    return (now - cacheData.timestamp) < PROGRESS_CACHE_EXPIRY_MS;
  }, []);

  // Загрузка прогресса из кэша
  const loadProgressFromCache = useCallback((userId, date = null) => {
    try {
      const cacheKey = getProgressCacheKey(userId, date);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (isProgressCacheValid(cacheData)) {
          console.log(`📊 [PROGRESS CACHE] Прогресс загружен из кэша для ${userId}, дата: ${date || 'today'}`);
          return cacheData.data;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('❌ [PROGRESS CACHE] Ошибка загрузки прогресса из кэша:', error);
    }
    return null;
  }, [getProgressCacheKey, isProgressCacheValid]);

  // Сохранение прогресса в кэш
  const saveProgressToCache = useCallback((userId, data, date = null) => {
    try {
      const cacheKey = getProgressCacheKey(userId, date);
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        userId: userId,
        date: date || new Date().toISOString().split('T')[0]
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 [PROGRESS CACHE] Прогресс сохранен в кэш для ${userId}, дата: ${date || 'today'}`);
    } catch (error) {
      console.error('❌ [PROGRESS CACHE] Ошибка сохранения прогресса в кэш:', error);
    }
  }, [getProgressCacheKey]);

  // Загрузка статуса дня с сервера
  const fetchDayStatus = useCallback(async (userId, date) => {
    try {
      const dateStr = date || new Date().toISOString().split('T')[0];
      console.log(`🌐 [PROGRESS CACHE] Загрузка статуса дня с сервера: ${userId}, дата: ${dateStr}`);
      
      const response = await fetch(`${API_URL}/api/user/day-status/${userId}?date=${dateStr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [PROGRESS CACHE] Статус дня успешно загружен с сервера');
      
      // Сохраняем в кэш
      saveProgressToCache(userId, data, dateStr);
      
      return data;
    } catch (error) {
      console.error('❌ [PROGRESS CACHE] Ошибка загрузки статуса дня с сервера:', error);
      throw error;
    }
  }, [saveProgressToCache]);

  // Основная функция загрузки статуса дня
  const loadDayStatus = useCallback(async (userId, date = null, forceRefresh = false) => {
    if (!userId) {
      setError('userId не указан');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dateStr = date || new Date().toISOString().split('T')[0];

      // Если не принудительное обновление, пробуем загрузить из кэша
      if (!forceRefresh) {
        const cachedData = loadProgressFromCache(userId, dateStr);
        if (cachedData) {
          setProgressData(cachedData);
          setIsLoading(false);
          return cachedData;
        }
      }

      // Загружаем с сервера
      const serverData = await fetchDayStatus(userId, dateStr);
      setProgressData(serverData);
      setIsLoading(false);
      return serverData;
      
    } catch (error) {
      console.error('❌ [PROGRESS CACHE] Ошибка загрузки статуса дня:', error);
      setError(error.message);
      setIsLoading(false);
      
      // В случае ошибки пробуем загрузить из кэша
      const cachedData = loadProgressFromCache(userId, date);
      if (cachedData) {
        console.log('⚠️ [PROGRESS CACHE] Используем устаревший кэш прогресса в качестве fallback');
        setProgressData(cachedData);
        return cachedData;
      }
      
      return null;
    }
  }, [loadProgressFromCache, fetchDayStatus]);

  // Логирование выполнения плана
  const logPlanExecution = useCallback(async (userId, mealType, executed, reason = null) => {
    try {
      console.log(`📝 [PROGRESS CACHE] Логирование выполнения плана: ${userId}, ${mealType}, выполнено: ${executed}`);
      
      const response = await fetch(`${API_URL}/api/user/log-execution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          mealType,
          executed,
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [PROGRESS CACHE] Выполнение плана успешно залогировано');

      // Обновляем локальный кэш прогресса
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = getProgressCacheKey(userId, today);
      
      // Удаляем текущий кэш чтобы при следующем запросе загрузить обновленные данные
      localStorage.removeItem(cacheKey);
      
      // Если у нас есть текущие данные прогресса, обновляем их локально
      if (progressData) {
        let updatedProgress = { ...progressData };
        
        if (mealType === 'workout') {
          if (!updatedProgress.completedExercises) updatedProgress.completedExercises = [];
          if (executed) {
            updatedProgress.completedExercises.push(true);
          }
        } else {
          if (!updatedProgress.mealStatus) updatedProgress.mealStatus = {};
          updatedProgress.mealStatus[mealType] = executed;
          
          if (!updatedProgress.completedMealsArr) updatedProgress.completedMealsArr = [];
          updatedProgress.completedMealsArr.push(executed);
        }
        
        setProgressData(updatedProgress);
        saveProgressToCache(userId, updatedProgress, today);
      }

      return result;
    } catch (error) {
      console.error('❌ [PROGRESS CACHE] Ошибка логирования выполнения плана:', error);
      throw error;
    }
  }, [progressData, saveProgressToCache, getProgressCacheKey]);

  // Очистка кэша прогресса
  const clearProgressCache = useCallback((userId, date = null) => {
    try {
      if (date) {
        const cacheKey = getProgressCacheKey(userId, date);
        localStorage.removeItem(cacheKey);
        console.log(`🗑️ [PROGRESS CACHE] Кэш прогресса очищен для ${userId}, дата: ${date}`);
      } else {
        // Очищаем весь кэш прогресса для пользователя
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${PROGRESS_CACHE_KEY}_${userId}`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🗑️ [PROGRESS CACHE] Весь кэш прогресса очищен для ${userId}`);
      }
    } catch (error) {
      console.error('❌ [PROGRESS CACHE] Ошибка очистки кэша прогресса:', error);
    }
  }, [getProgressCacheKey]);

  return {
    // Данные
    progressData,
    isLoading,
    error,
    
    // Методы
    loadDayStatus,
    logPlanExecution,
    clearProgressCache,
    
    // Утилиты
    refreshDayStatus: (userId, date) => loadDayStatus(userId, date, true)
  };
};

export default useProgressCache;
