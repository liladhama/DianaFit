import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import DianaChat from './DianaChat';
import StepsPermissionModal from './StepsPermissionModal';
import ReasonModal from './ReasonModal';
import ExerciseCard from './ExerciseCard';
import MealCard from './MealCardNew';
import MealBlock from './MealBlock';
import { getWorkoutLocation, getDayId, getExerciseEnglishName, getVideoPathForExercise } from '../utils/videoUtils';
import chatDianaIcon from '../assets/icons/chat-diana-icon.png';

// Добавляем CSS анимацию для спиннера
const spinnerStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Вставляем стили в head, если их еще нет
if (!document.querySelector('#spinner-styles')) {
  const style = document.createElement('style');
  style.id = 'spinner-styles';
  style.textContent = spinnerStyles;
  document.head.appendChild(style);
}

// --- Переключатель между локальным и продакшн сервером ---
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : 'https://dianafit.onrender.com';

// Мотивационные цитаты от Дианы
const motivationalQuotes = [
  "Не нужно быть идеальной. Нужно быть стабильной. — Диана",
  "Каждый день — это новая возможность стать лучше. — Диана",
  "Твое тело может. Твой разум сомневается. Слушай тело. — Диана",
  "Прогресс важнее совершенства. — Диана",
  "Твоя цель — не быть как все, а быть лучшей версией себя. — Диана"
];

// Получаем текущую дату в формате "Вторник, 25 июня"
const getCurrentDateString = () => {
  const now = new Date();
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
};

// Стили компонентов
const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  border: '1px solid #f0f0f0',
  width: '100%',
  boxSizing: 'border-box'
};

