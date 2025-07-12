import React, { useState, useEffect } from 'react';
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
  const [openContainers, setOpenContainers] = useState({
    training: true,
    nutrition: true,
    motivation: true
  });

  // Функция для переключения состояния контейнера
  const toggleContainer = (containerKey) => {
    setOpenContainers(prev => ({
      ...prev,
      [containerKey]: !prev[containerKey]
    }));
  };

  // Состояние для персонального плана
  const [personalPlan, setPersonalPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  
  // Состояние для чата с Дианой
  const [showDianaChat, setShowDianaChat] = useState(false);
  

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
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Новый флаг для первоначальной загрузки
  // Массив задач (только реальные статусы)
  const [tasks, setTasks] = useState([]);

  // --- СТАТУСЫ ПРИЕМОВ ПИЩИ ---
  const [completedMeals, setCompletedMeals] = useState([]);

  // Используем персональный план если он есть, иначе переданный день или мок
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
  
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Получаем случайную мотивационную цитату
  const todayQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  // Проверка разрешений при загрузке компонента
  useEffect(() => {
  }, []);

  // Проверка существующих разрешений

  // ...existing code...

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
  }, [completedExercises, completedMeals, exerciseReasons, mealReasons, completionPercentage]);

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
    if (!answers?.userId || !currentDay?.date) {
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
            }
          });
          
          console.log('🍽️ Восстановленные состояния питания:', mealStates);
          console.log('🏋️ Восстановленные состояния упражнений:', exerciseStates);
          
          if (mealStates.length) setCompletedMeals(mealStates);
          if (Object.keys(mealReasonsObj).length) setMealReasons(mealReasonsObj);
          if (exerciseStates.length) setCompletedExercises(exerciseStates);
          if (Object.keys(exerciseReasonsObj).length) setExerciseReasons(exerciseReasonsObj);
        }
        // Для обратной совместимости:
        if (data.completedMealsArr) {
          console.log('🍽️ Устанавливаем completedMealsArr:', data.completedMealsArr);
          setCompletedMeals(data.completedMealsArr);
        }
        if (data.completedExercises) {
          console.log('🏋️ Устанавливаем completedExercises:', data.completedExercises);
          setCompletedExercises(data.completedExercises);
        }
      }
      
      setIsInitialLoading(false); // Завершаем первоначальную загрузку
      console.log('✅ Статусы дня загружены успешно');
      
    } catch (e) {
      console.error('❌ Ошибка загрузки статусов дня:', e);
      setIsInitialLoading(false); // Завершаем загрузку даже при ошибке
    }
  };

  // Загружаем статусы при смене дня
  useEffect(() => {
    setIsInitialLoading(true); // Сбрасываем флаг при смене дня
    fetchDayStatus();
    // eslint-disable-next-line
  }, [currentDay?.date, answers?.userId]);

  // Гарантируем, что answers.userId всегда Telegram userId
  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      if (answers && !answers.userId) {
        answers.userId = window.Telegram.WebApp.initDataUnsafe.user.id;
        console.log('✅ Telegram userId установлен в answers:', answers.userId);
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
  }, [completedExercises, completedMeals, answers?.userId, currentDay?.date, isInitialLoading]);

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
          console.log(' Проверка упражнений в плане:', todayPlan.workout?.exercises);
          setPersonalPlan(todayPlan);
          setLoadingPlan(false);
          return;
        } else {
          // Если сегодняшний день не найден, берем первый день программы
          const firstDay = program.days[0];
          if (firstDay) {
            console.log('📅 Сегодняшний день не найден, используем первый день программы:', firstDay);
            console.log('🎥 Проверка упражнений в первом дне:', firstDay.workout?.exercises);
            setPersonalPlan(firstDay);
            setLoadingPlan(false);
            return;
          }
        }
      }
      // Если не нашли в localStorage, пробуем обратиться к серверу
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
  }, [isLoaded, completedExercises, completedMeals, exerciseReasons, mealReasons, currentDay?.date, answers?.userId]);

  // --- КРАСИВАЯ КНОПКА ОБНОВЛЕНИЯ ВАРИАНТОВ ПИТАНИЯ (UI)
  const refreshMealsButton = (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
      <button
        onClick={async () => {
          await handleRefreshMeals();
          setCompletedMeals([]); // Явно сбрасываем статусы выбора
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

            {/* 3. Блок тренировки */}
            <div style={cardStyle}>
              <div 
                style={{
                  ...headerStyle,
                  cursor: 'pointer',
                  userSelect: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => toggleContainer('training')}
              >
                <span>🏋️‍♀️ Тренировка</span>
                <span style={{ fontSize: 14 }}>
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
                    alignItems: 'center'
                  }}
                  onClick={() => toggleContainer('nutrition')}
                >
                  <span>🍽️ Питание</span>
                  <span style={{ fontSize: 14 }}>
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
                            isCompleted={completedMeals[idx] ?? null}
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

            {/* 5. Мотивация дня */}
            <div style={{
              ...cardStyle,
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              border: '1px solid #a5b4fc',
              marginBottom: 24
            }}>
              <div 
                style={{
                  ...headerStyle,
                  cursor: 'pointer',
                  userSelect: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: openContainers.motivation ? 16 : 0
                }}
                onClick={() => toggleContainer('motivation')}
              >
                <span>💬 Мотивация</span>
                <span style={{ fontSize: 14 }}>
                  {openContainers.motivation ? '▼' : '▶'}
                </span>
              </div>
              
              {openContainers.motivation && (
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
              )}
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
