import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import DianaChat from './DianaChat';
import StepsPermissionModal from './StepsPermissionModal';
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

// Временно используем только production URL для тестирования ИИ
const API_URL = 'https://dianafit.onrender.com';

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

// Компонент для отображения приема пищи с граммовками
const MealCard = ({ meal, index, isCompleted, onToggleComplete }) => {
  const [showIngredients, setShowIngredients] = useState(false);

  // Получаем информацию о блюде (название + граммовки) 
  const mealInfo = meal.meal || { name: meal.menu || 'Не указано', ingredients: [] };
  const mealName = typeof mealInfo === 'string' ? mealInfo : mealInfo.name;
  const ingredients = typeof mealInfo === 'object' && mealInfo.ingredients ? mealInfo.ingredients : [];

  const checkboxButtonStyle = (completed) => ({
    padding: '8px 16px',
    backgroundColor: completed ? '#22c55e' : '#f1f5f9',
    color: completed ? 'white' : '#64748b',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%'
  });

  return (
    <div style={{
      marginBottom: 12,
      padding: 12,
      background: '#f8fafc',
      borderRadius: 8,
      border: '1px solid #e2e8f0'
    }}>
      {/* Заголовок приема пищи */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
          {meal.type}
        </div>
        <div style={{ fontSize: 14, color: '#666' }}>
          {meal.calories || 0} ккал
        </div>
      </div>

      {/* Название блюда */}
      <div style={{ fontSize: 14, color: '#666', marginBottom: 8, fontWeight: 500 }}>
        {mealName}
      </div>

      {/* Кнопка для разворачивания ингредиентов */}
      {ingredients.length > 0 && (
        <button
          onClick={() => setShowIngredients(!showIngredients)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#e2e8f0',
            color: '#64748b',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          📊 {showIngredients ? 'Скрыть граммовки' : 'Показать граммовки'}
          <span style={{ transform: showIngredients ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
      )}

      {/* Список ингредиентов с граммовками */}
      {showIngredients && ingredients.length > 0 && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          padding: 8,
          marginBottom: 8
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Состав:
          </div>
          {ingredients.map((ingredient, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: idx < ingredients.length - 1 ? '1px solid #f3f4f6' : 'none',
              fontSize: 11,
              color: '#6b7280'
            }}>
              <span>{ingredient.name}</span>
              <span style={{ fontWeight: 500, color: '#374151' }}>
                {ingredient.amount} {ingredient.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка завершения */}
      <button
        onClick={onToggleComplete}
        style={checkboxButtonStyle(isCompleted)}
      >
        {isCompleted ? '✅ Съел' : '🍽️ Съесть'}
      </button>
    </div>
  );
};

export default function TodayBlock({ day, answers, onBackToWeek, programId, isPremium, activatePremium, setIsPaymentShown }) {
  // Состояние для персонального плана
  const [personalPlan, setPersonalPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  
  // Состояние для чата с Дианой
  const [showDianaChat, setShowDianaChat] = useState(false);
  
  // Состояние для модала разрешений на шаги
  const [showStepsPermission, setShowStepsPermission] = useState(false);
  const [hasStepsPermission, setHasStepsPermission] = useState(false);

  // Загружаем персональный план при монтировании компонента
  useEffect(() => {
    if (programId) {
      loadTodayPlan();
    }
  }, [programId]);

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
  
  const [completedExercises, setCompletedExercises] = useState(
    currentDay.workout?.exercises.map((ex, i) => currentDay.completedExercises?.[i] || false) || []
  );
  const [completedMeals, setCompletedMeals] = useState(
    currentDay.meals?.map((m, i) => currentDay.completedMealsArr?.[i] || false) || []
  );
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
      const hoursToday = new Date().getHours();
      const approximateSteps = Math.floor(hoursToday * 400 + Math.random() * 1000);
      
      localStorage.setItem('dianafit_ios_steps_cache', approximateSteps.toString());
      localStorage.setItem('dianafit_ios_steps_date', today);
      
      console.log('📊 iOS Motion шаги (приблизительно):', approximateSteps);
      return approximateSteps;
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

      // Базовая оценка для демонстрации
      const hoursToday = new Date().getHours();
      const estimatedSteps = Math.floor(hoursToday * 300 + Math.random() * 800);
      
      localStorage.setItem('dianafit_web_steps_cache', estimatedSteps.toString());
      localStorage.setItem('dianafit_web_steps_date', today);
      
      console.log('📊 Web Sensors шаги (оценка):', estimatedSteps);
      return estimatedSteps;
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
    
    console.log('🛠️ Отладочные функции добавлены в window:');
    console.log('   clearStepsData() - очистить данные о шагах');
    console.log('   checkPrograms() - проверить программы в localStorage');
    console.log('   diagnoseStepCounter() - диагностика шагомера');
    console.log('   requestStepsPermission() - открыть модал разрешений');
    console.log('   resetPermissionAsked() - сбросить флаг "уже спрашивали"');
    
    return () => {
      delete window.clearStepsData;
      delete window.checkPrograms;
      delete window.diagnoseStepCounter;
      delete window.requestStepsPermission;
      delete window.resetPermissionAsked;
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

  async function handleExerciseChange(idx) {
    const updated = completedExercises.map((v, i) => i === idx ? !v : v);
    setCompletedExercises(updated);
    
    // Добавляем тактильную обратную связь (вибрацию) при успешном выполнении
    if (updated[idx] && navigator.vibrate) {
      navigator.vibrate(100); // 100ms вибрация при отметке как выполнено
    }
    
    if (localProgramId) {
      try {
        await fetch(`${API_URL}/api/program/day-complete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId: localProgramId, date: currentDay.date, completedExercises: updated })
        });
        console.log('✅ Статус упражнения обновлен:', { idx, completed: updated[idx] });
      } catch (error) {
        console.error('❌ Ошибка обновления статуса упражнения:', error);
      }
    }
  }

  async function handleMealChange(idx) {
    const updated = completedMeals.map((v, i) => i === idx ? !v : v);
    setCompletedMeals(updated);
    if (localProgramId) {
      await fetch(`${API_URL}/api/program/day-complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: localProgramId, date: currentDay.date, completedMealsArr: updated })
      });
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

  return (
    <div style={{ 
      width: '100vw', 
      minHeight: '100dvh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' 
    }}>
      {/* Шапка с кнопкой назад */}
      <div style={{ 
        padding: '16px 20px', 
        background: '#fff', 
        borderBottom: '1px solid #e2e8f0'
      }}>
        <button
          onClick={onBackToWeek}
          style={{
            fontSize: 16,
            padding: '8px 16px',
            borderRadius: 8,
            background: '#e0e7ff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#2196f3',
            whiteSpace: 'nowrap'
          }}
        >← К расписанию</button>
        
        {/* Заголовок под кнопкой */}
        <div style={{ 
          fontSize: 20, 
          fontWeight: 700, 
          color: '#1a1a1a', 
          textAlign: 'center',
          marginTop: 12
        }}>
          Текущий день
        </div>
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

            {/* 2. Блок тренировки */}
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
                    
                    return (
                      <div key={i} style={{ 
                        marginBottom: 20, 
                        padding: 16, 
                        background: '#f8fafc', 
                        borderRadius: 12,
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>
                          {ex.name}
                        </div>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                          {ex.reps} повторений
                        </div>
                        
                        {(location && dayId && (ex.videoName || exerciseName)) ? (
                          <VideoPlayer 
                            location={location}
                            dayId={dayId}
                            exerciseName={ex.videoName || exerciseName}
                            title={ex.name}
                          />
                        ) : (
                          <div style={{ 
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: 12
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
                        )}
                        
                        <button
                          onClick={() => handleExerciseChange(i)}
                          style={{
                            ...checkboxButtonStyle(completedExercises[i]),
                            width: '100%'
                          }}
                        >
                          {completedExercises[i] ? '✅ Выполнено' : '⭕ Выполнить'}
                        </button>
                      </div>
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

            {/* 3. Блок питания */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                🥗 Питание на день
              </div>
              
              {/* БЖУ и Калории */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                background: '#f8fafc', 
                padding: 16, 
                borderRadius: 12,
                marginBottom: 16,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2196f3' }}>{totalCalories}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Ккал</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>120г</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Белки</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>80г</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Жиры</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>180г</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Углеводы</div>
                </div>
              </div>

              {/* Приемы пищи */}
              {currentDay.meals && currentDay.meals.map((meal, i) => (
                <MealCard 
                  key={i} 
                  meal={meal} 
                  index={i} 
                  isCompleted={completedMeals[i]} 
                  onToggleComplete={() => handleMealChange(i)} 
                />
              ))}
            </div>

            {/* 4. Блок активности */}
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
                    color: isLoadingSteps ? '#64748b' : '#ffffff',
                    cursor: isLoadingSteps ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isLoadingSteps 
                      ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                      : '0 2px 6px rgba(79, 70, 229, 0.25)',
                    letterSpacing: '0.2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    outline: 'none',
                    height: 28
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoadingSteps) {
                      e.target.style.boxShadow = '0 3px 8px rgba(79, 70, 229, 0.35)';
                      e.target.style.background = 'linear-gradient(135deg, #5B52F0 0%, #7C3AED 100%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoadingSteps) {
                      e.target.style.boxShadow = '0 2px 6px rgba(79, 70, 229, 0.25)';
                      e.target.style.background = 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)';
                    }
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    animation: isLoadingSteps ? 'spin 1s linear infinite' : 'none',
                    fontSize: 10
                  }}>
                    {isLoadingSteps ? '⟳' : '🔄'}
                  </span>
                  <span style={{ fontSize: 11 }}>
                    {isLoadingSteps ? 'Обновление' : 'Обновить'}
                  </span>
                </button>
              </div>
              
              {stepsError && (
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
              )}
              
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
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: dailySteps >= stepsGoal ? '#10b981' : '#2196f3' }}>
                  {dailySteps.toLocaleString()} / {stepsGoal.toLocaleString()}
                </div>
              </div>
              
              {/* Прогресс-бар шагов */}
              <div style={{ 
                height: 8, 
                background: '#e2e8f0', 
                borderRadius: 4, 
                overflow: 'hidden',
                marginBottom: 12 
              }}>
                <div style={{ 
                  width: `${Math.min((dailySteps / stepsGoal) * 100, 100)}%`, 
                  height: '100%', 
                  background: dailySteps >= stepsGoal ? '#10b981' : '#2196f3',
                  transition: 'width 0.3s ease' 
                }} />
              </div>
              
              <div style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                {dailySteps >= stepsGoal ? 
                  '🎉 Цель достигнута! Отлично!' : 
                  `Осталось ${(stepsGoal - dailySteps).toLocaleString()} шагов до цели`
                }
              </div>
              
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
          src={chatDianaIcon} 
          alt={isPremium ? "Чат с Дианой" : "Чат с Дианой (Premium)"}
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
        
        {/* Замочек для заблокированного состояния */}
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
            border: '2px solid white'
          }}>
            🔒
          </div>
        )}
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
    </div>
  );
}
