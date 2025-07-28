import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config/api';

const USER_DATA_CACHE_KEY = 'dianafit_user_data_cache';
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 минут
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Хук для кэширования пользовательских данных
 * @param {string} userId - ID пользователя
 * @returns {Object} - объект с данными и методами управления кэшем
 */
export const useUserDataCache = (userId) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Получение ключа кэша для пользователя
  const getCacheKey = useCallback((userId) => {
    return `${USER_DATA_CACHE_KEY}_${userId}`;
  }, []);

  // Проверка валидности кэша
  const isCacheValid = useCallback((cacheData) => {
    if (!cacheData || !cacheData.timestamp) return false;
    const now = Date.now();
    return (now - cacheData.timestamp) < CACHE_EXPIRY_MS;
  }, []);

  // Загрузка данных из localStorage
  const loadFromCache = useCallback((userId) => {
    try {
      const cacheKey = getCacheKey(userId);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (isCacheValid(cacheData)) {
          console.log('📦 [USER CACHE] Данные загружены из кэша для userId:', userId);
          return cacheData.data;
        } else {
          console.log('⏰ [USER CACHE] Кэш устарел для userId:', userId);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('❌ [USER CACHE] Ошибка загрузки из кэша:', error);
      // Удаляем поврежденный кэш
      try {
        localStorage.removeItem(getCacheKey(userId));
      } catch (e) {
        console.error('❌ [USER CACHE] Ошибка удаления поврежденного кэша:', e);
      }
    }
    return null;
  }, [getCacheKey, isCacheValid]);

  // Сохранение данных в localStorage
  const saveToCache = useCallback((userId, data) => {
    try {
      const cacheKey = getCacheKey(userId);
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        userId: userId
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 [USER CACHE] Данные сохранены в кэш для userId:', userId);
    } catch (error) {
      console.error('❌ [USER CACHE] Ошибка сохранения в кэш:', error);
      // Если превышен лимит localStorage, очищаем старые данные
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ [USER CACHE] Превышен лимит localStorage, очищаем старые данные');
        clearOldCache();
        // Пробуем сохранить еще раз
        try {
          const cacheKey = getCacheKey(userId);
          const cacheData = {
            data: data,
            timestamp: Date.now(),
            userId: userId
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (retryError) {
          console.error('❌ [USER CACHE] Повторная ошибка сохранения в кэш:', retryError);
        }
      }
    }
  }, [getCacheKey]);

  // Очистка старых данных из кэша
  const clearOldCache = useCallback(() => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(USER_DATA_CACHE_KEY)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheData = JSON.parse(cached);
              if (!isCacheValid(cacheData)) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // Удаляем поврежденные записи
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 [USER CACHE] Очищено ${keysToRemove.length} устаревших записей кэша`);
    } catch (error) {
      console.error('❌ [USER CACHE] Ошибка очистки старого кэша:', error);
    }
  }, [isCacheValid]);

  // Загрузка данных с сервера
  const fetchFromServer = useCallback(async (userId, retryCount = 0) => {
    try {
      console.log(`🌐 [USER CACHE] Загрузка данных с сервера для userId: ${userId} (попытка ${retryCount + 1})`);
      
      const response = await fetch(`${API_URL}/api/user/quiz-answers/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [USER CACHE] Данные успешно загружены с сервера');
      
      // Сохраняем в кэш
      saveToCache(userId, data);
      setLastSyncTime(Date.now());
      
      return data;
    } catch (error) {
      console.error(`❌ [USER CACHE] Ошибка загрузки с сервера (попытка ${retryCount + 1}):`, error);
      
      // Повторяем попытку если не превышен лимит
      if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
        console.log(`🔄 [USER CACHE] Повторная попытка через 1 секунду...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchFromServer(userId, retryCount + 1);
      } else {
        throw error;
      }
    }
  }, [saveToCache]);

  // Основная функция загрузки данных
  const loadUserData = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) {
      setError('userId не указан');
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Если не принудительное обновление, пробуем загрузить из кэша
      if (!forceRefresh) {
        const cachedData = loadFromCache(userId);
        if (cachedData) {
          setUserData(cachedData);
          setIsLoading(false);
          return cachedData;
        }
      }

      // Загружаем с сервера
      const serverData = await fetchFromServer(userId);
      setUserData(serverData);
      setIsLoading(false);
      return serverData;
      
    } catch (error) {
      console.error('❌ [USER CACHE] Ошибка загрузки пользовательских данных:', error);
      setError(error.message);
      setIsLoading(false);
      
      // В случае ошибки пробуем загрузить из кэша, даже если он устарел
      const cachedData = loadFromCache(userId);
      if (cachedData) {
        console.log('⚠️ [USER CACHE] Используем устаревший кэш в качестве fallback');
        setUserData(cachedData);
        return cachedData;
      }
      
      return null;
    }
  }, [loadFromCache, fetchFromServer]);

  // Обновление данных на сервере
  const updateUserData = useCallback(async (userId, updates, updateType = 'patch') => {
    if (!userId) {
      throw new Error('userId не указан');
    }

    try {
      console.log(`📝 [USER CACHE] Обновление данных пользователя ${userId}:`, updates);
      
      const url = `${API_URL}/api/user/quiz-answers/${userId}`;
      const method = updateType === 'patch' ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [USER CACHE] Данные успешно обновлены на сервере');

      // Обновляем локальный кэш
      if (userData) {
        let updatedData;
        if (updateType === 'patch') {
          updatedData = {
            ...userData,
            quiz: {
              ...userData.quiz,
              ...updates
            },
            lastUpdate: new Date().toISOString()
          };
        } else {
          updatedData = {
            ...userData,
            quiz: updates,
            lastUpdate: new Date().toISOString()
          };
        }
        
        setUserData(updatedData);
        saveToCache(userId, updatedData);
        setLastSyncTime(Date.now());
      }

      return result;
    } catch (error) {
      console.error('❌ [USER CACHE] Ошибка обновления данных пользователя:', error);
      throw error;
    }
  }, [userData, saveToCache]);

  // Принудительное обновление данных
  const refreshUserData = useCallback(async (userId) => {
    console.log('🔄 [USER CACHE] Принудительное обновление данных для userId:', userId);
    return loadUserData(userId, true);
  }, [loadUserData]);

  // Очистка кэша пользователя
  const clearUserCache = useCallback((userId) => {
    try {
      const cacheKey = getCacheKey(userId);
      localStorage.removeItem(cacheKey);
      console.log('🗑️ [USER CACHE] Кэш очищен для userId:', userId);
    } catch (error) {
      console.error('❌ [USER CACHE] Ошибка очистки кэша:', error);
    }
  }, [getCacheKey]);

  // Инициализация при изменении userId
  useEffect(() => {
    if (userId) {
      loadUserData(userId);
    }
  }, [userId, loadUserData]);

  // Очистка старых данных при монтировании компонента
  useEffect(() => {
    clearOldCache();
  }, [clearOldCache]);

  return {
    // Данные
    userData,
    isLoading,
    error,
    lastSyncTime,
    
    // Методы
    loadUserData,
    updateUserData,
    refreshUserData,
    clearUserCache,
    
    // Информация о кэше
    isCacheValid: userData ? isCacheValid({ timestamp: lastSyncTime }) : false
  };
};

export default useUserDataCache;
