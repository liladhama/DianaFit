
import React, { useState, useEffect } from 'react';
import '../styles/animations.css';
import Confetti from 'react-confetti';
import WheelPicker from './WheelPicker';
import PaymentPage from './PaymentPage';
import VideoPlayer from './VideoPlayer';
import DianaChat from './DianaChat';
import ReasonModal from './ReasonModal';
import ExerciseCard from './ExerciseCard';
import MealCard from './MealCardNew';
import MealBlock from './MealBlock';
import { getWorkoutLocation, getDayId, getExerciseEnglishName, getVideoPathForExercise } from '../utils/videoUtils';
import chatDianaIcon from '../assets/icons/chat-diana-icon.png';
import { API_URL } from '../config/api';
import { generateMealsForDay } from '../utils/generateMealsForDay';
// --- Массивы для WheelPicker шагов ---
const stepMinutesArr = [20, 30, 40, 50, 60, 70, 80, 90];
const stepLabels = [
  '20 мин',
  '30 мин',
  '40 мин',
  '50 мин',
  '60 мин',
  '70 мин',
  '80 мин',
  '90 мин'
];

// --- Константы для блока шагов ---
const STEPS_OPTIONS = [
  { minutes: 20, steps: 2300, label: "20 минут ≈ 2 300 шагов" },
  { minutes: 30, steps: 3500, label: "30 минут ≈ 3 500 шагов" },
  { minutes: 40, steps: 4600, label: "40 минут ≈ 4 600 шагов" },
  { minutes: 50, steps: 5800, label: "50 минут ≈ 5 800 шагов" },
  { minutes: 60, steps: 7000, label: "60 минут ≈ 7 000 шагов" },
  { minutes: 70, steps: 8120, label: "70 минут ≈ 8 120 шагов" },
  { minutes: 80, steps: 9280, label: "80 минут ≈ 9 280 шагов" },
  { minutes: 90, steps: 10440, label: "90 минут ≈ 10 440 шагов ✅" }
];
const GOAL_STEPS = 10000;
const GOAL_MINUTES = 90;


// --- Функция для обработки выбора шагов ---
function handleStepsSelection(minutes, setWalkingMinutes, setStepsStatus) {
  const selectedOption = STEPS_OPTIONS.find(opt => opt.minutes === minutes);
  if (selectedOption) {
    setWalkingMinutes(minutes);
    setStepsStatus(selectedOption.steps >= GOAL_STEPS);
  }
}


// --- Мотивационные цитаты от Дианы ---
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

// --- Стили компонентов ---
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
  gap: 8,
  lineHeight: 1.2
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


// --- Стили для спиннера (минимальный пример) ---
const spinnerStyles = `
@keyframes spinner-rotate { 100% { transform: rotate(360deg); } }
.diana-spinner { width: 32px; height: 32px; border: 4px solid #e0e7ff; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spinner-rotate 1s linear infinite; margin: 0 auto; }
`;
if (typeof document !== 'undefined' && !document.querySelector('#spinner-styles')) {
  const style = document.createElement('style');
  style.id = 'spinner-styles';
  style.textContent = spinnerStyles;
  document.head.appendChild(style);
}