const headerStyle = {
  fontSize: 20,
  fontWeight: 700,
  color: '#1a1a1a',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const checkboxButtonStyle = (completed) => ({
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #e0e7ff',
  background: completed ? '#e0e7ff' : '#fff',
  color: completed ? '#2196f3' : '#666',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  marginTop: 8
});

export default function TodayBlock({ day, answers, onBackToWeek, programId, isPremium, activatePremium, setIsPaymentShown, userAvatar, onProfileClick }) {
  // Состояние для персонального плана
  const [personalPlan, setPersonalPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  
  // Состояние для чата с Дианой
  const [showDianaChat, setShowDianaChat] = useState(false);
  
  // Состояние для модала разрешений на шаги
  const [showStepsPermission, setShowStepsPermission] = useState(false);
  const [hasStepsPermission, setHasStepsPermission] = useState(false);

  // Состояние для модала причин невыполнения
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonModalData, setReasonModalData] = useState({ type: '', index: -1, itemName: '' });

  // Состояние для хранения причин невыполнения
  const [exerciseReasons, setExerciseReasons] = useState({});
  const [mealReasons, setMealReasons] = useState({});

  // Состояние для AI-плана питания
  const [aiMeals, setAiMeals] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Индексы выбранных вариантов для каждого AI-приема пищи
  const [selectedMealOptionIdx, setSelectedMealOptionIdx] = useState(() => Array.isArray(aiMeals) ? aiMeals.map(() => 0) : []);

  // Флаг загрузки статусов с backend
  const [isLoaded, setIsLoaded] = useState(false);
  // Массив задач (только реальные статусы)
  const [tasks, setTasks] = useState([]);

  // --- СТАТУСЫ ПРИЕМОВ ПИЩИ ---
  const [completedMeals, setCompletedMeals] = useState([]);

  // Используем персональный план если он есть, иначе переданный день или мок
  const currentDay = personalPlan || day || {
    date: '2024-06-03',
    title: 'Понедельник',
    workout: { title: 'Домашняя тренировка №2', exercises: [ { name: 'Приседания', reps: 15 }, { name: 'Отжимания', reps: 10 } ] },
    meals: [ 
      { type: 'Завтрак', menu: 'Овсянка с ягодами', calories: 320 },
      { type: 'Перекус', menu: 'Греческий йогурт с орехами', calories: 180 },
      { type: 'Обед', menu: 'Курица с рисом и овощами', calories: 450 },
      { type: 'Полдник', menu: 'Яблоко с арахисовой пастой', calories: 200 },
      { type: 'Ужин', menu: 'Запеченная рыба с салатом', calories: 380 }
    ],
    completed: false,
    dailySteps: 0, // Убираем мок данные - только реальные шаги
    dailyStepsGoal: 10000
  };
  
  // Логируем данные для отладки
  console.log('🏋️‍♀️ TodayBlock Debug:', {
    personalPlan: !!personalPlan,
    dayProp: !!day,
    currentDayWorkout: currentDay.workout,
    currentDayLocation: currentDay.workout?.location,
    currentDayExercises: currentDay.workout?.exercises?.map(ex => ex.name)
  });

  // Проверяем, начинается ли программа сегодня или позже
  const programStartsLater = answers && answers.start_date && new Date(answers.start_date) > new Date();
  
  // Инициализируем массивы статусов как пустые, заполнение происходит в useEffect
  const [completedExercises, setCompletedExercises] = useState([]);
  // Синхронизация длины completedMeals с aiMeals (без сброса отмеченных значений)
  useEffect(() => {
    if (Array.isArray(aiMeals)) {
      setCompletedMeals(prev => {
        if (prev.length !== aiMeals.length) {
          // Сохраняем отмеченные значения, новые элементы = null
          return aiMeals.map((_, i) => prev[i] ?? null);
        }
        return prev;
      });
    } else if (completedMeals.length !== 0) {
      setCompletedMeals([]);
    }
  }, [aiMeals]);

  // Обновляем состояние при изменении currentDay
  useEffect(() => {
    console.log('🔄 useEffect [currentDay] вызван:', {
      exercisesCount: currentDay.workout?.exercises?.length || 0,
      mealsCount: currentDay.meals?.length || 0,
      savedExercises: currentDay.completedExercises,
      savedMeals: currentDay.completedMealsArr,
      currentCompletedExercises: completedExercises,
      currentCompletedMeals: completedMeals
    });

    if (currentDay.workout?.exercises) {
      const newExerciseStates = currentDay.workout.exercises.map((ex, i) => {
        const saved = currentDay.completedExercises?.[i];
        const result = saved ?? null; // null = не выбрано, true = выполнено, false = не выполнено
        console.log(`🏋️ Упражнение ${i} (${ex.name}): сохранено=${saved}, результат=${result}, typeof=${typeof result}`);
        return result;
      });
      // Сравниваем массивы перед обновлением
      const isSame =
        completedExercises.length === newExerciseStates.length &&
        completedExercises.every((v, i) => v === newExerciseStates[i]);
      if (!isSame) {
        console.log('🏋️ Итоговый массив completedExercises ДО setCompletedExercises:', newExerciseStates);
        setCompletedExercises(newExerciseStates);
        console.log('🏋️ setCompletedExercises вызван с:', newExerciseStates);
      } else {
        console.log('🏋️ Массив completedExercises не изменился, setState не вызывается');
      }
    } else {
      if (completedExercises.length !== 0) {
        console.log('🏋️ Нет упражнений, устанавливаем пустой массив');
        setCompletedExercises([]);
      }
    }

    if (currentDay.meals) {
      const newMealStates = currentDay.meals.map((m, i) => {
        const saved = currentDay.completedMealsArr?.[i];
        const result = saved ?? null; // null = не выбрано, true = съедено, false = не съедено
        console.log(`🍽️ Прием пищи ${i} (${m.type}): сохранено=${saved}, результат=${result}, typeof=${typeof result}`);
        return result;
      });
      // Сравниваем массивы перед обновлением
      const isSame =
        completedMeals.length === newMealStates.length &&
        completedMeals.every((v, i) => v === newMealStates[i]);
      if (!isSame) {
        console.log('🍽️ Итоговый массив completedMeals ДО setCompletedMeals:', newMealStates);
        setCompletedMeals(newMealStates);
        console.log('🍽️ setCompletedMeals вызван с:', newMealStates);
      } else {
        console.log('🍽️ Массив completedMeals не изменился, setState не вызывается');
      }
    } else {
      if (completedMeals.length !== 0) {
        console.log('🍽️ Нет приемов пищи, устанавливаем пустой массив');
        setCompletedMeals([]);
      }
    }
  }, [currentDay]);
  // Определяем, запущено ли на мобильном устройстве
  const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasTelegramWebApp = window.Telegram?.WebApp;
  
  const [dailySteps, setDailySteps] = useState(() => {
    // Если это компьютер без Telegram WebApp, сразу ставим 0
    if (!isMobileDevice && !hasTelegramWebApp) {
      console.log('🖥️ Компьютер - устанавливаем dailySteps = 0');
      return 0;
    }
    // На мобильных устройствах стартуем с 0, данные подтянутся из getStepsFromDevice
    console.log('📱 Мобильное устройство - устанавливаем dailySteps = 0');
    return 0;
  });
  const [stepsGoal] = useState(() => {
    const goal = currentDay.dailyStepsGoal || 10000;
    
    // Принудительно устанавливаем 10000, если цель меньше или больше разумных пределов
    const correctedGoal = (goal < 5000 || goal > 15000) ? 10000 : goal;
    
    console.log('🎯 Устанавливаем цель по шагам:', {
      originalGoal: goal,
      correctedGoal,
      fromCurrentDay: currentDay.dailyStepsGoal,
      currentDaySource: personalPlan ? 'personalPlan' : day ? 'day prop' : 'mock',
      currentDay: currentDay
    });
    return correctedGoal;
  });
  const [stepsError, setStepsError] = useState(null);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Получаем случайную мотивационную цитату
  const todayQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  // Проверка разрешений при загрузке компонента
  useEffect(() => {
    checkStepsPermission();
  }, []);

  // Проверка существующих разрешений
  const checkStepsPermission = () => {
    try {
      const savedAuth = localStorage.getItem('dianafit_health_auth');
      const hasAskedBefore = localStorage.getItem('dianafit_steps_permission_asked');
      
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        
        // Проверяем не истек ли токен
        if (authData.expires && authData.expires < Date.now()) {
          localStorage.removeItem('dianafit_health_auth');
          setHasStepsPermission(false);
          // Если токен истек, показываем модал для повторной авторизации
          setTimeout(() => {
            setShowStepsPermission(true);
          }, 2000);
          return;
        }
        
        setHasStepsPermission(true);
        console.log('✅ Найдены сохраненные разрешения:', authData.type);
      } else {
        setHasStepsPermission(false);
        
        // Если пользователь еще не видел запрос разрешения - показываем модал
        if (!hasAskedBefore) {
          console.log('🔐 Первый визит - показываем модал разрешений через 3 секунды');
          setTimeout(() => {
            setShowStepsPermission(true);
            // Отмечаем, что уже показывали запрос
            localStorage.setItem('dianafit_steps_permission_asked', 'true');
          }, 3000); // 3 секунды задержки для лучшего UX
        }
      }
    } catch (error) {
      console.error('Ошибка проверки разрешений:', error);
      setHasStepsPermission(false);
      // При ошибке тоже показываем модал
      setTimeout(() => {
        setShowStepsPermission(true);
      }, 2000);
    }
  };

  // Обработчик получения разрешения
  const handlePermissionGranted = (authType) => {
    setHasStepsPermission(true);
    setShowStepsPermission(false);
    console.log('✅ Разрешение получено:', authType);
    
    // Сразу пытаемся получить данные о шагах
    setTimeout(() => {
      getStepsFromDevice();
    }, 1000);
  };

  // Получение данных из авторизованных API
  const getAuthorizedStepsData = async () => {
    try {
      const savedAuth = localStorage.getItem('dianafit_health_auth');
      if (!savedAuth) return null;

      const authData = JSON.parse(savedAuth);

      switch (authData.type) {
        case 'google_fit':
          return await getGoogleFitSteps();
        case 'ios_motion':
          return await getIOSMotionSteps();
        case 'web_sensors':
          return await getWebSensorSteps();
        default:
          console.log('Неизвестный тип авторизации:', authData.type);
          return null;
      }
    } catch (error) {
      console.error('Ошибка получения авторизованных данных:', error);
      return null;
    }
  };

  // Получение шагов из Google Fit API
  const getGoogleFitSteps = async () => {
    try {
      if (!window.gapi || !window.gapi.auth2) {
        console.log('Google API не инициализирован');
        return null;
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance || !authInstance.isSignedIn.get()) {
        console.log('Пользователь не авторизован в Google');
        return null;
      }

      const today = new Date();
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const endTime = Date.now();

      const response = await window.gapi.client.fitness.users.dataSources.dataPointChanges.list({
        userId: 'me',
        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        startTime: startTime * 1000000, // наносекунды
        endTime: endTime * 1000000
      });

      if (response.result.point && response.result.point.length > 0) {
        const totalSteps = response.result.point.reduce((sum, point) => {
          return sum + (point.value[0].intVal || 0);
        }, 0);
        
        console.log('📊 Google Fit шаги:', totalSteps);
        return totalSteps;
      }

      return 0;
    } catch (error) {
      console.error('Ошибка получения данных Google Fit:', error);
      return null;
    }
  };

  // Получение шагов из iOS датчиков движения
  const getIOSMotionSteps = async () => {
    try {
      // Для iOS используем approximation на основе акселерометра
      // В реальном приложении здесь была бы более сложная логика
      const savedSteps = localStorage.getItem('dianafit_ios_steps_cache');
      const savedDate = localStorage.getItem('dianafit_ios_steps_date');
      const today = new Date().toDateString();

      if (savedSteps && savedDate === today) {
        return parseInt(savedSteps);
      }

      // Базовая симуляция на основе времени (для демонстрации)
      // const hoursToday = new Date().getHours();
      // const approximateSteps = Math.floor(hoursToday * 400 + Math.random() * 1000);
      // localStorage.setItem('dianafit_ios_steps_cache', approximateSteps.toString());
      // localStorage.setItem('dianafit_ios_steps_date', today);
      // console.log('📊 iOS Motion шаги (приблизительно):', approximateSteps);
      // return approximateSteps;
    } catch (error) {
      console.error('Ошибка получения данных iOS Motion:', error);
      return null;
    }
  };

  // Получение шагов из веб-датчиков
  const getWebSensorSteps = async () => {
    try {
      // Для веб-браузеров используем базовую оценку
      const savedSteps = localStorage.getItem('dianafit_web_steps_cache');
      const savedDate = localStorage.getItem('dianafit_web_steps_date');
      const today = new Date().toDateString();

      if (savedSteps && savedDate === today) {
        return parseInt(savedSteps);
      }
      // const estimatedSteps = Math.floor(hoursToday * 300 + Math.random() * 800);
      // localStorage.setItem('dianafit_web_steps_cache', estimatedSteps.toString());
      // localStorage.setItem('dianafit_web_steps_date', today);
      // console.log('📊 Web Sensors шаги (оценка):', estimatedSteps);
      // return estimatedSteps;
    } catch (error) {
      console.error('Ошибка получения данных Web Sensors:', error);
      return null;
    }
  };

  // Функция для получения реальных данных о шагах с устройства
  const getStepsFromDevice = async () => {
    console.log('🚶 Начинаем получение данных о шагах...');
    setIsLoadingSteps(true);
    setStepsError(null);
    
    // Проверяем, запущено ли на компьютере - если да, принудительно очищаем localStorage
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTelegram = window.Telegram?.WebApp;
    
    if (!isMobile && !hasTelegram) {
      console.log('🖥️ Компьютер обнаружен - принудительно очищаем localStorage');
      localStorage.removeItem('dianafit_daily_steps');
      localStorage.removeItem('dianafit_steps_date');
      setDailySteps(0);
      setStepsError('Подсчет шагов доступен только на мобильных устройствах');
      setIsLoadingSteps(false);
      return;
    }
    
    // Объявляем переменные в области видимости функции
    const savedSteps = localStorage.getItem('dianafit_daily_steps');
    const savedDate = localStorage.getItem('dianafit_steps_date');
    const today = new Date().toDateString();
    console.log('📱 LocalStorage данные:', { savedSteps, savedDate, today });
    
    // Очищаем устаревшие данные из localStorage
    if (savedDate && savedDate !== today) {
      console.log('🧹 Очищаем устаревшие данные из localStorage');
      localStorage.removeItem('dianafit_daily_steps');
      localStorage.removeItem('dianafit_steps_date');
    }
    
    try {
      
      // 1. ПРИОРИТЕТ: Попытка получить данные через авторизованные API
      if (hasStepsPermission) {
        console.log('🔐 Используем авторизованные API для получения шагов...');
        const authorizedSteps = await getAuthorizedStepsData();
        
        if (authorizedSteps !== null && authorizedSteps >= 0) {
          setDailySteps(authorizedSteps);
          saveStepsToStorage(authorizedSteps);
          console.log('✅ Шаги получены через авторизованные API:', authorizedSteps);
          setIsLoadingSteps(false);
          return;
        } else {
          console.log('⚠️ Авторизованные API не вернули данные, пробуем другие методы...');
        }
      }
      
      // 2. Попытка получить данные через Telegram WebApp API
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Проверяем, есть ли доступ к данным пользователя
        if (tg.initDataUnsafe?.user) {
          console.log('Пользователь Telegram найден, проверяем данные о здоровье...');
          
          // В будущих версиях Telegram может добавить Health API
          if (tg.initDataUnsafe.user.health_data?.steps) {
            const steps = tg.initDataUnsafe.user.health_data.steps;
            setDailySteps(steps);
            saveStepsToStorage(steps);
            console.log('✅ Шаги получены из Telegram WebApp:', steps);
            setIsLoadingSteps(false);
            return;
          }
        }
      }

      // 3. Проверяем сохраненные данные за сегодня только если они актуальны
      if (savedSteps && savedDate === today) {
        setDailySteps(parseInt(savedSteps));
        console.log('💾 Данные о шагах загружены из кэша:', savedSteps);
        setIsLoadingSteps(false);
        return;
      }

      // 4. Если никакие API недоступны - предлагаем авторизацию
      console.log('❌ Данные о шагах недоступны: никакие API не подключены');
      
      setDailySteps(0);
      
      // Формируем информативное сообщение для пользователя
      const userAgent = navigator.userAgent;
      let stepsMessage = '';
      
      if (!hasStepsPermission) {
        stepsMessage = '🔐 Для автоматического подсчета шагов требуется разрешение на доступ к данным о физической активности.\n\n';
        stepsMessage += '💡 Нажмите кнопку "Разрешить доступ" чтобы:\n';
        
        if (/Android/i.test(userAgent)) {
          stepsMessage += '• Подключиться к Google Fit\n';
          stepsMessage += '• Получать данные о шагах автоматически\n';
          stepsMessage += '• Синхронизировать с фитнес-браслетами';
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
          stepsMessage += '• Подключиться к приложению "Здоровье"\n';
          stepsMessage += '• Получать данные с Apple Watch\n';
          stepsMessage += '• Синхронизировать с фитнес-приложениями';
        } else {
          stepsMessage += '• Получить доступ к датчикам движения\n';
          stepsMessage += '• Отслеживать активность в браузере\n';
          stepsMessage += '• Подключить внешние устройства';
        }
      } else {
        stepsMessage = 'Автоматический подсчет шагов временно недоступен.\n\n';
        
        if (/Android/i.test(userAgent)) {
          stepsMessage += '📱 На Android шаги хранятся в:\n';
          stepsMessage += '• Google Fit (встроенное приложение)\n';
          stepsMessage += '• Samsung Health (на Samsung)\n';
          stepsMessage += '• Встроенный счетчик Android\n\n';
          stepsMessage += '� Попробуйте обновить данные или проверьте подключение к интернету';
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
          stepsMessage += '📱 На iOS шаги хранятся в:\n';
          stepsMessage += '• Приложение "Здоровье" (HealthKit)\n';
          stepsMessage += '• Встроенный счетчик iPhone\n\n';
          stepsMessage += '� Попробуйте обновить данные или проверьте разрешения';
        } else {
          stepsMessage += '🔒 Веб-браузеры имеют ограниченный доступ к данным о шагах.\n\n';
          stepsMessage += '💡 Для лучшего опыта:\n';
          stepsMessage += '• Используйте мобильное устройство\n';
          stepsMessage += '• Откройте через Telegram\n';
          stepsMessage += '• Подключите фитнес-браслет';
        }
      }
      
      setStepsError(stepsMessage);
      
      console.log('💡 Совет: Для получения реальных данных о шагах требуется авторизация через OAuth');
      
    } catch (error) {
      console.error('Ошибка при получении данных о шагах:', error);
      setStepsError('Ошибка доступа к данным о физической активности');
      
      // Пытаемся загрузить сохраненные данные (используем уже объявленные переменные)
      if (savedSteps && savedDate === today) {
        setDailySteps(parseInt(savedSteps));
      } else {
        setDailySteps(0);
        saveStepsToStorage(0);
      }
    } finally {
      setIsLoadingSteps(false);
    }
  };

  const saveStepsToStorage = (steps) => {
    const today = new Date().toDateString();
    localStorage.setItem('dianafit_daily_steps', steps.toString());
    localStorage.setItem('dianafit_steps_date', today);
  };

  // Глобальные функции для отладки (доступны в консоли браузера)
  useEffect(() => {
    // Функция для очистки данных о шагах
    window.clearStepsData = () => {
      console.log('🧹 Принудительная очистка всех данных о шагах');
      localStorage.removeItem('dianafit_daily_steps');
      localStorage.removeItem('dianafit_steps_date');
      localStorage.removeItem('dianafit_health_auth');
      localStorage.removeItem('dianafit_steps_permission_asked');
      setDailySteps(0);
      setStepsError(null);
      setHasStepsPermission(false);
      console.log('✅ Все данные о шагах очищены');
    };
    
    // Функция для проверки всех программ в localStorage
    window.checkPrograms = () => {
      console.log('🔍 Проверяем все программы в localStorage:');
      const programs = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('program_')) {
          try {
            const program = JSON.parse(localStorage.getItem(key));
            programs.push({ key, program });
            console.log(`📋 Программа ${key}:`, {
              name: program.name,
              daysCount: program.days?.length,
              firstDay: program.days?.[0],
              stepsGoals: program.days?.map(d => ({ date: d.date, goal: d.dailyStepsGoal }))
            });
          } catch (e) {
            console.log(`❌ Ошибка парсинга программы ${key}:`, e);
          }
        }
      }
      return programs;
    };
    
    // Функция для диагностики шагомера
    window.diagnoseStepCounter = () => {
      console.log('🔍 Диагностика шагомера:');
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('🌐 Is Mobile:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      console.log('📱 Telegram WebApp:', !!window.Telegram?.WebApp);
      console.log('🔑 Permissions API:', !!navigator.permissions);
      console.log('� Has Steps Permission:', hasStepsPermission);
      console.log('�💾 LocalStorage шаги:', localStorage.getItem('dianafit_daily_steps'));
      console.log('📅 LocalStorage дата:', localStorage.getItem('dianafit_steps_date'));
      console.log('🔐 Auth Data:', localStorage.getItem('dianafit_health_auth'));
      console.log('🎯 Текущая цель:', stepsGoal);
      console.log('👣 Текущие шаги:', dailySteps);
      console.log('⚠️ Ошибка шагов:', stepsError);
      console.log('🌐 Google API загружен:', !!window.gapi);
      console.log('🔗 Google Auth инициализирован:', !!(window.gapi?.auth2?.getAuthInstance));
    };
    
    // Функция для принудительного запроса разрешений
    window.requestStepsPermission = () => {
      console.log('🔐 Принудительно открываем модал разрешений');
      setShowStepsPermission(true);
    };
    
    // Функция для сброса флага "уже спрашивали разрешение"
    window.resetPermissionAsked = () => {
      console.log('🔄 Сбрасываем флаг "уже спрашивали разрешение"');
      localStorage.removeItem('dianafit_steps_permission_asked');
      console.log('✅ Флаг сброшен. При следующем заходе модал покажется автоматически');
    };

    // Функция для еженедельной аналитики
    window.runWeeklyAnalytics = async () => {
      console.log('📊 Запускаем еженедельную аналитику...');
      
      // Собираем статистику за последние 7 дней
      const weekStats = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        
        const statsKey = `completion_stats_${dateStr}`;
        const dayStats = localStorage.getItem(statsKey);
        
        if (dayStats) {
          weekStats.push(JSON.parse(dayStats));
        } else {
          // Добавляем пустой день если нет данных
          weekStats.push({
            date: dateStr,
            completionPercentage: 0,
            totalExercises: 0,
            completedExercises: 0,
            totalMeals: 0,
            completedMeals: 0,
            stepsCompleted: false,
            exerciseReasons: {},
            mealReasons: {}
          });
        }
      }
      
      console.log('📈 Статистика недели:', weekStats);
      
      try {
        const response = await fetch(`${API_URL}/api/weekly-analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weekStats,
            userId: 'demo_user',
            programId: programId || 'demo_program'
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('🎯 Анализ недели получен:', result.analysis);
          
          // Показываем краткий отчет в консоли
          console.log(`📊 Средний процент выполнения: ${result.analysis.weekSummary.avgCompletion}%`);
          console.log(`✅ Успешных дней: ${result.analysis.weekSummary.completedDays}`);
          console.log(`⚠️ Сложных дней: ${result.analysis.weekSummary.strugglingDays}`);
          console.log(`💬 Сообщение: ${result.analysis.motivationalMessage}`);
          
          if (result.analysis.recommendations.length > 0) {
            console.log('🎯 Рекомендации:');
            result.analysis.recommendations.forEach((rec, i) => {
              console.log(`  ${i + 1}. ${rec.title}: ${rec.text}`);
            });
          }
          
          return result.analysis;
        } else {
          console.error('❌ Ошибка анализа:', result.error);
        }
      } catch (error) {
        console.error('❌ Ошибка сети при анализе:', error);
      }
    };
    
    // Функция для очистки всех программ
    window.clearPrograms = () => {
      console.log('🧹 Очищаем все программы в localStorage');
      Object.keys(localStorage).filter(key => key.startsWith('program_')).forEach(key => {
        console.log('🗑️ Удаляем:', key);
        localStorage.removeItem(key);
      });
      console.log('✅ Все программы очищены. Обновите страницу для создания новой программы.');
    };

    // Функция для пересоздания программы с корректными начальными значениями
    window.recreateProgram = () => {
      console.log('🔄 Пересоздаем программу с правильными начальними значениями...');
      
      // Очищаем старые программы
      Object.keys(localStorage).filter(key => key.startsWith('program_')).forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('✅ Старые программы удалены. Перезагрузите страницу для создания новой программы.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    console.log('🛠️ Отладочные функции добавлены в window:');
    console.log('   clearStepsData() - очистить данные о шагах');
    console.log('   checkPrograms() - проверить программы в localStorage');
    console.log('   diagnoseStepCounter() - диагностика шагомера');
    console.log('   requestStepsPermission() - открыть модал разрешений');
    console.log('   resetPermissionAsked() - сбросить флаг "уже спрашивали"');
    console.log('   runWeeklyAnalytics() - запустить анализ недели');
    console.log('   recreateProgram() - пересоздать программу с начальными значениями');
    
    return () => {
      delete window.clearStepsData;
      delete window.checkPrograms;
      delete window.diagnoseStepCounter;
      delete window.requestStepsPermission;
      delete window.resetPermissionAsked;
      delete window.runWeeklyAnalytics;
      delete window.recreateProgram;
    };
  }, [dailySteps, stepsGoal, stepsError, hasStepsPermission]);

  // Загружаем данные о шагах при монтировании компонента
  useEffect(() => {
    // При первом запуске проверяем и очищаем старые данные
    const clearOldStepsData = () => {
      const savedDate = localStorage.getItem('dianafit_steps_date');
      const today = new Date().toDateString();
      
      console.log('🔍 Проверяем данные в localStorage:', {
        savedDate, 
        today, 
        savedSteps: localStorage.getItem('dianafit_daily_steps')
      });
      
      if (savedDate && savedDate !== today) {
        console.log('🧹 Очищаем устаревшие данные о шагах при запуске');
        localStorage.removeItem('dianafit_daily_steps');
        localStorage.removeItem('dianafit_steps_date');
      }
      
      // Дополнительная проверка: если нет даты, но есть шаги - тоже очищаем
      if (!savedDate && localStorage.getItem('dianafit_daily_steps')) {
        console.log('🧹 Очищаем данные без даты');
        localStorage.removeItem('dianafit_daily_steps');
      }
    };
    
    clearOldStepsData();
    getStepsFromDevice();
  }, []);

  // Автоматическое обновление данных о шагах каждые 5 минут
  useEffect(() => {
    const interval = setInterval(() => {
      getStepsFromDevice();
    }, 5 * 60 * 1000); // 5 минут

    return () => clearInterval(interval);
  }, []);

  // Сохраняем шаги при изменении
  useEffect(() => {
    if (dailySteps > 0) {
      saveStepsToStorage(dailySteps);
    }
  }, [dailySteps]);

  // Загружаем AI-план питания при монтировании
  useEffect(() => {
    async function fetchAIMealPlan() {
      if (!answers) {
        console.warn('AI meal plan: нет answers, запрос не отправляется');
        return;
      }
      setAiLoading(true);
      setAiError(null);
      try {
        console.log('AI meal plan: отправляем профиль:', answers);
        const res = await fetch(`${API_URL}/api/ai-meal-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: answers })
        });
        console.log('AI meal plan: статус ответа:', res.status);
        const data = await res.json();
        console.log('AI meal plan: ответ сервера:', data);
        if (data.success && data.meals) {
          setAiMeals(data.meals);
        } else {
          setAiError(data.error || 'Ошибка генерации плана питания');
        }
      } catch (e) {
        setAiError('Ошибка подключения к AI');
        console.error('AI meal plan: ошибка запроса:', e);
      } finally {
        setAiLoading(false);
      }
    }
    fetchAIMealPlan();
  }, [answers]);

  // Вычисляем общие калории и БЖУ
  const totalCalories = currentDay.meals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 1530;
  const targetCalories = answers?.targetCalories || 1800; // Из квиза
  
  const products = currentDay.meals
    ? Array.from(new Set(currentDay.meals.flatMap(m => {
        const mealInfo = m.meal || { name: m.menu || '', ingredients: [] };
        if (typeof mealInfo === 'string') {
          return mealInfo.split(/,| /).map(s => s.trim()).filter(Boolean);
        } else if (mealInfo.ingredients) {
          return mealInfo.ingredients.map(ing => ing.name);
        } else {
          return [mealInfo.name || ''];
        }
      })))
    : [];

  const localProgramId = programId || currentDay.programId;

  // Обработчик выбора причины невыполнения
  const handleReasonSelected = async (reasonData) => {
    console.log('📝 handleReasonSelected вызван:', { reasonData, reasonModalData });
    const { type, index } = reasonModalData;
    
    if (type === 'workout') {
      console.log('🏋️ Обрабатываем причину для упражнения:', { index, reasonData });
      // Сохраняем причину невыполнения упражнения
      const newReasons = { ...exerciseReasons, [index]: reasonData };
      const updated = completedExercises.map((v, i) => i === index ? false : v);
      setExerciseReasons(newReasons);
      setCompletedExercises(updated);
      // Отправляем на бэкенд с актуальными данными
      if (answers?.userId) {
        try {
          await fetch(`${API_URL}/api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: answers.userId,
              date: currentDay.date,
              tasks: buildTasksWithCustomExercises(updated, newReasons)
            })
          });
        } catch (error) {
          console.error('❌ Ошибка сохранения причины невыполнения упражнения:', error);
        }
      }
    } else if (type === 'meal') {
      console.log('🍽️ Обрабатываем причину для приема пищи:', { index, reasonData });
      // Сохраняем причину невыполнения приема пищи
      const newReasons = { ...mealReasons, [index]: reasonData };
      setMealReasons(newReasons);
      
      // Отмечаем прием пищи как НЕ выполнен
      const updated = completedMeals.map((v, i) => i === index ? false : v);
      setCompletedMeals(updated);
      
      if (answers?.userId) {
        try {
          await fetch(`${API_URL}/api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: answers.userId,
              date: currentDay.date,
              tasks: buildTasks()
            })
          });
        } catch (error) {
          console.error('❌ Ошибка сохранения причины невыполнения приема пищи:', error);
        }
      }
    }

    console.log('📊 Причина сохранена:', { type, index, reason: reasonData });
    // Закрываем модал
    setShowReasonModal(false);
  };

  // Обработчик выбора состояния упражнения (выполнил/не выполнил)
  const handleExerciseComplete = async (idx, completed) => {
    // Если отмечаем как НЕ выполнено - показываем модал с причинами
    if (!completed) {
      setReasonModalData({
        type: 'workout',
        index: idx,
        itemName: currentDay.workout?.exercises[idx]?.name || `Упражнение ${idx + 1}`
      });
      setShowReasonModal(true);
      return;
    }

    // Если отмечаем как выполнено - сразу обновляем
    if (completed) {
      // Убираем причину, если была
      const newReasons = { ...exerciseReasons };
      delete newReasons[idx];
      setExerciseReasons(newReasons);
    }

    const updated = completedExercises.map((v, i) => i === idx ? completed : v);
    setCompletedExercises(updated);
    
    // Добавляем тактильную обратную связь (вибрацию) при успешном выполнении
    if (completed && navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    if (localProgramId) {
      try {
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: localProgramId,
            date: currentDay.date,
            tasks: buildTasks()
          })
        });
        console.log('✅ Статус упражнения обновлен:', { idx, completed });
      } catch (error) {
        console.error('❌ Ошибка обновления статуса упражнения:', error);
      }
    }
  };

  async function handleExerciseChange(idx) {
    const wasCompleted = completedExercises[idx];
    const willBeCompleted = !wasCompleted;

    // Если отмечаем как НЕ выполнено (было выполнено, становится не выполнено)
    if (wasCompleted && !willBeCompleted) {
      // Показываем модал с причинами
      setReasonModalData({
        type: 'workout',
        index: idx,
        itemName: currentDay.workout?.exercises[idx]?.name || `Упражнение ${idx + 1}`
      });
      setShowReasonModal(true);
      return; // Не обновляем состояние сразу, ждем выбор причины
    }

    // Если отмечаем как выполнено - сразу обновляем
    if (!wasCompleted && willBeCompleted) {
      // Убираем причину, если была
      const newReasons = { ...exerciseReasons };
      delete newReasons[idx];
      setExerciseReasons(newReasons);
    }

    const updated = completedExercises.map((v, i) => i === idx ? willBeCompleted : v);
    setCompletedExercises(updated);
    
    // Добавляем тактильную обратную связь (вибрацию) при успешном выполнении
    if (willBeCompleted && navigator.vibrate) {
      navigator.vibrate(100); // 100ms вибрация при отметке как выполнено
    }
    
    if (localProgramId) {
      try {
        const payload = {
          programId: localProgramId,
          date: currentDay.date,
          completedExercises: updated
        };

        // Добавляем причины невыполнения если есть
        if (Object.keys(exerciseReasons).length > 0) {
          payload.exerciseReasons = exerciseReasons;
        }

        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        console.log('✅ Статус упражнения обновлен:', { idx, completed: willBeCompleted });
      } catch (error) {
        console.error('❌ Ошибка обновления статуса упражнения:', error);
      }
    }
  }

  // Обработчик выбора состояния приема пищи (съел/не съел)
  const handleMealComplete = async (idx, completed) => {
    // Если отмечаем как НЕ съедено - показываем модал с причинами
    if (!completed) {
      setReasonModalData({
        type: 'meal',
        index: idx,
        itemName: currentDay.meals[idx]?.type || `Прием пищи ${idx + 1}`
      });
      setShowReasonModal(true);
      return;
    }

    // Если отмечаем как съедено - сразу обновляем
    if (completed) {
      // Убираем причину, если была
      const newReasons = { ...mealReasons };
      delete newReasons[idx];
      setMealReasons(newReasons);
    }

    const updated = completedMeals.map((v, i) => i === idx ? completed : v);
    setCompletedMeals(updated);
    // Явная отправка на backend с актуальным массивом
    fetch(`${API_URL}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: localProgramId,
        date: currentDay.date,
        tasks: buildTasksWithMeals(updated)
      })
    });
  };

  async function handleMealChange(idx) {
    const wasCompleted = completedMeals[idx];
    const willBeCompleted = !wasCompleted;

    // Если отмечаем как НЕ съедено (было съедено, становится не съедено)
    if (wasCompleted && !willBeCompleted) {
      // Показываем модал с причинами
      setReasonModalData({
        type: 'meal',
        index: idx,
        itemName: currentDay.meals[idx]?.type || `Прием пищи ${idx + 1}`
      });
      setShowReasonModal(true);
      return; // Не обновляем состояние сразу, ждем выбор причины
    }

    // Если отмечаем как съедено - сразу обновляем
    if (!wasCompleted && willBeCompleted) {
      // Убираем причину, если была
      const newReasons = { ...mealReasons };
      delete newReasons[idx];
      setMealReasons(newReasons);
    }

    const updated = completedMeals.map((v, i) => i === idx ? willBeCompleted : v);
    setCompletedMeals(updated);
    
    if (localProgramId) {
      try {
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: localProgramId,
            date: currentDay.date,
            tasks: buildTasks()
          })
        });
      } catch (error) {
        console.error('❌ Ошибка обновления статуса приема пищи:', error);
      }
    }
  }

  async function handleAnalyzeClick() {
    setLoadingAI(true);
    setAiAnalysis('');
    try {
      const res = await fetch(`${API_URL}/api/calculate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          completedExercises,
          completedMeals,
          feedback: 'analyze-today'
        })
      });
      const data = await res.json();
      setAiAnalysis(data.plan || 'Нет ответа от ИИ');
    } catch (e) {
      setAiAnalysis('Ошибка при обращении к ИИ');
    }
    setLoadingAI(false);
  }

  // Функция для расчета общего процента выполнения дня
  const calculateDayCompletionPercentage = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    // Считаем упражнения
    if (currentDay.workout?.exercises && currentDay.workout.exercises.length > 0) {
      totalTasks += currentDay.workout.exercises.length;
      completedTasks += completedExercises.filter(Boolean).length;
    }

    // Считаем приемы пищи
    if (currentDay.meals && currentDay.meals.length > 0) {
      totalTasks += currentDay.meals.length;
      completedTasks += completedMeals.filter(Boolean).length;
    }

    // Считаем шаги (если достигнута цель - засчитываем как выполненное)
    totalTasks += 1; // Цель по шагам
    if (dailySteps >= stepsGoal) {
      completedTasks += 1;
    }

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const completionPercentage = calculateDayCompletionPercentage();

  // Сохраняем статистику выполнения для аналитики
  useEffect(() => {
    const saveCompletionStats = () => {
      const statsKey = `completion_stats_${currentDay.date}`;
      const stats = {
        date: currentDay.date,
        completionPercentage,
        totalExercises: currentDay.workout?.exercises?.length || 0,
        completedExercises: completedExercises.filter(Boolean).length,
        totalMeals: currentDay.meals?.length || 0,
        completedMeals: completedMeals.filter(Boolean).length,
        stepsGoal,
        actualSteps: dailySteps,
        stepsCompleted: dailySteps >= stepsGoal,
        exerciseReasons,
        mealReasons,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(statsKey, JSON.stringify(stats));
      console.log('📊 Статистика дня сохранена:', stats);
    };

    // Сохраняем статистику при изменении данных
    if (currentDay.date) {
      saveCompletionStats();
    }
  }, [completedExercises, completedMeals, dailySteps, exerciseReasons, mealReasons, completionPercentage]);

  // Отладочный useEffect для мониторинга изменений в массивах статусов
  useEffect(() => {
    console.log('🔍 СОСТОЯНИЕ completedExercises изменилось:', {
      length: completedExercises.length,
      values: completedExercises,
      types: completedExercises.map((val, i) => `[${i}]: ${val} (${typeof val})`)
    });
  }, [completedExercises]);

  useEffect(() => {
    console.log('🔍 СОСТОЯНИЕ completedMeals изменилось:', {
      length: completedMeals.length,
      values: completedMeals,
      types: completedMeals.map((val, i) => `[${i}]: ${val} (${typeof val})`)
    });
  }, [completedMeals]);

  // Функция для загрузки статусов выполнения дня с backend
  const fetchDayStatus = async () => {
    if (!answers?.userId || !currentDay?.date) return;
    try {
      const res = await fetch(`${API_URL}/api/progress?userId=${answers.userId}&date=${currentDay.date}`);
      const data = await res.json();
      if (data && (Array.isArray(data.tasks) || data.completedMealsArr || data.completedExercises)) {
        // Если tasks есть — используем их для tasks-based UI
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        // Для обратной совместимости:
        if (data.completedMealsArr) setCompletedMeals(data.completedMealsArr);
        if (data.completedExercises) setCompletedExercises(data.completedExercises);
      }
    } catch (e) {
      console.error('Ошибка загрузки статусов дня:', e);
    }
  };

  // Загружаем статусы при смене дня
  useEffect(() => {
    fetchDayStatus();
    // eslint-disable-next-line
  }, [currentDay?.date, answers?.userId]);

  // --- Новая функция для отправки статуса приема пищи на backend ---
  // Обработчик выбора состояния приема пищи (съел/не съел)
  const handleMealStatusChange = async (idx, completed) => {
    console.log('🍽️ handleMealStatusChange вызван:', { idx, completed, type: typeof completed });
    
    // Если отмечаем как НЕ съедено - показываем модал с причинами
    if (!completed) {
      console.log('❌ Показываем модал причины, так как completed =', completed);
      const mealName = Array.isArray(aiMeals) && aiMeals[idx] 
        ? aiMeals[idx].type || aiMeals[idx].name 
        : `Прием пищи ${idx + 1}`;
      setReasonModalData({
        type: 'meal',
        index: idx,
        itemName: mealName
      });
      setShowReasonModal(true);
      return;
    }

    // Если отмечаем как съедено - сразу обновляем
    if (completed) {
      console.log('✅ Обновляем статус как съедено, так как completed =', completed);
      // Убираем причину, если была
      const newReasons = { ...mealReasons };
      delete newReasons[idx];
      setMealReasons(newReasons);
    }

    const updated = completedMeals.map((v, i) => i === idx ? completed : v);
    setCompletedMeals(updated);
    
    // Добавляем тактильную обратную связь (вибрацию) при успешном выполнении
    if (completed && navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    // Отправляем на бэкенд (как в handleExerciseComplete)
    if (answers?.userId) {
      try {
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: answers.userId,
            date: currentDay.date,
            tasks: buildTasks()
          })
        });
        console.log('✅ Статус приема пищи отправлен на бэкенд:', { idx, completed });
      } catch (error) {
        console.error('❌ Ошибка отправки статуса приема пищи на бэкенд:', error);
      }
    }
    
    console.log('✅ Статус приема пищи обновлен:', { idx, completed, updatedArray: updated });
  };

  // --- СИНХРОНИЗАЦИЯ ПРОГРЕССА (POST /api/progress) ---
  useEffect(() => {
    if (!answers?.userId || !currentDay?.date) return;
    const payload = {
      userId: answers.userId,
      date: currentDay.date,
      tasks: buildTasks()
    };
    fetch(`${API_URL}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        // Можно добавить debug-лог
        // console.log('[POST /api/progress] Ответ:', data);
      })
      .catch(e => {
        console.error('[POST /api/progress] Ошибка:', e);
      });
  }, [completedExercises, completedMeals, dailySteps, stepsGoal, answers?.userId, currentDay?.date]);

  // --- UI: Верхняя панель ---
  // Кнопка Диана АИ (слева)
  const dianaButton = (
    <button
      onClick={() => setShowDianaChat(true)}
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isPremium
          ? '0 4px 12px rgba(0, 0, 0, 0.15)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          padding: 0,
          margin: 0,
          outline: 'none',
          position: 'fixed',
      }}
      onMouseEnter={e => {
        e.target.style.transform = 'scale(1.05)';
        e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={e => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = isPremium
          ? '0 4px 12px rgba(0, 0, 0, 0.15)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
    >
      <img
        src={chatDianaIcon}
        alt="Чат с Дианой"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          filter: isPremium ? 'none' : 'grayscale(100%) brightness(0.7)',
          transition: 'filter 0.3s ease'
        }}
      />
      {!isPremium && (
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#ff6b35',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          border: '2px solid white',
          zIndex: 1001
        }}>
          🔒
        </div>
      )}
    </button>
  );

  // Кнопка профиля пользователя (справа сверху)
  const profileButton = (
    <button
      onClick={() => {
        if (typeof onProfileClick === 'function') {
          onProfileClick();
        }
      }}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0088cc 0%, #005699 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 1001,
        boxShadow: '0 4px 20px rgba(0, 136, 204, 0.4)',
        transition: 'all 0.3s ease',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        padding: 0,
        outline: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.07)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 136, 204, 0.5)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 136, 204, 0.4)';
      }}
    >
      {userAvatar ? (
        <img
          src={userAvatar}
          alt="User Avatar"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
        />
      ) : (
        <span style={{ fontSize: 28, color: 'white', fontWeight: 'bold' }}>👤</span>
      )}
    </button>
  );

  // Функция загрузки плана на сегодня
  const loadTodayPlan = async () => {
    if (!programId) return;
    setLoadingPlan(true);
    setPlanError(null);
    try {
      console.log('📅 Загружаем план на сегодня для программы:', programId);
      // Сначала пробуем загрузить из localStorage (демо версия)
      const localProgram = localStorage.getItem(`program_${programId}`);
      if (localProgram) {
        const program = JSON.parse(localProgram);
        console.log('💾 Найдена программа в localStorage:', program);
        const today = new Date().toISOString().slice(0, 10);
        const todayPlan = program.days.find(d => d.date === today);
        if (todayPlan) {
          console.log('✅ План на сегодня загружен из localStorage:', todayPlan);
          console.log('🎯 Цель по шагам из плана:', todayPlan.dailyStepsGoal);
          console.log('🎥 Проверка упражнений в плане:', todayPlan.workout?.exercises);
          setPersonalPlan(todayPlan);
          setLoadingPlan(false);
          return;
        } else {
          // Если сегодняшний день не найден, берем первый день программы
          const firstDay = program.days[0];
          if (firstDay) {
            console.log('📅 Сегодняшний день не найден, используем первый день программы:', firstDay);
            console.log('🎯 Цель по шагам из первого дня:', firstDay.dailyStepsGoal);
            console.log('🎥 Проверка упражнений в первом дне:', firstDay.workout?.exercises);
            setPersonalPlan(firstDay);
            setLoadingPlan(false);
            return;
          }
        }
      }
      // Если не нашли в localStorage, пробуем обратиться к серверу
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';
      const response = await fetch(`${API_URL}/api/program/today?programId=${programId}`);
      const data = await response.json();
      if (data.success) {
        console.log('✅ План на сегодня загружен с сервера:', data.plan);
        setPersonalPlan(data.plan);
      } else {
        console.error('❌ Ошибка загрузки плана:', data.error);
        setPlanError(data.error);
      }
    } catch (error) {
      console.error('❌ Ошибка сети при загрузке плана:', error);
      setPlanError('Ошибка подключения к серверу');
    } finally {
      setLoadingPlan(false);
    }
  };

  // Формируем массив задач для отправки
  function buildTasks() {
    const tasks = [];
    // Упражнения
    if (currentDay.workout?.exercises) {
      currentDay.workout.exercises.forEach((ex, i) => {
        tasks.push({
          name: ex.name,
          type: 'workout',
          done: completedExercises[i] === true, // строго true/false
          reason: completedExercises[i] === false && exerciseReasons[i] ? exerciseReasons[i] : undefined
        });
      });
    }
    // Приёмы пищи (используем aiMeals вместо currentDay.meals)
    if (Array.isArray(aiMeals) && aiMeals.length > 0) {
      aiMeals.forEach((m, i) => {
        tasks.push({
          name: m.type || m.name,
          type: 'meal',
          done: completedMeals[i] === true, // строго true/false
          reason: completedMeals[i] === false && mealReasons[i] ? mealReasons[i] : undefined
        });
      });
    }
    // Шаги
    tasks.push({
      name: 'steps',
      type: 'steps',
      done: dailySteps >= stepsGoal,
      value: dailySteps, // <--- добавлено число шагов
      reason: dailySteps < stepsGoal ? 'Не достигнута цель по шагам' : undefined
    });
    return tasks;
  }

  // Вспомогательная функция для сборки задач с актуальным completedMeals
  function buildTasksWithMeals(mealsArr) {
    const tasks = [];
    if (currentDay.workout?.exercises) {
      currentDay.workout.exercises.forEach((ex, i) => {
        tasks.push({
          name: ex.name,
          type: 'workout',
          done: completedExercises[i] === true,
          reason: completedExercises[i] === false && exerciseReasons[i] ? exerciseReasons[i] : undefined
        });
      });
    }
    if (currentDay.meals) {
      currentDay.meals.forEach((m, i) => {
        tasks.push({
          name: m.type || m.name,
          type: 'meal',
          done: mealsArr[i] === true,
          reason: mealsArr[i] === false && mealReasons[i] ? mealReasons[i] : undefined
        });
      });
    }
    tasks.push({
      name: 'steps',
      type: 'steps',
      done: dailySteps >= stepsGoal,
      value: dailySteps,
      reason: dailySteps < stepsGoal ? 'Не достигнута цель по шагам' : undefined
    });
    return tasks;
  }

  // Добавить функцию:
  function buildTasksWithCustomExercises(customExercises, customReasons) {
    const tasks = [];
    if (currentDay.workout?.exercises) {
      currentDay.workout.exercises.forEach((ex, i) => {
        tasks.push({
          name: ex.name,
          type: 'workout',
          done: customExercises[i] === true,
          reason: customExercises[i] === false && customReasons[i] ? customReasons[i] : undefined
        });
      });
    }
    if (Array.isArray(aiMeals) && aiMeals.length > 0) {
      aiMeals.forEach((m, i) => {
        tasks.push({
          name: m.type || m.name,
          type: 'meal',
          done: completedMeals[i] === true,
          reason: completedMeals[i] === false && mealReasons[i] ? mealReasons[i] : undefined
        });
      });
    }
    tasks.push({
      name: 'steps',
      type: 'steps',
      done: dailySteps >= stepsGoal,
      value: dailySteps,
      reason: dailySteps < stepsGoal ? 'Не достигнута цель по шагам' : undefined
    });
    return tasks;
  }

  // Сохраняем задачи на backend при каждом изменении (только после загрузки)
  useEffect(() => {
    if (!isLoaded || !answers?.userId || !currentDay?.date) return;
    const actualTasks = buildTasks();
    console.log('[DEBUG] Отправка tasks на backend:', actualTasks);
    fetch(`${API_URL}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: answers.userId,
        date: currentDay.date,
        tasks: actualTasks
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('[DEBUG] Ответ от backend на POST /api/progress:', data);
      })
      .catch(e => {
        console.error('[DEBUG] Ошибка отправки tasks на backend:', e);
      });
  }, [isLoaded, completedExercises, completedMeals, dailySteps, exerciseReasons, mealReasons, currentDay?.date, answers?.userId]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(180deg, #E3F3FF 0%, #E6F2FF 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0',
        boxSizing: 'border-box',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {profileButton}
      {dianaButton}
      {/* Кнопка К неделе по центру */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '32px 0 16px 0' }}>
        <button
          onClick={onBackToWeek}
          style={{
            background: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)',
            borderRadius: 25,
            padding: '14px 32px',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            border: 'none',
            boxShadow: '0px 4px 12px 0px rgba(79, 195, 247, 0.4)',
            cursor: 'pointer',
            outline: 'none',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            zIndex: 10
          }}
        >
          К НЕДЕЛЕ
        </button>
      </div>

      <div style={{ 
        flex: 1, 
        padding: '20px', 
        maxWidth: 480, 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {loadingPlan ? (
          // Показываем загрузку персонального плана
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1a1a1a' }}>
              📅 Загружаем ваш персональный план...
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              Подбираем тренировки и питание специально для вас
            </div>
          </div>
        ) : planError ? (
          // Показываем ошибку загрузки
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#e74c3c' }}>
              ❌ Ошибка загрузки плана
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              {planError}
            </div>
            <button
              onClick={loadTodayPlan}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: '#3498db',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Попробовать снова
            </button>
          </div>
        ) : programStartsLater ? (
          // Показываем сообщение о том, что программа начнется позже
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#1a1a1a' }}>
              Программа начнется позже
            </div>
            <div style={{ fontSize: 16, color: '#666', lineHeight: 1.5, marginBottom: 20 }}>
              Вы выбрали начать тренировки {answers?.start_date ? new Date(answers.start_date).toLocaleDateString('ru-RU') : 'в выбранную дату'}. 
              До этого времени можете ознакомиться с недельным расписанием.
            </div>
            <div style={{ 
              background: '#e3f0ff', 
              borderRadius: 12, 
              padding: '16px', 
              border: '1px solid #2196f3',
              color: '#1976d2',
              fontSize: 14,
              fontWeight: 500 
            }}>
              💡 Подготовьтесь заранее: посмотрите упражнения и составьте список покупок для правильного питания
            </div>
          </div>
        ) : (
          <>
            {/* 1. Заголовок с датой */}
            <div style={{ ...cardStyle, textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Сегодня</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
                {getCurrentDateString()}
              </div>
            </div>

            {/* 2. Блок активности (шаги) — перемещён вверх */}
            <div style={cardStyle}>
              <div style={{
                ...headerStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>🚶 Активность</span>
                <button
                  onClick={getStepsFromDevice}
                  disabled={isLoadingSteps}
                  style={{
                    background: isLoadingSteps 
                      ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
                      : 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: 'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                       color: isLoadingSteps ? '#666' : '#fff',
                    cursor: isLoadingSteps ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {isLoadingSteps && (
                    <div style={{
                      width: 12,
                      height: 12,
                      border: '2px solid #e2e8f0',
                      borderTop: '2px solid #2196f3',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  <span style={{ fontSize: 11 }}>
                    {isLoadingSteps ? 'Обновление' : 'Обновить'}
                  </span>
                </button>
              </div>
              
              {stepsError && (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3cd 0%, #fef7e0 100%)',
                    border: '1px solid #f6cc62',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    fontSize: 13,
                    color: '#92400e',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: 8,
                      fontWeight: 600 
                    }}>
                      ℹ️ Информация о подсчете шагов
                    </div>
                    {stepsError}
                    
                    {/* Кнопка для запроса разрешений */}
                    {!hasStepsPermission && (
                      <button
                        onClick={() => setShowStepsPermission(true)}
                        style={{
                          marginTop: 12,
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #059669 0%, #16a34a 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)';
                        }}
                      >
                        🔐 Разрешить доступ к шагам
                      </button>
                    )}
                                   </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <div style={{ 
                      fontSize: 16, 
                      color: '#1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      Шаги сегодня
                      {isLoadingSteps && (
                        <div style={{
                          width: 12,
                          height: 12,
                          border: '2px solid #e2e8f0',
                          borderTop: '2px solid #2196f3',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      )}
                      <span style={{ marginLeft: 8, color: '#64748b', fontSize: 13 }}>
                        {`Осталось ${(stepsGoal - dailySteps).toLocaleString()} шагов до цели`}
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Информация об источнике данных */}
              <div style={{
                fontSize: 11,
                color: '#9ca3af',
                textAlign: 'center',
                marginTop: 8,
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                {hasStepsPermission ? (
                  <>
                    <span style={{ color: '#10b981' }}>🔐</span>
                    Авторизованное подключение активно
                  </>
                ) : (
                  <>
                    <span style={{ color: '#f59e0b' }}>⚠️</span>
                    Требуется разрешение для автоматической синхронизации
                  </>
                )}
              </div>
            </div>

            {/* 3. Блок тренировки */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                🏋️‍♀️ Тренировка
              </div>
              
              {currentDay.workout && currentDay.workout.exercises && currentDay.workout.exercises.length > 0 ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>
                    {currentDay.workout.title || 'Тренировка'}
                  </div>
                  
                  {currentDay.workout.exercises.map((ex, i) => {
                    // Используем данные из упражнения, если они есть, иначе анализируем название тренировки
                    const location = ex.location || currentDay.workout.location || getWorkoutLocation(currentDay.workout.title || currentDay.workout.name);
                    const dayId = ex.dayId || getDayId(currentDay.workout.title || currentDay.workout.name, location);
                    const exerciseName = getExerciseEnglishName(ex.name);
                    
                    console.log('🎥 TodayBlock видео данные для упражнения:', {
                      exerciseName: ex.name,
                      location,
                      dayId,
                      exerciseEnglishName: exerciseName,
                      exerciseObject: ex,
                      workoutObject: currentDay.workout,
                      fullVideoPath: location && dayId && exerciseName ? `/videos/${location}/${dayId}/${exerciseName}.mp4` : null
                    });
                    
                    // Создаем видео компонент
                    const videoComponent = (location && dayId && (ex.videoName || exerciseName)) ? (
                      <VideoPlayer 
                        location={location}
                        dayId={dayId}
                        exerciseName={ex.videoName || exerciseName}
                        title={ex.name}
                      />
                    ) : (
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        <div style={{

                          width: '200px',
                          height: '300px',
                          background: '#e2e8f0',
                          borderRadius: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          fontSize: 14
                        }}>
                          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎥</div>
                          <div>Видео скоро</div>
                          <div style={{ fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>
                            Отсутствуют данные:<br/>
                            location: {location || 'нет'}<br/>
                            dayId: {dayId || 'нет'}<br/>
                            exerciseName: {exerciseName || 'нет'}
                          </div>
                        </div>
                      </div>
                    );
                    
                    return (
                      <ExerciseCard
                        key={i}
                        exercise={ex}
                        index={i}
                        isCompleted={(() => {
                          const value = completedExercises[i] ?? null; // Защита от undefined
                          console.log(`🏋️ Передаем в ExerciseCard[${i}]: исходное=${completedExercises[i]}, обработанное=${value}, typeof=${typeof value}, completedExercises.length=${completedExercises.length}`);
                          return value;
                        })()}
                        onStatusChange={handleExerciseComplete}
                        videoComponent={videoComponent}
                        reason={exerciseReasons[i]}
                      />
                    );
                  })}
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center',
                  padding: 24,
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                  borderRadius: 12
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#2d5a2d', marginBottom: 8 }}>
                    Сегодня день отдыха
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    Прогуляйся 10 000 шагов 💪
                  </div>
                </div>
              )}
            </div>

            {/* 4. Блок питания — только AI-данные */}
            {aiLoading ? (
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1a1a1a' }}>
                  🍽️ Генерируем меню дня...
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  AI подбирает блюда по вашему профилю
                </div>
              </div>
            ) : aiError ? (
              <div style={{ ...cardStyle, textAlign: 'center', color: '#e74c3c' }}>
                ❌ {aiError}
              </div>
            ) : Array.isArray(aiMeals) && aiMeals.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12, color: '#3b82f6', letterSpacing: '-0.01em', textAlign: 'center' }}>🍽️ Питание на день</div>
                {aiMeals.map((meal, idx) => {
                  const isAI = Array.isArray(meal.options) && meal.options.length > 0;
                  // Индекс выбранного варианта для этого приема пищи
                  const selectedIdx = selectedMealOptionIdx[idx] || 0;
                  // Функция для смены варианта
                  const setIdx = (fn) => {
                    setSelectedMealOptionIdx(prev => {
                      const arr = [...prev];
                      arr[idx] = typeof fn === 'function' ? fn(arr[idx] || 0) : fn;
                      return arr;
                    });
                  };
                  return (
                    <MealCard
                      key={meal.type + idx}
                      meal={meal}
                      index={idx}
                      isCompleted={completedMeals[idx] ?? null}
                      onStatusChange={handleMealStatusChange}
                      style={{ marginBottom: 18 }}
                      selectedIdx={selectedIdx}
                      setSelectedIdx={setIdx}
                      reason={mealReasons[idx]}
                    />
                  );
                })}
              </div>
            )}

            {/* 5. Мотивация дня */}
            <div style={{
              ...cardStyle,
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              border: '1px solid #a5b4fc',
              textAlign: 'center',
              marginBottom: 24
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>💬</div>
              <div style={{ 
                fontSize: 16, 
                fontStyle: 'italic', 
                color: '#3730a3', 
                lineHeight: 1.4,
                fontWeight: 500
              }}>
                {todayQuote}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Закрепленная кнопка вызова чата с Дианой в правом верхнем углу */}
      <button
        onClick={() => {
          if (isPremium) {
            setShowDianaChat(true);
          } else {
            // Показываем страницу оплаты для разблокировки чата
            if (setIsPaymentShown) {
              setIsPaymentShown(true);
            }
          }
        }}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'none',
          border: 'none',
          cursor: isPremium ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isPremium 
            ? '0 4px 12px rgba(0, 0, 0, 0.15)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          padding: 0,
          margin: 0,
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (isPremium) {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = isPremium 
            ? '0 4px 12px rgba(0, 0, 0, 0.15)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
      >
        {/* Дизайнерская иконка чата с Дианой */}
        <img 
          src={chatDianaIcon}          alt={isPremium ? "Чат с Дианой" : "Чат с Дианой (Premium)"}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            filter: isPremium ? 'none' : 'grayscale(100%) brightness(0.7)',
            transition: 'filter 0.3s ease'
          }}
        />
      </button>
      
      {/* Диалог чата с Дианой */}
      {showDianaChat && (
        <DianaChat
          onClose={() => setShowDianaChat(false)}
          isPremium={isPremium}
        />
      )}
      
      {/* Модал для запроса разрешений на доступ к шагам */}
      <StepsPermissionModal
        isVisible={showStepsPermission}
        onClose={() => setShowStepsPermission(false)}
        onPermissionGranted={handlePermissionGranted}
      />
      
      {/* Модал для выбора причины невыполнения */}
      <ReasonModal
        isVisible={showReasonModal}
        onClose={() => setShowReasonModal(false)}
        onReasonSelected={handleReasonSelected}
        type={reasonModalData.type}
        itemName={reasonModalData.itemName}
      />
    </div>
  );
}
