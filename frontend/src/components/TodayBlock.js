
import React, { useState, useEffect, useRef } from 'react';
import '../styles/animations.css';
import Confetti from 'react-confetti';
import CongratsModal from './CongratsModal';
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
  "Не нужно быть идеальным. Нужно быть стабильным. — Диана",
  "Каждый день — это новая возможность стать лучше. — Диана",
  "Твоё тело может. Твой разум сомневается. Слушай тело. — Диана",
  "Прогресс важнее совершенства. — Диана",
  "Твоя цель — не быть как все, а быть лучшей версией себя. — Диана",
  "Ты уже на шаг ближе к своей цели. Продолжай в том же духе! — Диана",
  "Маленькие победы складываются в большой результат. — Диана",
  "Не сдавайся, даже если сложно. Ты сильнее, чем думаешь! — Диана",
  "Каждый твой выбор — вклад в твоё здоровье. — Диана",
  "Сегодня — лучший день, чтобы стать лучше, чем вчера. — Диана",
  "Ты заслуживаешь заботы о себе. Начни с малого! — Диана",
  "Пусть твой прогресс вдохновляет тебя двигаться дальше. — Диана",
  "Ошибки — это опыт, а не повод останавливаться. — Диана",
  "Сделай сегодня то, за что завтра скажешь себе спасибо. — Диана",
  "Твоя энергия — твой главный ресурс. Береги и приумножай её! — Диана",
  "Не сравнивай себя с другими. Сравнивай себя с собой вчерашним. — Диана",
  "Ты способен на большее, чем думаешь. Просто начни! — Диана",
  "Пусть забота о себе станет твоей привычкой. — Диана",
  "Каждый день — это шанс стать лучше. Используй его! — Диана",
  "Твои усилия важны. Даже если их не видно сразу. — Диана",
  "Доверяй процессу. Результат обязательно придёт. — Диана",
  "Ты — главный герой своей истории. Пиши её с любовью! — Диана",
  "Сделай паузу, вдохни глубже и продолжай путь. — Диана",
  "Твоя цель — не идеал, а стабильность и забота о себе. — Диана",
  "Ты уже молодец, что выбрал путь перемен! — Диана"
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
  // --- Поздравление: просто useState ---
  const [showCongrats, setShowCongrats] = useState(false);
  const [showCongratsMeals, setShowCongratsMeals] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  // --- Поздравление: просто useState ---

  // Рефы для автоскролла к модалке и поздравлению
  const reasonModalRef = useRef(null);
  const congratsRef = useRef(null);
  const congratsMealsRef = useRef(null);

  // Автоскролл к модалке и поздравлению

  useEffect(() => {
    if (showCongrats && congratsRef.current) {
      setTimeout(() => {
        congratsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [showCongrats]);

  useEffect(() => {
    if (showCongratsMeals && congratsMealsRef.current) {
      setTimeout(() => {
        congratsMealsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [showCongratsMeals]);
  // --- Поздравление: хранить факт показа в localStorage по дате ---
  // Для отслеживания перехода "не все выполнены" -> "все выполнены"
  const prevAllDone = useRef(false);
  // --- Проверяем, начинается ли программа сегодня или позже ---
  const programStartsLater = answers && answers.start_date && new Date(answers.start_date) > new Date();
  // --- Все useState в начале компонента ---
  // --- Поздравление: просто useState ---
  const prevExercisesRef = useRef([]);
  const prevMealsRef = useRef([]);
  const congratsShownRef = useRef(false);
  const [personalPlan, setPersonalPlan] = useState(null);
  const congratsMealsShownRef = useRef(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [showDianaChat, setShowDianaChat] = useState(false);
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


  // Проверка: все приемы пищи выполнены
  // (логика показа поздравления теперь только в handleMealStatusChange, как для упражнений)

  // ...лог day убран для чистоты консоли...

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
    // ...лог убран...
    
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
        // ...лог убран...
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
    // ...лог убран...

    // ИСПРАВЛЕНО: НЕ используем статусы из currentDay, только структуру
    // Статусы должны загружаться только с сервера через fetchDayStatus
    if (currentDay.workout?.exercises) {
      const newExerciseStates = currentDay.workout.exercises.map(() => null);
      // ...лог убран...
      // Сравниваем массивы перед обновлением
      const isSame =
        completedExercises.length === newExerciseStates.length &&
        completedExercises.every((v, i) => v === newExerciseStates[i]);
      if (!isSame && !isLoaded) {
        // ...лог убран...
        // Инициализируем null значениями только если данные еще не загружены
        setCompletedExercises(newExerciseStates);
      } else if (isLoaded) {
        // ...лог убран...
      }
    } else {
      if (completedExercises.length !== 0) {
        setCompletedExercises([]);
      }
    }

    if (currentDay.meals) {
      const newMealStates = currentDay.meals.map(() => null);
      // ...лог убран...
      // Сравниваем массивы перед обновлением
      const isSame =
        completedMeals.length === newMealStates.length &&
        completedMeals.every((v, i) => v === newMealStates[i]);
      if (!isSame && !isLoaded) {
        // ...лог убран...
        // Инициализируем null значениями только если данные еще не загружены
        setCompletedMeals(newMealStates);
      } else if (isLoaded) {
        // ...лог убран...
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
  
  // Получаем случайную мотивационную цитату только один раз при монтировании
  const [todayQuote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

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
      // ...лог убран...
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      // ...лог убран...
      const res = await fetch(`${API_URL}/api/ai-meal-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: answers })
      });
      // ...лог убран...
      const data = await res.json();
      // ...лог убран...
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
    // ...лог убран...
    const { type, index } = reasonModalData;
    
    if (type === 'workout') {
      // ...лог убран...
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
      // ...лог убран...
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

    // ...лог убран...
    // Закрываем модал
    setShowReasonModal(false);
  };

  // Обработчик выбора состояния упражнения (выполнил/не выполнил)
  const handleExerciseComplete = async (idx, completed) => {
    // ...лог убран...
    
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

    // Поздравление только если все упражнения выполнены (по updated) и ещё не показывалось
    const date = currentDay?.date;
    const workoutExercises = currentDay?.workout?.exercises || [];
    const congratsKey = `congrats_shown_${date}`;
    const congratsWasShown = localStorage.getItem(congratsKey) === '1';
    if (
      completed &&
      !congratsWasShown &&
      workoutExercises.length > 0 &&
      updated.every(v => v === true)
    ) {
      setShowCongrats(true);
      localStorage.setItem(congratsKey, '1');
      setTimeout(() => setShowCongrats(false), 4000);
    }

    // Добавляем тактильную обратную связь (вибрацию) при успешном выполнении
    if (completed && navigator.vibrate) {
      navigator.vibrate(100);
    }

    if (answers?.userId) {
      try {
        const tasksData = buildTasks();
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: answers.userId,
            date: currentDay.date,
            tasks: tasksData
          })
        });
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
        // ...лог убран...
      } catch (error) {
        console.error('❌ Ошибка обновления статуса упражнения:', error);
      }
    }
  }

  // Обработчик выбора состояния приема пищи (съел/не съел)
  const handleMealComplete = async (idx, completed) => {
    // ...лог убран...
    
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
        // ...лог убран...
        
        await fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: answers.userId,
            date: currentDay.date,
            tasks: tasksData
          })
        });
        // ...лог убран...
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
    // ...лог убран...
  }, [completedExercises]);

  useEffect(() => {
    // ...лог убран...
  }, [completedMeals]);

  // Отслеживание изменений шагов
  useEffect(() => {
    // ...лог убран...
  }, [walkingMinutes, stepsStatus]);

  // Функция для загрузки статусов выполнения дня с backend
  const fetchDayStatus = async () => {
    if (!answers?.userId || !currentDay?.date) {
      // ...лог убран...
      setIsInitialLoading(false); // Устанавливаем флаг даже если нет userId
      return;
    }
    
    try {
      // ...лог убран...
      const res = await fetch(`${API_URL}/api/progress?userId=${answers.userId}&date=${currentDay.date}`);
      const data = await res.json();
      
      // ...лог убран...
      
      if (data && (Array.isArray(data.tasks) || data.completedMealsArr || data.completedExercises)) {
        // Если tasks есть — используем их для tasks-based UI
        if (Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          // ...лог убран...
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
                // ...лог убран...
              }
            }
          });
          
          // ...лог убран...
          // ...лог убран...
          
          if (mealStates.length) {
            // Приводим все значения к null, true, false (false только если явно выбран "не съел")
            const finalMealStates = mealStates.map(v => v === true ? true : v === false ? false : null);
            // ...лог убран...
            setCompletedMeals(finalMealStates);
          }
          if (Object.keys(mealReasonsObj).length) setMealReasons(mealReasonsObj);
          if (exerciseStates.length) {
          // ...лог убран...
            setCompletedExercises(exerciseStates);
          }
          if (Object.keys(exerciseReasonsObj).length) setExerciseReasons(exerciseReasonsObj);
        }
        // Для обратной совместимости:
        if (data.completedMealsArr) {
          // ...лог убран...
          const finalMealStates = data.completedMealsArr.map(v => v === true ? true : v === false ? false : null);
          // ...лог убран...
          setCompletedMeals(finalMealStates);
        }
        if (data.completedExercises) {
          // ...лог убран...
          setCompletedExercises(data.completedExercises);
        }
      } else {
        // ...лог убран...
      }
      
      setIsInitialLoading(false); // Завершаем первоначальную загрузку
      setIsLoaded(true); // Помечаем, что данные загружены с сервера
      // ...лог убран...
      
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
      // ...лог убран...
      setIsInitialLoading(true);
      fetchDayStatus();
    }
  }, []);

  // Унификация userId: Telegram ID в проде, demo_user_local_test локально
  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      if (answers && !answers.userId) {
        answers.userId = window.Telegram.WebApp.initDataUnsafe.user.id;
        // ...лог убран...
      }
    } else {
      if (answers && !answers.userId) {
        answers.userId = 'demo_user_local_test';
        // ...лог убран...
      }
    }
  }, [answers]);

  // --- Новая функция для отправки статуса приема пищи на backend ---
  // Обработчик выбора состояния приема пищи (съел/не съел)
  const handleMealStatusChange = async (idx, completed) => {
    // ...лог убран...
    // Если отмечаем как НЕ съедено - показываем модал с причинами
    if (!completed) {
      // ...лог убран...
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
      // ...лог убран...
      // Убираем причину, если была
      const newReasons = { ...mealReasons };
      delete newReasons[idx];
      setMealReasons(newReasons);
    }

    const updated = completedMeals.map((v, i) => i === idx ? completed : v);
    setCompletedMeals(updated);

    // --- ПОЗДРАВЛЕНИЕ ЗА ПРИЕМЫ ПИЩИ ---
    const date = currentDay?.date;
    const mealsKey = `congrats_meals_shown_${date}`;
    const allMealsDone = currentDay?.meals?.length > 0 &&
      updated.length === currentDay.meals.length &&
      updated.every(v => v === true);
    const mealsCongratsWasShown = localStorage.getItem(mealsKey) === '1';
    if (
      completed &&
      !mealsCongratsWasShown &&
      currentDay?.meals?.length > 0 &&
      allMealsDone
    ) {
      setShowCongratsMeals(true);
      localStorage.setItem(mealsKey, '1');
      setTimeout(() => setShowCongratsMeals(false), 4000);
    }

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
        // ...лог убран...
      } catch (error) {
        console.error('❌ Ошибка отправки статуса приема пищи на бэкенд:', error);
      }
    }
    
    // ...лог убран...
  };

  // --- СИНХРОНИЗАЦИЯ ПРОГРЕССА (POST /api/progress) ---
  useEffect(() => {
    // Не отправляем данные, пока не завершена первоначальная загрузка
    if (isInitialLoading) {
      // ...лог убран...
      return;
    }
    
    if (!answers?.userId || !currentDay?.date) return;
    
    // ...лог убран...
    
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
        // ...лог убран...
      })
      .catch(e => {
        // ...лог убран...
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
      // ...лог убран...
      
      // ИСПРАВЛЕНО: загружаем только с сервера, не используем localStorage
      const response = await fetch(`${API_URL}/api/program/today?programId=${programId}`);
      const data = await response.json();
      if (data.success) {
        // ...лог убран...
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
      // ...лог убран...
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
      // ...лог убран...
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
      const stepsValue = selectedOption ? selectedOption.steps : 0;
      tasks.push({
        name: 'Шаги',
        type: 'steps',
        done: stepsStatus === true, // всегда true/false
        walking_minutes: walkingMinutes,
        steps_estimated: stepsValue,
        goal: GOAL_STEPS,
        status: stepsValue >= GOAL_STEPS ? 'complete' : 'partial'
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
      {/* Универсальный модал поздравления */}
      <CongratsModal
        isOpen={showCongrats}
        onClose={() => setShowCongrats(false)}
        icon="🎉"
        title="ПОЗДРАВЛЯЕМ!"
        message="Все упражнения на сегодня выполнены!"
      />
      <CongratsModal
        isOpen={showCongratsMeals}
        onClose={() => setShowCongratsMeals(false)}
        icon="🎉"
        title="Поздравляем!"
        message="Все приемы пищи на сегодня выполнены!"
      />
      {/* Confetti теперь только в CongratsModal */}
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        margin: '0 auto 16px auto',
        boxSizing: 'border-box',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          border: '1px solid #a5b4fc',
          borderRadius: 16,
          padding: '18px 24px 18px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 388,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{ fontSize: 28, marginBottom: 10, textAlign: 'center' }}>💬</div>
          <div style={{
            fontSize: 16,
            fontStyle: 'italic',
            color: '#3730a3',
            lineHeight: 1.4,
            fontWeight: 500,
            textAlign: 'center',
            width: '100%',
            maxWidth: 348
          }}>
            {todayQuote}
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
                        
                        // ...лог убран...
                        const exerciseCardProps = {
                          exerciseName: ex.name,
                          location,
                          dayId,
                          exerciseEnglishName: exerciseName,
                          exerciseObject: ex,
                          workoutObject: currentDay.workout,
                          fullVideoPath: location && dayId && exerciseName ? `/videos/${location}/${dayId}/${exerciseName}.mp4` : null
                        };
                        
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
                              // ...лог убран...
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
                              // ...лог убран...
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
      <div ref={reasonModalRef}>
        <ReasonModal
          isVisible={showReasonModal}
          onClose={() => setShowReasonModal(false)}
          onReasonSelected={handleReasonSelected}
          type={reasonModalData.type}
          itemName={reasonModalData.itemName}
        />

      </div>
    </div>
  );
}

// Автоскролл к модалке и поздравлению
// (hooks должны быть до return!)