export default function TodayBlock({ day, answers, onBackToWeek, programId, isPremium, activatePremium, setIsPaymentShown, setShowPayment, userAvatar, onProfileClick }) {
  // --- Проверяем, начинается ли программа сегодня или позже ---
  const programStartsLater = answers && answers.start_date && new Date(answers.start_date) > new Date();
  // --- Все useState в начале компонента ---
  const [showCongrats, setShowCongrats] = useState(false);
  const [personalPlan, setPersonalPlan] = useState(null);
  const [showCongratsMeals, setShowCongratsMeals] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [showDianaChat, setShowDianaChat] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonModalData, setReasonModalData] = useState({ type: '', index: -1, itemName: '' });
  const [exerciseReasons, setExerciseReasons] = useState({});
  const [mealReasons, setMealReasons] = useState({});
  const [aiMeals, setAiMeals] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [selectedMealOptionIdx, setSelectedMealOptionIdx] = useState(() => Array.isArray(aiMeals) ? aiMeals.map(() => 0) : []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [completedMeals, setCompletedMeals] = useState([]);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [walkingMinutes, setWalkingMinutes] = useState(null);
  const [stepsStatus, setStepsStatus] = useState(null);
  const [stepsFixed, setStepsFixed] = useState(false);
  const [openContainers, setOpenContainers] = useState(() => {
    const saved = window.sessionStorage.getItem('diana_today_open');
    const defaultState = { training: false, nutrition: false, steps: true, motivation: true };
    return saved ? JSON.parse(saved) : defaultState;
  });

  // --- Теперь можно использовать хуки и переменные ниже ---

  // Проверка: все упражнения выполнены
  const currentDay = day || personalPlan || {
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
  };

  useEffect(() => {
    if (
      currentDay?.workout?.exercises?.length > 0 &&
      completedExercises.length === currentDay.workout.exercises.length &&
      completedExercises.every(v => v === true)
    ) {
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 4000);
    }
  }, [completedExercises, currentDay?.workout?.exercises?.length]);

  // Проверка: все приемы пищи выполнены
  useEffect(() => {
    if (
      currentDay?.meals?.length > 0 &&
      completedMeals.length === currentDay.meals.length &&
      completedMeals.every(v => v === true)
    ) {
      setShowCongratsMeals(true);
      setTimeout(() => setShowCongratsMeals(false), 4000);
    }
  }, [completedMeals, currentDay?.meals?.length]);

  // Логируем весь пропс day для анализа структуры
  console.log('🎯 TodayBlock получил day:', {
    dayExists: !!day,
    dayIsNull: day === null,
    dayIsUndefined: day === undefined,
    dayType: typeof day,
    dayKeys: day ? Object.keys(day) : [],
    dayDate: day?.date,
    dayTitle: day?.title,
    isWorkoutDay: day?.isWorkoutDay,
    hasWorkout: !!day?.workout,
    workoutTitle: day?.workout?.title,
    workoutLocation: day?.workout?.location,
    workoutDuration: day?.workout?.duration,
    hasExercises: !!day?.workout?.exercises,
    exercisesLength: day?.workout?.exercises?.length || 0,
    exercisesArray: day?.workout?.exercises,
    hasCompletedExercises: !!day?.completedExercises,
    completedExercisesLength: day?.completedExercises?.length || 0,
    fullDay: day
  });

  // Состояние для сворачивания/разворачивания контейнеров
  const defaultState = {
    training: false,
    nutrition: false,
    steps: true,
    motivation: true
  };

  // Функция для переключения состояния контейнера
  const toggleContainer = (containerKey) => {
    setOpenContainers(prev => {
      const updated = { ...prev, [containerKey]: !prev[containerKey] };
      window.sessionStorage.setItem('diana_today_open', JSON.stringify(updated));
      return updated;
    });
  };




  // Синхронизация длины completedMeals с aiMeals (без сброса отмеченных значений)
  // --- Подгружаем сохранённые шаги из currentDay (если есть) ---
  useEffect(() => {
    console.log('🚶 Отладка шагов в currentDay:', {
      currentDay: currentDay,
      dailySteps: currentDay?.dailySteps,
      dailyStepsMinutes: currentDay?.dailyStepsMinutes,
      walkingMinutes: currentDay?.walkingMinutes,
      stepsCompleted: currentDay?.stepsCompleted,
      allKeys: currentDay ? Object.keys(currentDay) : [],
      hasStepsData: !!(currentDay?.dailySteps || currentDay?.dailyStepsMinutes || currentDay?.walkingMinutes)
    });
    
    if (currentDay && (currentDay.dailySteps || currentDay.dailyStepsMinutes || currentDay.walkingMinutes)) {
      // Если есть сохранённые шаги (в шагах или минутах)
      let minutes = null;
      if (currentDay.dailyStepsMinutes) {
        minutes = currentDay.dailyStepsMinutes;
      } else if (currentDay.walkingMinutes) {
        minutes = currentDay.walkingMinutes;
      } else if (currentDay.dailySteps) {
        // Находим ближайший вариант по количеству шагов
        const found = STEPS_OPTIONS.find(opt => Math.abs(opt.steps - currentDay.dailySteps) < 500);
        if (found) minutes = found.minutes;
      }
      if (minutes) {
        console.log('🚶 Устанавливаем шаги из данных:', { minutes, stepsFixed: true });
        setWalkingMinutes(minutes);
        setStepsFixed(true);
        setStepsStatus(STEPS_OPTIONS.find(opt => opt.minutes === minutes)?.steps >= GOAL_STEPS);
      }
    }
  }, [currentDay]);

  useEffect(() => {
    if (Array.isArray(aiMeals)) {
      if (completedMeals.length !== aiMeals.length) {
        // Только если длина изменилась, пересчитываем массив (например, если вдруг добавили/убрали приём пищи)
        setCompletedMeals(aiMeals.map((_, i) => completedMeals[i] ?? null));
      }
      // Если длина совпадает — ничего не делаем, completedMeals сохраняется
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
      currentCompletedMeals: completedMeals,
      isLoaded: isLoaded,
      dayProp: !!day,
      personalPlan: !!personalPlan,
      currentDaySource: day ? 'day prop' : personalPlan ? 'personalPlan' : 'mock'
    });

    // ИСПРАВЛЕНО: НЕ используем статусы из currentDay, только структуру
    // Статусы должны загружаться только с сервера через fetchDayStatus
    if (currentDay.workout?.exercises) {
      const newExerciseStates = currentDay.workout.exercises.map(() => null);
      console.log('🏋️ Инициализируем упражнения:', newExerciseStates);
      // Сравниваем массивы перед обновлением
      const isSame =
        completedExercises.length === newExerciseStates.length &&
        completedExercises.every((v, i) => v === newExerciseStates[i]);
      if (!isSame && !isLoaded) {
        console.log('🔄 Обновляем completedExercises на null (не загружено)');
        // Инициализируем null значениями только если данные еще не загружены
        setCompletedExercises(newExerciseStates);
      } else if (isLoaded) {
        console.log('✅ Данные уже загружены с сервера, не обновляем');
      }
    } else {
      if (completedExercises.length !== 0) {
        setCompletedExercises([]);
      }
    }

    if (currentDay.meals) {
      const newMealStates = currentDay.meals.map(() => null);
      console.log('🍽️ Инициализируем питание:', newMealStates);
      // Сравниваем массивы перед обновлением
      const isSame =
        completedMeals.length === newMealStates.length &&
        completedMeals.every((v, i) => v === newMealStates[i]);
      if (!isSame && !isLoaded) {
        console.log('🔄 Обновляем completedMeals на null (не загружено)');
        // Инициализируем null значениями только если данные еще не загружены
        setCompletedMeals(newMealStates);
      } else if (isLoaded) {
        console.log('✅ Данные уже загружены с сервера, не обновляем');
      }
    } else {
      if (completedMeals.length !== 0) {
        setCompletedMeals([]);
      }
    }
  }, [currentDay, isLoaded]);
  // Определяем, запущено ли на мобильном устройстве
  const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasTelegramWebApp = window.Telegram?.WebApp;
  
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Получаем случайную мотивационную цитату
  const todayQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  // Проверка разрешений при загрузке компонента
  useEffect(() => {
  }, []);

  // Проверка существующих разрешений

  // ...existing code...
  // вычисления оформления блока шагов (после STEPS_OPTIONS)
  let stepsBlockColor = '#ef4444'; // красный
  let stepsBlockBg = 'linear-gradient(90deg, #fee2e2 0%, #fca5a5 100%)';
  let stepsBlockBorder = '2px solid #ef4444';
  let stepsBlockEmoji = '😕';
  let stepsBlockStatus = 'Мало шагов';
  let stepsBlockSteps = 0;
  const selectedStepsOption = STEPS_OPTIONS.find(opt => opt.minutes === walkingMinutes);
  stepsBlockSteps = selectedStepsOption?.steps || 0;
  if (stepsBlockSteps >= GOAL_STEPS) {
    stepsBlockColor = '#22c55e';
    stepsBlockBg = 'linear-gradient(90deg, #e0f7fa 0%, #bbf7d0 100%)';
    stepsBlockBorder = '2px solid #22c55e';
    stepsBlockEmoji = '🎉';
    stepsBlockStatus = '✔ Выполнено!';
  } else if (stepsBlockSteps >= GOAL_STEPS * 0.7) {
    stepsBlockColor = '#eab308';
    stepsBlockBg = 'linear-gradient(90deg, #fef9c3 0%, #fde68a 100%)';
    stepsBlockBorder = '2px solid #eab308';
    stepsBlockEmoji = '🙂';
    stepsBlockStatus = 'Почти норма';
  }

  // --- Вынести функцию загрузки AI-питания наружу ---
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

  // useEffect для первичной загрузки
  useEffect(() => {
    fetchAIMealPlan();
    // eslint-disable-next-line
  }, [answers]);

  // КНОПКА ОБНОВЛЕНИЯ ВАРИАНТОВ ПИТАНИЯ
  const handleRefreshMeals = () => {
    fetchAIMealPlan();
    // setCompletedMeals([]); // Убрано: не сбрасываем статусы
    setSelectedMealOptionIdx([]); // Сбросить выбранные варианты
  };

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
    console.log(`[EXERCISE TRACKING] Упражнение ${idx}: ${completed ? 'выполнено' : 'не выполнено'}`);
    
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
    
    if (answers?.userId) {
      try {
        const tasksData = buildTasks();
        console.log(`[EXERCISE TRACKING] Отправляем данные на сервер:`, {
          userId: answers.userId,
          date: currentDay.date,
          tasks: tasksData
        });
        
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: answers.userId,
            date: currentDay.date,
            tasks: tasksData
          })
        });
        console.log('✅ Статус упражнения обновлен на сервере:', { idx, completed });
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
    
    if (answers?.userId) {
      try {
        const payload = {
          userId: answers.userId,
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
    console.log(`[MEAL TRACKING] Прием пищи ${idx}: ${completed ? 'выполнен' : 'не выполнен'}`);
    
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
    if (answers?.userId) {
      try {
        const tasksData = buildTasksWithMeals(updated);
        console.log(`[MEAL TRACKING] Отправляем данные на сервер:`, {
          userId: answers.userId,
          date: currentDay.date,
          tasks: tasksData
        });
        
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: answers.userId,
            date: currentDay.date,
            tasks: tasksData
          })
        });
        console.log('✅ Статус приема пищи обновлен на сервере:', { idx, completed });
      } catch (error) {
        console.error('❌ Ошибка обновления статуса приема пищи:', error);
      }
    }
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

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const completionPercentage = calculateDayCompletionPercentage();

  // (Удалено сохранение статистики в localStorage)

  // Отладочный useEffect для мониторинга изменений в массивах статусов
  useEffect(() => {
    console.log('🔍 СОСТОЯНИЕ completedExercises изменилось:', {
      length: completedExercises.length,
      values: completedExercises,
      types: completedExercises.map((val, i) => `[${i}]: ${val} (${typeof val})`),
      isLoaded: isLoaded
    });
  }, [completedExercises]);

  useEffect(() => {
    console.log('🔍 СОСТОЯНИЕ completedMeals изменилось:', {
      length: completedMeals.length,
      values: completedMeals,
      types: completedMeals.map((val, i) => `[${i}]: ${val} (${typeof val})`),
      isLoaded: isLoaded
    });
  }, [completedMeals]);

  // Отслеживание изменений шагов
  useEffect(() => {
    console.log('🔍 СОСТОЯНИЕ шагов изменилось:', {
      walkingMinutes,
      stepsStatus,
      isLoaded
    });
  }, [walkingMinutes, stepsStatus]);

  // Функция для загрузки статусов выполнения дня с backend
  const fetchDayStatus = async () => {
    if (!answers?.userId || !currentDay?.date) {
      console.log('⚠️ Пропускаем загрузку статусов:', { userId: answers?.userId, date: currentDay?.date });
      setIsInitialLoading(false); // Устанавливаем флаг даже если нет userId
      return;
    }
    
    try {
      console.log('🔄 Загружаем статусы дня:', { userId: answers.userId, date: currentDay.date });
      const res = await fetch(`${API_URL}/api/progress?userId=${answers.userId}&date=${currentDay.date}`);
      const data = await res.json();
      
      console.log('📥 Получены данные с сервера:', data);
      
      if (data && (Array.isArray(data.tasks) || data.completedMealsArr || data.completedExercises)) {
        // Если tasks есть — используем их для tasks-based UI
        if (Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          console.log('📝 Обрабатываем tasks:', data.tasks);
          // Парсим задачи для восстановления статусов и причин
          const mealStates = [];
          const mealReasonsObj = {};
          const exerciseStates = [];
          const exerciseReasonsObj = {};
          data.tasks.forEach((task, idx) => {
            if (task.type === 'meal') {
              mealStates.push(task.done === true ? true : task.done === false ? false : null);
              if (task.reason) mealReasonsObj[mealStates.length - 1] = task.reason;
            } else if (task.type === 'workout') {
              exerciseStates.push(task.done === true ? true : task.done === false ? false : null);
              if (task.reason) exerciseReasonsObj[exerciseStates.length - 1] = task.reason;
            } else if (task.type === 'steps') {
              // Восстанавливаем данные о шагах
              if (task.walking_minutes) {
                setWalkingMinutes(task.walking_minutes);
                setStepsStatus(task.done);
                setStepsFixed(true); // ВАЖНО: устанавливаем фиксацию, чтобы показывалась плашка, а не колесо
                console.log('🚶 Восстановлены данные о шагах:', { minutes: task.walking_minutes, done: task.done, fixed: true });
              }
            }
          });
          
          console.log('🍽️ Восстановленные состояния питания:', mealStates);
          console.log('🏋️ Восстановленные состояния упражнений:', exerciseStates);
          
          if (mealStates.length) {
            // Приводим все значения к null, true, false (false только если явно выбран "не съел")
            const finalMealStates = mealStates.map(v => v === true ? true : v === false ? false : null);
            console.log('🍽️ Устанавливаем finalMealStates:', finalMealStates);
            setCompletedMeals(finalMealStates);
          }
          if (Object.keys(mealReasonsObj).length) setMealReasons(mealReasonsObj);
          if (exerciseStates.length) {
            console.log('🏋️ Устанавливаем exerciseStates:', exerciseStates);
            setCompletedExercises(exerciseStates);
          }
          if (Object.keys(exerciseReasonsObj).length) setExerciseReasons(exerciseReasonsObj);
        }
        // Для обратной совместимости:
        if (data.completedMealsArr) {
          console.log('🍽️ Устанавливаем completedMealsArr:', data.completedMealsArr);
          const finalMealStates = data.completedMealsArr.map(v => v === true ? true : v === false ? false : null);
          console.log('🍽️ Финальные состояния питания:', finalMealStates);
          setCompletedMeals(finalMealStates);
        }
        if (data.completedExercises) {
          console.log('🏋️ Устанавливаем completedExercises:', data.completedExercises);
          setCompletedExercises(data.completedExercises);
        }
      } else {
        console.log('📭 Нет данных с сервера, используем null значения');
      }
      
      setIsInitialLoading(false); // Завершаем первоначальную загрузку
      setIsLoaded(true); // Помечаем, что данные загружены с сервера
      console.log('✅ Статусы дня загружены успешно, isLoaded = true');
      
    } catch (e) {
      console.error('❌ Ошибка загрузки статусов дня:', e);
      setIsInitialLoading(false); // Завершаем загрузку даже при ошибке
      setIsLoaded(true); // Помечаем как загружено даже при ошибке
    }
  };

  // Загружаем статусы при смене дня
  useEffect(() => {
    setIsInitialLoading(true); // Сбрасываем флаг при смене дня
    setIsLoaded(false); // Сбрасываем флаг загрузки
    fetchDayStatus();
    // eslint-disable-next-line
  }, [currentDay?.date, answers?.userId]);

  // Принудительная перезагрузка при первом монтировании
  useEffect(() => {
    // Принудительно перезагружаем данные при первом запуске
    if (answers?.userId && currentDay?.date) {
      console.log('🔄 ПРИНУДИТЕЛЬНАЯ перезагрузка данных при монтировании');
      setIsInitialLoading(true);
      fetchDayStatus();
    }
  }, []);

  // Унификация userId: Telegram ID в проде, demo_user_local_test локально
  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      if (answers && !answers.userId) {
        answers.userId = window.Telegram.WebApp.initDataUnsafe.user.id;
        console.log('✅ Telegram userId установлен в answers:', answers.userId);
      }
    } else {
      if (answers && !answers.userId) {
        answers.userId = 'demo_user_local_test';
        console.log('✅ demo_user_local_test установлен в answers (локально):', answers.userId);
      }
    }
  }, [answers]);

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
    // Не отправляем данные, пока не завершена первоначальная загрузка
    if (isInitialLoading) {
      console.log('⏳ Пропускаем синхронизацию - идет первоначальная загрузка');
      return;
    }
    
    if (!answers?.userId || !currentDay?.date) return;
    
    console.log('🔄 Синхронизируем прогресс с сервером:', {
      completedMeals,
      completedExercises,
      userId: answers.userId,
      date: currentDay.date
    });
    
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
        console.log('✅ Прогресс синхронизирован с сервером:', data);
      })
      .catch(e => {
        console.error('❌ Ошибка синхронизации прогресса:', e);
      });
  }, [completedExercises, completedMeals, walkingMinutes, stepsStatus, answers?.userId, currentDay?.date, isInitialLoading]);

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
      
      // ИСПРАВЛЕНО: загружаем только с сервера, не используем localStorage
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

  // Очищаем устаревшие данные программы из localStorage при загрузке
  useEffect(() => {
    // Удаляем все программы из localStorage, чтобы загрузить свежие данные с сервера
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('program_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log('🗑️ Удаляем устаревшую программу из localStorage:', key);
      localStorage.removeItem(key);
    });
    
    // Также очищаем все данные пользователя, чтобы заставить перезагрузку
    const userKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('user_') || key.includes('demo_'))) {
        userKeysToRemove.push(key);
      }
    }
    userKeysToRemove.forEach(key => {
      console.log('🗑️ Удаляем устаревшие данные пользователя из localStorage:', key);
      localStorage.removeItem(key);
    });
  }, []);

  // Формируем массив задач для отправки
  function buildTasks() {
    const tasks = [];
    // Упражнения
    if (currentDay.workout?.exercises) {
      currentDay.workout.exercises.forEach((ex, i) => {
        tasks.push({
          name: ex.name,
          type: 'workout',
          done: completedExercises[i] === null ? null : completedExercises[i] === true, // сохраняем null
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
          done: completedMeals[i] === null ? null : completedMeals[i] === true, // сохраняем null
          reason: completedMeals[i] === false && mealReasons[i] ? mealReasons[i] : undefined
        });
      });
    }
    // Шаги
    if (walkingMinutes !== null) {
      const selectedOption = STEPS_OPTIONS.find(opt => opt.minutes === walkingMinutes);
      tasks.push({
        name: 'Шаги',
        type: 'steps',
        done: stepsStatus,
        walking_minutes: walkingMinutes,
        steps_estimated: selectedOption ? selectedOption.steps : 0,
        goal: GOAL_STEPS,
        status: selectedOption && selectedOption.steps >= GOAL_STEPS ? 'complete' : 'partial'
      });
    }
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
          done: completedExercises[i] === null ? null : completedExercises[i] === true, // сохраняем null
          reason: completedExercises[i] === false && exerciseReasons[i] ? exerciseReasons[i] : undefined
        });
      });
    }
    if (currentDay.meals) {
      currentDay.meals.forEach((m, i) => {
        tasks.push({
          name: m.type || m.name,
          type: 'meal',
          done: mealsArr[i] === null ? null : mealsArr[i] === true, // сохраняем null
          reason: mealsArr[i] === false && mealReasons[i] ? mealReasons[i] : undefined
        });
      });
    }
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
          done: customExercises[i] === null ? null : customExercises[i] === true, // сохраняем null
          reason: customExercises[i] === false && customReasons[i] ? customReasons[i] : undefined
        });
      });
    }
    if (Array.isArray(aiMeals) && aiMeals.length > 0) {
      aiMeals.forEach((m, i) => {
        tasks.push({
          name: m.type || m.name,
          type: 'meal',
          done: completedMeals[i] === null ? null : completedMeals[i] === true, // сохраняем null
          reason: completedMeals[i] === false && mealReasons[i] ? mealReasons[i] : undefined
        });
      });
    }
    return tasks;
  }

  // ОТКЛЮЧЕНО: Автоматическое сохранение задач при каждом изменении
  // Причина: может затирать расписание недели при частых обновлениях
  // Сохранение происходит при явных действиях пользователя в других местах кода

  // --- КРАСИВАЯ КНОПКА ОБНОВЛЕНИЯ ВАРИАНТОВ ПИТАНИЯ (UI)
  const refreshMealsButton = (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
      <button
        onClick={async () => {
          await handleRefreshMeals();
          setSelectedMealOptionIdx([]); // Сбросить выбранные варианты
        }}
        style={{
          padding: '14px 32px',
          borderRadius: '18px',
          background: 'linear-gradient(90deg, #2196f3 0%, #00c6ff 100%)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '18px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(33,150,243,0.12)',
          transition: 'all 0.2s',
          letterSpacing: '0.5px',
          outline: 'none',
          position: 'relative',
          zIndex: 2
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.04)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(33,150,243,0.18)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(33,150,243,0.12)';
        }}
      >
        🔄 Обновить варианты питания
      </button>
    </div>
  );

  return (
    <div
      className="slide-up-appear"
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
      {/* Фейерверк и поздравление при выполнении всех упражнений */}
      {showCongrats && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 2100,
            pointerEvents: 'none',
          }}>
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              numberOfPieces={350}
              recycle={false}
              key={showCongrats ? 'exercises-confetti' : 'none'}
              style={{ zIndex: 2101, pointerEvents: 'none' }}
            />
          </div>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 2200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            background: 'rgba(255,255,255,0.0)',
            transition: 'background 0.4s',
          }}>
            <div style={{
              minWidth: 320,
              maxWidth: '90vw',
              background: 'rgba(255,255,255,0.97)',
              borderRadius: 24,
              boxShadow: '0 8px 32px rgba(34,197,94,0.18), 0 2px 8px rgba(0,0,0,0.08)',
              padding: '36px 32px 28px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'congrats-pop 0.6s cubic-bezier(.68,-0.55,.27,1.55)',
              fontSize: 26,
              fontWeight: 700,
              color: '#22c55e',
              textAlign: 'center',
              pointerEvents: 'auto',
              border: '2px solid #bbf7d0',
              textShadow: '0 2px 8px #fff',
            }}>
              <span style={{fontSize: 48, display: 'block', marginBottom: 8}}>🎉</span>
              <span>Поздравляем!<br/>Все упражнения на сегодня выполнены!</span>
            </div>
            <style>{`
              @keyframes congrats-pop {
                0% { transform: scale(0.7) translateY(40px); opacity: 0; }
                60% { transform: scale(1.08) translateY(-8px); opacity: 1; }
                80% { transform: scale(0.97) translateY(0); }
                100% { transform: scale(1) translateY(0); opacity: 1; }
              }
            `}</style>
          </div>
        </>
      )}
      {showCongratsMeals && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 2100,
            pointerEvents: 'none',
          }}>
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              numberOfPieces={350}
              recycle={false}
              key={showCongratsMeals ? 'meals-confetti' : 'none'}
              style={{ zIndex: 2101, pointerEvents: 'none' }}
            />
          </div>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 2200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            background: 'rgba(255,255,255,0.0)',
            transition: 'background 0.4s',
          }}>
            <div style={{
              minWidth: 320,
              maxWidth: '90vw',
              background: 'rgba(255,255,255,0.97)',
              borderRadius: 24,
              boxShadow: '0 8px 32px rgba(59,130,246,0.18), 0 2px 8px rgba(0,0,0,0.08)',
              padding: '36px 32px 28px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'congrats-pop 0.6s cubic-bezier(.68,-0.55,.27,1.55)',
              fontSize: 26,
              fontWeight: 700,
              color: '#3b82f6',
              textAlign: 'center',
              pointerEvents: 'auto',
              border: '2px solid #bae6fd',
              textShadow: '0 2px 8px #fff',
            }}>
              <span style={{fontSize: 48, display: 'block', marginBottom: 8}}>🍽️</span>
              <span>Поздравляем!<br/>Все приемы пищи на сегодня выполнены!</span>
            </div>
            <style>{`
              @keyframes congrats-pop {
                0% { transform: scale(0.7) translateY(40px); opacity: 0; }
                60% { transform: scale(1.08) translateY(-8px); opacity: 1; }
                80% { transform: scale(0.97) translateY(0); }
                100% { transform: scale(1) translateY(0); opacity: 1; }
              }
            `}</style>
          </div>
        </>
      )}
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

      {/* Мотивация дня */}
      <div style={{ 
        padding: '0 20px', 
        maxWidth: 480, 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          border: '1px solid #a5b4fc',
          marginBottom: 16
        }}>
          <div 
            style={{
              ...headerStyle,
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16
            }}
          >
            <span>💬 Мотивация</span>
          </div>
          <div style={{ textAlign: 'center' }}>
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

            {/* 2. Блок шагов */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <div
                style={{
                  ...headerStyle,
                  cursor: 'pointer',
                  userSelect: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: openContainers.steps ? 16 : 0
                }}
                onClick={() => toggleContainer('steps')}
              >
                <span>🚶 Шаги</span>
                <span style={{ fontSize: 20, lineHeight: 1.2, display: 'flex', alignItems: 'center' }}>
                  {openContainers.steps ? '▼' : '▶'}
                </span>
              </div>
              
              {openContainers.steps && (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ marginBottom: 8, fontSize: 14, color: '#3b82f6', fontWeight: 600 }}>
                    Рекомендуется: 90 минут (≈10 000 шагов)
                  </div>
                  {stepsFixed ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '8px 0',
                        fontSize: 16,
                        fontWeight: 600,
                        color: stepsBlockColor,
                        background: stepsBlockBg,
                        borderRadius: '14px',
                        boxShadow: '0 2px 8px rgba(34,197,94,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        border: stepsBlockBorder,
                        transition: 'all 0.2s',
                        flexWrap: 'nowrap',
                        gap: 0,
                      }}
                    >
                      <span style={{ fontSize: 26, marginRight: 12, marginLeft: 8 }}>{stepsBlockEmoji}</span>
                      <span style={{ display: 'inline-block' }}>
                        {walkingMinutes} мин ({stepsBlockSteps.toLocaleString()} шагов)
                      </span>
                      <button
                        style={{
                          marginLeft: 18,
                          marginRight: 12,
                          padding: '8px 22px',
                          borderRadius: '12px',
                          background: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '15px',
                          fontFamily: 'Inter, Arial, sans-serif',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.10)',
                          transition: 'all 0.2s',
                          outline: 'none',
                          letterSpacing: '0.5px',
                        }}
                        onClick={() => setStepsFixed(false)}
                      >
                        Изменить
                      </button>
                    </div>
                  ) : (
                    <>
                      <WheelPicker
                        value={walkingMinutes ?? 30}
                        onChange={(minutes) => handleStepsSelection(minutes, setWalkingMinutes, setStepsStatus)}
                        min={20}
                        max={90}
                        years={stepMinutesArr}
                        labels={stepLabels}
                      />
                      <div style={{ marginTop: 12, fontSize: 15 }}>
                        {walkingMinutes ? `Ты выбрал: ${walkingMinutes} мин (${STEPS_OPTIONS.find(opt => opt.minutes === walkingMinutes)?.steps.toLocaleString()} шагов)` : 'Выбери количество минут'}
                      </div>
                      <button
                        style={{
                          marginTop: 16,
                          padding: '12px 32px',
                          borderRadius: '16px',
                          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '16px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.12)',
                          transition: 'all 0.2s',
                          outline: 'none',
                        }}
                        onClick={async () => {
                          // Сохраняем выбранное время ходьбы в план и отправляем в бэкап
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
                              setStepsFixed(true);
                            } catch (error) {
                              console.error('❌ Ошибка сохранения шагов:', error);
                            }
                          }
                        }}
                      >
                        Выбрать
                      </button>
                    </>
                  )}
                  <div style={{ marginTop: 8, fontSize: 14, color: walkingMinutes && STEPS_OPTIONS.find(opt => opt.minutes === walkingMinutes)?.steps >= GOAL_STEPS ? '#22c55e' : '#eab308' }}>
                    {walkingMinutes && STEPS_OPTIONS.find(opt => opt.minutes === walkingMinutes)?.steps >= GOAL_STEPS ? '✅ Цель по шагам достигнута!' : 'Для активации жиросжигания важно поддерживать общую подвижность в течение дня.'}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Блок тренировки */}
            <div style={cardStyle}>
              <div 
                style={{
                  ...headerStyle,
                  cursor: 'pointer',
                  userSelect: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: openContainers.training ? 16 : 0
                }}
                onClick={() => toggleContainer('training')}
              >
                <span>🏋️‍♀️ Тренировка</span>
                <span style={{ fontSize: 20, lineHeight: 1.2, display: 'flex', alignItems: 'center' }}>
                  {openContainers.training ? '▼' : '▶'}
                </span>
              </div>
              
              {openContainers.training && (
                <>
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
                        
                        // Создаем видео компонент без постера, чтобы показывался первый кадр
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
                </>
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
              <div style={cardStyle}>
                <div 
                  style={{
                    ...headerStyle,
                    cursor: 'pointer',
                    userSelect: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: openContainers.nutrition ? 16 : 0
                  }}
                  onClick={() => toggleContainer('nutrition')}
                >
                  <span>🍽️ Питание</span>
                  <span style={{ fontSize: 20, lineHeight: 1.2, display: 'flex', alignItems: 'center' }}>
                    {openContainers.nutrition ? '▼' : '▶'}
                  </span>
                </div>
                
                {openContainers.nutrition && (
                  <>
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
                        <div key={meal.type + idx}>
                          <MealCard
                            meal={meal}
                            index={idx}
                            isCompleted={(() => {
                              const value = completedMeals[idx] ?? null;
                              console.log(`🍽️ Передаем в MealCard[${idx}]: исходное=${completedMeals[idx]}, обработанное=${value}, typeof=${typeof value}, completedMeals.length=${completedMeals.length}`);
                              return value;
                            })()}
                            onStatusChange={handleMealStatusChange}
                            style={{ marginBottom: 18 }}
                            selectedIdx={selectedIdx}
                            setSelectedIdx={setIdx}
                            reason={mealReasons[idx]}
                          />
                        </div>
                      );
                    })}
                    {/* Кнопка обновления вариантов питания */}
                    {refreshMealsButton}
                  </>
                )}
              </div>
            )}

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
          activatePremium={activatePremium}
          setShowPayment={setShowPayment}
        />
      )}
      
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
