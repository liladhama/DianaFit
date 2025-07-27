import { useCallback, useRef } from 'react';

/**
 * Хук для debounced API вызовов
 * @param {Function} callback - функция для вызова
 * @param {number} delay - задержка в миллисекундах
 * @returns {Function} debounced функция
 */
export const useDebounced = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Хук для работы с прогрессом пользователя
 * Объединяет все API вызовы в один debounced метод
 */
export const useProgressAPI = (apiUrl) => {
  const updateProgress = useCallback(async (userId, date, data) => {
    try {
      const response = await fetch(`${apiUrl}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date,
          tasks: data
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка обновления прогресса:', error);
      throw error;
    }
  }, [apiUrl]);

  // Debounced версия для частых обновлений
  const debouncedUpdateProgress = useDebounced(updateProgress, 500);

  return {
    updateProgress, // Для немедленных обновлений
    debouncedUpdateProgress // Для частых обновлений
  };
};
