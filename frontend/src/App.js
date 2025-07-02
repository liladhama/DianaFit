import React, { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import StoryQuiz from './components/StoryQuiz';
import ProfilePage from './components/ProfilePage';
import DayBlock from './components/DayBlock';
import TodayBlock from './components/TodayBlock';
import TestWeek from './components/TestWeek';
import VideoTest from './components/VideoTest';
import AITestPage from './components/AITestPage';

// Временно используем только production URL для тестирования ИИ
const API_URL = 'https://dianafit.onrender.com';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [programId, setProgramId] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showToday, setShowToday] = useState(false);
  const [showTestWeek, setShowTestWeek] = useState(false);
  const [showTodayBlock, setShowTodayBlock] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showVideoTest, setShowVideoTest] = useState(false);
  const [showAITest, setShowAITest] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [isPremium, setIsPremium] = useState(false); // Состояние премиум доступа
  const [isPaymentShown, setIsPaymentShown] = useState(false); // Отслеживаем показ страницы оплаты

  // Функция активации премиум доступа (для тестирования)
  const activatePremium = () => {
    console.log('🎯 App.js: activatePremium вызван');
    setIsPremium(true);
    setUnlocked(true);
    localStorage.setItem('dianafit_premium', 'true');
    console.log('🔥 App.js: Премиум доступ активирован! isPremium=true, unlocked=true');
    console.log('🔥 App.js: Состояние сохранено в localStorage');
  };

  // Очищаем премиум статус при каждой загрузке - всегда начинаем с базовой версии
  React.useEffect(() => {
    localStorage.removeItem('dianafit_premium');
    console.log('🔄 Приложение запущено в базовом режиме');
  }, []);

  // Функция для получения аватарки пользователя
  const getUserAvatar = () => {
    try {
      // Пробуем получить из Telegram WebApp
      const tg = window.Telegram?.WebApp;
      if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        if (user.photo_url) {
          return user.photo_url;
        }
      }
      
      // Если нет Telegram, можно добавить другие способы получения аватарки
      // Например, из localStorage или API
      return null;
    } catch (error) {
      console.log('Error getting user avatar:', error);
      return null;
    }
  };

  // Инициализация Telegram WebApp
  useEffect(() => {
    console.log('Проверка Telegram WebApp...');
    console.log('window.Telegram:', window.Telegram);
    
    if (window.Telegram?.WebApp) {
      console.log('Telegram WebApp найден');
      window.Telegram.WebApp.ready();
      
      // Ждем немного для полной инициализации
      setTimeout(() => {
        console.log('Telegram WebApp данные:', window.Telegram.WebApp.initDataUnsafe);
        
        // Получаем аватарку пользователя
        const avatar = getUserAvatar();
        setUserAvatar(avatar);
        console.log('User avatar:', avatar);
        
        // Дополнительная отладочная информация
        if (window.Telegram.WebApp.initDataUnsafe?.user) {
          const user = window.Telegram.WebApp.initDataUnsafe.user;
          console.log('Пользователь Telegram:', {
            id: user.id,
            first_name: user.first_name,
            username: user.username,
            photo_url: user.photo_url
          });
        } else {
          console.log('Данные пользователя Telegram не найдены');
        }
      }, 1000);
    } else {
      console.log('Telegram WebApp не найден - возможно, запущено не в Telegram');
      // Для тестирования вне Telegram можно установить тестовую аватарку
      // setUserAvatar('https://via.placeholder.com/60x60/0088cc/ffffff?text=U');
    }
  }, []);

  // Добавляем слушатель для тестирования
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'v' && e.ctrlKey) {
        setShowVideoTest(true);
      }
      if (e.key === 'a' && e.ctrlKey) {
        setShowAITest(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Получаем текущий день из созданной программы
  let todayDay = null;
  if (answers && programId) {
    // Сначала пробуем загрузить из созданной программы
    const localProgram = localStorage.getItem(`program_${programId}`);
    if (localProgram) {
      const program = JSON.parse(localProgram);
      console.log('🔍 App.js: Загруженная программа:', { 
        programType: typeof program, 
        isArray: Array.isArray(program),
        hasData: !!program,
        keys: Object.keys(program || {}),
        program 
      });
      
      const todayStr = new Date().toISOString().slice(0, 10);
      
      // Проверяем структуру программы и получаем массив дней
      let days = null;
      if (Array.isArray(program)) {
        days = program;
      } else if (program && program.days && Array.isArray(program.days)) {
        days = program.days;
      } else if (program && Array.isArray(program.data)) {
        days = program.data;
      }
      
      if (days && Array.isArray(days)) {
        todayDay = days.find(d => d.date === todayStr);
        console.log('📅 App.js: Поиск сегодняшнего дня:', {
          todayStr,
          foundDay: !!todayDay,
          totalDays: days.length,
          dayWorkout: todayDay?.workout?.title,
          dayLocation: todayDay?.workout?.location
        });
      } else {
        console.error('❌ App.js: Программа не содержит массив дней:', program);
      }
    }
    
    // Если не найден, используем мок-данные как fallback
    if (!todayDay) {
      const days = [
        { date: '2024-06-03', title: 'Понедельник', workout: { title: 'Тренировка 1', exercises: [{ name: 'Приседания', reps: 15 }, { name: 'Отжимания', reps: 10 }] }, meals: [{ type: 'Завтрак', menu: 'Овсянка' }, { type: 'Обед', menu: 'Курица с рисом' }], completed: false },
        { date: '2024-06-04', title: 'Вторник', workout: { title: 'Тренировка 2', exercises: [{ name: 'Планка', reps: 60 }, { name: 'Выпады', reps: 12 }] }, meals: [{ type: 'Завтрак', menu: 'Яичница' }, { type: 'Обед', menu: 'Рыба с овощами' }], completed: false },
        { date: '2024-06-05', title: 'Среда', workout: { title: 'Тренировка 3', exercises: [{ name: 'Скручивания', reps: 20 }, { name: 'Приседания', reps: 15 }] }, meals: [{ type: 'Завтрак', menu: 'Творог' }, { type: 'Обед', menu: 'Гречка с курицей' }], completed: false },
        { date: '2024-06-06', title: 'Четверг', workout: { title: 'Тренировка 4', exercises: [{ name: 'Выпады', reps: 12 }, { name: 'Планка', reps: 60 }] }, meals: [{ type: 'Завтрак', menu: 'Омлет' }, { type: 'Обед', menu: 'Говядина с овощами' }], completed: false },
        { date: '2024-06-07', title: 'Пятница', workout: { title: 'Тренировка 5', exercises: [{ name: 'Отжимания', reps: 10 }, { name: 'Скручивания', reps: 20 }] }, meals: [{ type: 'Завтрак', menu: 'Гречка' }, { type: 'Обед', menu: 'Рыба с картофелем' }], completed: false },
        { date: '2024-06-08', title: 'Суббота', workout: { title: 'Тренировка 6', exercises: [{ name: 'Приседания', reps: 15 }, { name: 'Планка', reps: 60 }] }, meals: [{ type: 'Завтрак', menu: 'Овсянка' }, { type: 'Обед', menu: 'Курица с овощами' }], completed: false },
        { date: '2024-06-09', title: 'Воскресенье', workout: { title: 'Отдых', exercises: [] }, meals: [{ type: 'Завтрак', menu: 'Фрукты' }, { type: 'Обед', menu: 'Салат' }], completed: false },
      ];
      const todayStr = new Date().toISOString().slice(0, 10);
      todayDay = days.find(d => d.date === todayStr) || days[0];
      console.log('⚠️ App.js: Используем мок-данные как fallback для сегодняшнего дня');
    }
  }

  useEffect(() => {
    // Автоматическое расширение окна Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.expand) {
      window.Telegram.WebApp.expand();
    }
    const timer = setTimeout(() => setShowSplash(false), 4000); // 4 секунды
    return () => clearTimeout(timer);
  }, []);

  // Функция для получения упражнений для дня с привязкой к видео
  function getExercisesForDay(location, workoutNumber, level) {
    console.log('🏋️‍♀️ getExercisesForDay вызвана:', { location, workoutNumber, level });
    
    if (location === 'gym') {
      const dayIndex = (workoutNumber - 1) % 5; // Для зала: циклически 5 типов
      
      const gymExercises = [
        // День 1 - Спина и плечи (4 упражнения)
        [
          { name: 'Подъёмы гантелей в стороны', reps: '3x12', dayId: 'day1_back_shoulders', location: 'gym', videoName: 'dumbbell_lateral_raises' },
          { name: 'Тяга в тренажёре двумя руками', reps: '3x12', dayId: 'day1_back_shoulders', location: 'gym', videoName: 'hammer_machine_row_both_hands' },
          { name: 'Тяга верхнего блока широким хватом', reps: '3x10', dayId: 'day1_back_shoulders', location: 'gym', videoName: 'lat_pulldown_wide_grip' },
          { name: 'Жим гантелей сидя', reps: '3x10', dayId: 'day1_back_shoulders', location: 'gym', videoName: 'seated_dumbbell_press' }
        ],
        // День 2 - Ягодицы (4 упражнения)
        [
          { name: 'Жим ногами лёжа', reps: '3x15', dayId: 'day2_glutes', location: 'gym', videoName: 'leg_press_lying' },
          { name: 'Приседания узкой постановкой', reps: '3x12', dayId: 'day2_glutes', location: 'gym', videoName: 'narrow_stance_squats' },
          { name: 'Румынская тяга в Смите', reps: '3x12', dayId: 'day2_glutes', location: 'gym', videoName: 'romanian_deadlift_smith_machine' },
          { name: 'Ягодичный мост в Смите короткий диапазон', reps: '3x15', dayId: 'day2_glutes', location: 'gym', videoName: 'smith_machine_glute_bridge_short_range' }
        ],
        // День 3 - Ягодицы и бицепс бедра (5 упражнений)
        [
          { name: 'Ягодичный мост со свободными весами', reps: '3x12', dayId: 'day3_glutes_hamstrings', location: 'gym', videoName: 'free_weight_glute_bridge' },
          { name: 'Румынская тяга со свободными весами', reps: '3x12', dayId: 'day3_glutes_hamstrings', location: 'gym', videoName: 'free_weight_romanian_deadlift' },
          { name: 'Сгибания ног лёжа', reps: '3x15', dayId: 'day3_glutes_hamstrings', location: 'gym', videoName: 'lying_leg_curls' },
          { name: 'Жим одной ногой', reps: '3x12', dayId: 'day3_glutes_hamstrings', location: 'gym', videoName: 'single_leg_press' },
          { name: 'Отведение бедра сидя', reps: '3x15', dayId: 'day3_glutes_hamstrings', location: 'gym', videoName: 'seated_hip_abduction' }
        ],
        // День 4 - Спина и плечи (5 упражнений)
        [
          { name: 'Тяга верхнего блока широким хватом', reps: '3x10', dayId: 'day4_back_shoulders', location: 'gym', videoName: 'lat_pulldown_wide_grip' },
          { name: 'Тяга троса узким хватом', reps: '3x12', dayId: 'day4_back_shoulders', location: 'gym', videoName: 'cable_row_close_grip' },
          { name: 'Подъёмы гантелей стоя', reps: '3x12', dayId: 'day4_back_shoulders', location: 'gym', videoName: 'standing_dumbbell_lateral_raises' },
          { name: 'Обратная бабочка в тренажёре', reps: '3x15', dayId: 'day4_back_shoulders', location: 'gym', videoName: 'rear_delt_machine_flyes' },
          { name: 'Тяга одной рукой в хаммере', reps: '3x12', dayId: 'day4_back_shoulders', location: 'gym', videoName: 'single_arm_hammer_row' }
        ],
        // День 5 - Ягодицы фокус (4 упражнения)
        [
          { name: 'Ягодичный мост со свободными весами', reps: '3x15', dayId: 'day5_glutes_focused', location: 'gym', videoName: 'free_weight_glute_bridge' },
          { name: 'Отведение бедра в тренажёре', reps: '3x12', dayId: 'day5_glutes_focused', location: 'gym', videoName: 'hip_abduction_machine' },
          { name: 'Приседания узкой постановкой в Смите', reps: '3x12', dayId: 'day5_glutes_focused', location: 'gym', videoName: 'smith_machine_narrow_squats' },
          { name: 'Жим плечами в Смите', reps: '3x10', dayId: 'day5_glutes_focused', location: 'gym', videoName: 'smith_machine_shoulder_press' }
        ]
      ];
      
      const result = gymExercises[dayIndex];
      console.log('🏋️‍♀️ Возвращаем упражнения для зала, день', workoutNumber, '(индекс', dayIndex, '):', result);
      return result;
    } else {
      const dayIndex = (workoutNumber - 1) % 5; // Для дома: циклически 5 типов
      
      const homeExercises = [
        // День 1 - Кардио круговая (4 упражнения)
        [
          { name: 'Динамическая планка', reps: '3x30 сек', dayId: 'day1_cardio_circuit', location: 'home', videoName: 'dynamic_plank' },
          { name: 'Скручивания лёжа', reps: '3x15', dayId: 'day1_cardio_circuit', location: 'home', videoName: 'lying_crunches' },
          { name: 'Прыгающий джек', reps: '3x20', dayId: 'day1_cardio_circuit', location: 'home', videoName: 'jumping_jacks' },
          { name: 'Приседания широкой постановкой', reps: '3x15', dayId: 'day1_cardio_circuit', location: 'home', videoName: 'wide_stance_squats' }
        ],
        // День 2 - Функциональная круговая (4 упражнения)
        [
          { name: 'Выпады реверанс', reps: '3x12', dayId: 'day2_functional_circuit', location: 'home', videoName: 'curtsy_lunges' },
          { name: 'Румынская тяга с резинкой', reps: '3x15', dayId: 'day2_functional_circuit', location: 'home', videoName: 'romanian_deadlift_resistance_band' },
          { name: 'Тяга резинки двумя руками', reps: '3x12', dayId: 'day2_functional_circuit', location: 'home', videoName: 'resistance_band_row_both_hands' },
          { name: 'Тяга резинки одной рукой', reps: '3x12', dayId: 'day2_functional_circuit', location: 'home', videoName: 'single_arm_resistance_band_row' }
        ],
        // День 3 - Табата (4 упражнения)
        [
          { name: 'Приседания с отведением ноги', reps: '4x20 сек', dayId: 'day3_tabata', location: 'home', videoName: 'squat_with_side_leg_raise' },
          { name: 'Статичные выпады', reps: '4x20 сек', dayId: 'day3_tabata', location: 'home', videoName: 'stationary_lunges' },
          { name: 'Динамические отжимания в планке', reps: '4x20 сек', dayId: 'day3_tabata', location: 'home', videoName: 'dynamic_plank_push_up' },
          { name: 'Тяга резинки одной рукой', reps: '4x20 сек', dayId: 'day3_tabata', location: 'home', videoName: 'single_arm_resistance_band_row' }
        ],
        // День 4 - HIIT (4 упражнения)
        [
          { name: 'Сведение лопаток', reps: '3x15', dayId: 'day4_hiit', location: 'home', videoName: 'shoulder_blade_squeezes' },
          { name: 'Приседания с подъёмом на носки', reps: '3x12', dayId: 'day4_hiit', location: 'home', videoName: 'squats_with_calf_raise' },
          { name: 'Скручивания', reps: '3x20', dayId: 'day4_hiit', location: 'home', videoName: 'crunches' },
          { name: 'Динамическая планка', reps: '3x30 сек', dayId: 'day4_hiit', location: 'home', videoName: 'dynamic_plank' }
        ],
        // День 5 - Кардио продвинутый (4 упражнения)
        [
          { name: 'Захлёсты', reps: '3x30 сек', dayId: 'day5_cardio_advanced', location: 'home', videoName: 'butt_kicks' },
          { name: 'Классические приседания', reps: '3x15', dayId: 'day5_cardio_advanced', location: 'home', videoName: 'classic_squats' },
          { name: 'Ягодичный мостик', reps: '3x12', dayId: 'day5_cardio_advanced', location: 'home', videoName: 'glute_bridge' },
          { name: 'Приседания плие', reps: '3x15', dayId: 'day5_cardio_advanced', location: 'home', videoName: 'plie_squats' }
        ]
      ];
      
      const result = homeExercises[dayIndex];
      console.log('🏠 Возвращаем упражнения для дома, день', workoutNumber, '(индекс', dayIndex, '):', result);
      return result;
    }
  }

  // Создание месячной программы на основе ответов квиза (демо версия)
  function createMonthlyProgramDemo(quizAnswers) {
    const workoutsPerWeek = parseInt(quizAnswers.workouts_per_week) || 3;
    const location = quizAnswers.gym_or_home === 'gym' ? 'gym' : 'home'; // Исправлено: сравниваем с 'gym'
    const startDate = new Date(quizAnswers.start_date || new Date());
    const goal = quizAnswers.goal_weight_loss || 'weight_loss';
    const level = quizAnswers.training_level || 'beginner';
    
    console.log('🎯 Создаем демо программу локально');
    console.log('📋 Параметры:', { workoutsPerWeek, location, goal, level });
    console.log('🔍 Debug quizAnswers.gym_or_home:', quizAnswers.gym_or_home);
    console.log('🔍 Debug location result:', location);
    console.log('🔍 Debug ВЕСЬ объект quizAnswers:', quizAnswers);
    
    // Определяем паттерн тренировочных дней для недели
    const getWorkoutPattern = (workoutsCount) => {
      const patterns = {
        2: [1, 4], // пн, чт (отдых между тренировками)
        3: [1, 3, 6], // пн, ср, сб (равномерно по неделе)
        4: [1, 3, 5, 0], // пн, ср, пт, вс (через день + воскресенье)
        5: [1, 3, 4, 6, 0] // пн, ср, чт, сб, вс (максимум 2 подряд)
      };
      return patterns[workoutsCount] || patterns[3];
    };
    
    const workoutPattern = getWorkoutPattern(workoutsPerWeek);
    console.log('🗓️ Паттерн тренировок в неделю:', workoutPattern);
    
    // Создаем программу на 30 дней
    const days = [];
    let globalWorkoutCounter = 0; // Общий счетчик тренировок
    
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayOfWeek = currentDate.getDay(); // 0 = воскресенье, 1 = понедельник
      
      // Определяем, тренировочный ли это день
      const isWorkoutDay = workoutPattern.includes(dayOfWeek);
      
      let workoutNumber = 1;
      if (isWorkoutDay) {
        globalWorkoutCounter++;
        // Для дома и зала: циклически 1-5
        const maxWorkoutTypes = 5;
        workoutNumber = ((globalWorkoutCounter - 1) % maxWorkoutTypes) + 1;
      }
      
      console.log(`📅 День ${i + 1}: ${dayOfWeek === 0 ? 'Вс' : dayOfWeek === 1 ? 'Пн' : dayOfWeek === 2 ? 'Вт' : dayOfWeek === 3 ? 'Ср' : dayOfWeek === 4 ? 'Чт' : dayOfWeek === 5 ? 'Пт' : 'Сб'}, тренировка: ${isWorkoutDay ? `Да (${workoutNumber})` : 'Нет'}`);
      
      const day = {
        date: currentDate.toISOString().slice(0, 10),
        title: currentDate.toLocaleDateString('ru-RU', { weekday: 'long' }),
        dayNumber: i + 1,
        isWorkoutDay,
        workout: isWorkoutDay ? {
          title: location === 'gym' 
            ? `День ${workoutNumber} | Тренировка в зале`
            : `День ${workoutNumber} | Домашняя тренировка`,
          exercises: getExercisesForDay(location, workoutNumber, level),
          duration: level === 'beginner' ? 30 : 45,
          difficulty: level,
          location: location
        } : null,
        meals: [
          { type: 'Завтрак', meal: getBreakfastByDiet(quizAnswers.diet_flags, i + 1), calories: 320, time: '08:00' },
          { type: 'Перекус', meal: getSnackByDiet(quizAnswers.diet_flags, i + 1), calories: 80, time: '11:00' },
          { type: 'Обед', meal: getLunchByDiet(quizAnswers.diet_flags, i + 1), calories: 450, time: '14:00' },
          { type: 'Полдник', meal: getSnackByDiet(quizAnswers.diet_flags, i + 1, true), calories: 120, time: '17:00' },
          { type: 'Ужин', meal: getDinnerByDiet(quizAnswers.diet_flags, i + 1), calories: 350, time: '19:00' }
        ],
        dailySteps: 0,
        dailyStepsGoal: level === 'beginner' ? 8000 : 10000,
        completedExercises: isWorkoutDay ? new Array(3).fill(false) : [],
        completedMealsArr: new Array(5).fill(false),
        completedWorkout: false,
        completedMeals: false
      };
      
      days.push(day);
    }
    
    // Сохраняем программу в localStorage
    const programId = `demo-${quizAnswers.name || 'user'}-${Date.now()}`;
    const program = {
      programId,
      userId: quizAnswers.name || 'user',
      profile: quizAnswers,
      days,
      type: 'monthly-demo',
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`program_${programId}`, JSON.stringify(program));
    
    console.log('✅ Демо программа создана:', programId);
    console.log('📅 Всего дней:', days.length);
    console.log('🏋️‍♀️ Тренировочных дней:', days.filter(d => d.isWorkoutDay).length);
    
    return programId;
  }

  async function handleQuizFinish(quizAnswers) {
    console.log('🎯 Квиз завершен, создаем персональную программу через ИИ...');
    
    setAnswers(quizAnswers);
    
    try {
      // Отправляем данные квиза в backend для генерации через ИИ
      console.log('📡 Отправляем данные в backend для генерации программы...');
      console.log('📋 Данные квиза:', quizAnswers);
      
      // Добавляем таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('⏰ Запрос к ИИ прерван по таймауту (15 секунд)');
      }, 15000); // 15 секунд таймаут
      
      const response = await fetch(`${API_URL}/api/calculate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizAnswers),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📨 Получен ответ от backend, статус:', response.status);
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Получен ответ от ИИ:', result);
      
      // Парсим и обрабатываем ответ от ИИ
      const aiGeneratedProgram = parseAIResponse(result.plan, quizAnswers);
      
      if (aiGeneratedProgram) {
        console.log('✅ ИИ программа обработана:', aiGeneratedProgram);
        setProgramId(aiGeneratedProgram);
        setShowTodayBlock(true);
      } else {
        throw new Error('Не удалось обработать ответ ИИ');
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Запрос к ИИ прерван по таймауту');
      } else {
        console.error('❌ Ошибка генерации через ИИ:', error);
      }
      console.log('🔄 Используем локальную демо-версию как fallback...');
      
      // Fallback: используем демо программу
      const demoProgram = createMonthlyProgramDemo(quizAnswers);
      setProgramId(demoProgram);
      setShowTodayBlock(true);
    }
  }

  // Функция для парсинга ответа ИИ и преобразования в формат программы
  function parseAIResponse(aiResponse, quizAnswers) {
    try {
      console.log('🧠 Парсим ответ ИИ:', aiResponse);
      
      let parsedResponse;
      
      // Пробуем распарсить JSON из ответа ИИ
      try {
        // Если ответ уже JSON
        if (typeof aiResponse === 'object') {
          parsedResponse = aiResponse;
        } else {
          // Ищем JSON в тексте ответа
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('JSON не найден в ответе');
          }
        }
      } catch (parseError) {
        console.log('⚠️ Не удалось распарсить JSON, используем текстовый анализ');
        // Если не удалось распарсить JSON, создаем структуру на основе текста
        parsedResponse = createProgramFromText(aiResponse, quizAnswers);
      }
      
      // Преобразуем ответ ИИ в формат нашей программы
      const program = convertAIResponseToProgram(parsedResponse, quizAnswers);
      
      return program;
    } catch (error) {
      console.error('❌ Ошибка парсинга ответа ИИ:', error);
      return null;
    }
  }

  // Функция для создания программы из текстового ответа ИИ
  function createProgramFromText(textResponse, quizAnswers) {
    console.log('📝 Создаем программу из текстового ответа ИИ');
    console.log('🔍 Quiz answers:', quizAnswers);
    
    // Извлекаем ключевые параметры из квиза
    const workoutsPerWeek = parseInt(quizAnswers.workouts_per_week) || 3;
    const location = quizAnswers.gym_or_home || 'home'; // Используем правильный ключ из квиза
    const level = quizAnswers.training_level === 'beginner' ? 'beginner' : 'intermediate';
    
    console.log('🏋️‍♀️ Параметры программы:', { workoutsPerWeek, location, level });
    
    // Создаем базовую структуру программы с ИИ-упражнениями
    const startDate = new Date();
    const days = [];
    
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayOfWeek = currentDate.getDay();
      let isWorkoutDay = false;
      
      if (workoutsPerWeek === 2) {
        isWorkoutDay = dayOfWeek === 1 || dayOfWeek === 4;
      } else if (workoutsPerWeek === 3) {
        isWorkoutDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
      } else if (workoutsPerWeek === 4) {
        isWorkoutDay = dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5;
      } else if (workoutsPerWeek === 5) {
        isWorkoutDay = dayOfWeek >= 1 && dayOfWeek <= 5;
      }
      
      const workoutNumber = Math.floor(i / 7) * workoutsPerWeek + (i % 7 < workoutsPerWeek ? (i % 7) + 1 : 1);
      
      const day = {
        date: currentDate.toISOString().slice(0, 10),
        title: currentDate.toLocaleDateString('ru-RU', { weekday: 'long' }),
        dayNumber: i + 1,
        isWorkoutDay,
        workout: isWorkoutDay ? {
          title: `День ${workoutNumber} | ИИ-тренировка (${location === 'gym' ? 'Зал' : 'Дом'})`,
          exercises: getAIExercisesForDay(location, workoutNumber, level, textResponse),
          duration: level === 'beginner' ? 30 : 45,
          difficulty: level,
          location: location
        } : null,
        meals: [
          { type: 'Завтрак', meal: { name: 'ИИ-рецепт завтрака (fallback)', ingredients: [] }, calories: 320, time: '08:00' },
          { type: 'Перекус', meal: { name: 'ИИ-рецепт перекуса (fallback)', ingredients: [] }, calories: 80, time: '11:00' },
          { type: 'Обед', meal: { name: 'ИИ-рецепт обеда (fallback)', ingredients: [] }, calories: 450, time: '14:00' },
          { type: 'Полдник', meal: { name: 'ИИ-рецепт полдника (fallback)', ingredients: [] }, calories: 120, time: '17:00' },
          { type: 'Ужин', meal: { name: 'ИИ-рецепт ужина (fallback)', ingredients: [] }, calories: 350, time: '19:00' }
        ],
        dailySteps: 0,
        dailyStepsGoal: level === 'beginner' ? 8000 : 10000,
        completedExercises: isWorkoutDay ? new Array(3).fill(false) : [],
        completedMealsArr: new Array(5).fill(false),
        completedWorkout: false,
        completedMeals: false
      };
      
      days.push(day);
    }
    
    return { days, quizAnswers };
  }

  // Функция для получения ИИ-упражнений (с fallback на базовые)
  function getAIExercisesForDay(location, workoutNumber, level, aiText) {
    console.log('🤖 Генерируем ИИ-упражнения для:', { location, workoutNumber, level });
    
    // Пробуем извлечь упражнения из текста ИИ
    const exercises = extractExercisesFromAIText(aiText, location);
    
    if (exercises && exercises.length > 0) {
      return exercises;
    }
    
    // Fallback: используем наши базовые упражнения
    return getExercisesForDay(location, workoutNumber, level);
  }

  // Функция для извлечения упражнений из текста ИИ
  function extractExercisesFromAIText(aiText, location) {
    try {
      const exercises = [];
      const lines = aiText.split('\n');
      
      let inWorkoutSection = false;
      
      for (const line of lines) {
        const cleanLine = line.trim();
        
        // Ищем секции с тренировками
        if (cleanLine.toLowerCase().includes('тренировка') || 
            cleanLine.toLowerCase().includes('упражнения') ||
            cleanLine.toLowerCase().includes('workout')) {
          inWorkoutSection = true;
          continue;
        }
        
        // Ищем упражнения (строки, которые начинаются с цифры, точки или тире)
        if (inWorkoutSection && (cleanLine.match(/^\d+\./) || cleanLine.match(/^[-•]\s/))) {
          const exerciseName = cleanLine.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim();
          
          if (exerciseName.length > 3) {
            exercises.push({
              name: exerciseName,
              reps: '3x12', // Базовое значение
              location: location,
              dayId: getDayIdForLocation(location, exercises.length + 1)
            });
          }
        }
        
        // Если нашли достаточно упражнений или закончилась секция
        if (exercises.length >= 3 || (inWorkoutSection && cleanLine.includes('питание'))) {
          break;
        }
      }
      
      return exercises;
    } catch (error) {
      console.error('❌ Ошибка извлечения упражнений из ИИ текста:', error);
      return [];
    }
  }

  // Вспомогательная функция для получения dayId
  function getDayIdForLocation(location, dayNumber) {
    if (location === 'gym') {
      const gymDays = ['day1_glutes_hamstrings', 'day2_shoulders_triceps_abs', 'day3_back_biceps', 'day4_glutes_quads_calves'];
      return gymDays[(dayNumber - 1) % gymDays.length];
    } else {
      const homeDays = ['day1_cardio_circuit', 'day2_functional_circuit', 'day3_tabata', 'day4_hiit', 'day5_cardio_advanced'];
      return homeDays[(dayNumber - 1) % homeDays.length];
    }
  }

  // Функция для преобразования структурированного ответа ИИ в программу
  function convertAIResponseToProgram(parsedResponse, quizAnswers) {
    console.log('🔄 Преобразуем структурированный ответ ИИ в программу');
    
    try {
      // Проверяем, есть ли структурированные данные от ИИ
      if (parsedResponse && parsedResponse.weeks && parsedResponse.weeks.length > 0) {
        console.log('✅ Используем структурированный ответ ИИ с питанием');
        
        // Преобразуем недели в дни
        const days = [];
        
        parsedResponse.weeks.forEach(week => {
          if (week.days && week.days.length > 0) {
            week.days.forEach(day => {
              const formattedDay = {
                date: day.date || new Date(Date.now() + days.length * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                title: new Date(day.date || Date.now() + days.length * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU', { weekday: 'long' }),
                dayNumber: days.length + 1,
                isWorkoutDay: day.isWorkoutDay || false,
                workout: day.workout || null,
                meals: day.meals || [],
                dailySteps: 0,
                dailyStepsGoal: 10000,
                completedExercises: day.workout ? new Array(day.workout.exercises?.length || 3).fill(false) : [],
                completedMealsArr: new Array(5).fill(false),
                completedWorkout: false,
                completedMeals: false
              };
              
              days.push(formattedDay);
            });
          }
        });
        
        // Сохраняем программу в localStorage
        const programId = `ai-${quizAnswers.name || 'user'}-${Date.now()}`;
        const program = {
          programId,
          userId: quizAnswers.name || 'user',
          profile: quizAnswers,
          days: days,
          type: 'monthly-ai-generated',
          createdAt: new Date().toISOString(),
          aiResponse: parsedResponse
        };
        
        localStorage.setItem(`program_${programId}`, JSON.stringify(program));
        
        console.log('✅ ИИ программа с питанием сохранена:', programId);
        console.log('📅 Всего дней:', program.days.length);
        console.log('🏋️‍♀️ Тренировочных дней:', program.days.filter(d => d.isWorkoutDay).length);
        console.log('🍽️ Примеры питания от ИИ:', program.days.slice(0, 2).map(d => d.meals));
        
        return programId;
        
      } else {
        console.log('⚠️ Нет структурированного ответа ИИ, используем fallback');
        throw new Error('Нет структурированных данных от ИИ');
      }
      
    } catch (error) {
      console.error('❌ Ошибка преобразования ИИ ответа:', error);
      return null;
    }
  }

  // Функции для генерации питания по типу диеты с граммовками
  function getBreakfastByDiet(dietType, dayNumber = 1) {
    const breakfasts = {
      vegetarian_eggs: [
        { 
          name: 'Омлет с овощами', 
          ingredients: [
            { name: 'Яйца куриные', amount: 150, unit: 'г (3 шт)' },
            { name: 'Помидоры', amount: 80, unit: 'г' },
            { name: 'Шпинат', amount: 50, unit: 'г' },
            { name: 'Сыр моцарелла', amount: 30, unit: 'г' },
            { name: 'Оливковое масло', amount: 5, unit: 'мл' }
          ]
        },
        { 
          name: 'Творожная запеканка с ягодами', 
          ingredients: [
            { name: 'Творог 5%', amount: 150, unit: 'г' },
            { name: 'Яйцо куриное', amount: 50, unit: 'г (1 шт)' },
            { name: 'Ягоды свежие', amount: 80, unit: 'г' },
            { name: 'Мед', amount: 15, unit: 'г (1 ст.л.)' },
            { name: 'Овсяные хлопья', amount: 20, unit: 'г' }
          ]
        },
        { 
          name: 'Сырники с черникой', 
          ingredients: [
            { name: 'Творог 9%', amount: 120, unit: 'г' },
            { name: 'Яйцо куриное', amount: 50, unit: 'г (1 шт)' },
            { name: 'Мука цельнозерновая', amount: 30, unit: 'г' },
            { name: 'Черника', amount: 60, unit: 'г' },
            { name: 'Кокосовое масло', amount: 10, unit: 'г' }
          ]
        },
        { 
          name: 'Омлет с сыром и зеленью', 
          ingredients: [
            { name: 'Яйца куриные', amount: 150, unit: 'г (3 шт)' },
            { name: 'Сыр твердый', amount: 40, unit: 'г' },
            { name: 'Укроп', amount: 15, unit: 'г' },
            { name: 'Зеленый лук', amount: 20, unit: 'г' },
            { name: 'Сливочное масло', amount: 10, unit: 'г' }
          ]
        },
        { 
          name: 'Творог с бананом и орехами', 
          ingredients: [
            { name: 'Творог 5%', amount: 150, unit: 'г' },
            { name: 'Банан', amount: 100, unit: 'г (1 шт)' },
            { name: 'Миндаль', amount: 20, unit: 'г' },
            { name: 'Мед', amount: 10, unit: 'г' },
            { name: 'Корица', amount: 2, unit: 'г' }
          ]
        }
      ],
      vegetarian_no_eggs: [
        { 
          name: 'Овсянка с ягодами и орехами', 
          ingredients: [
            { name: 'Овсяные хлопья', amount: 60, unit: 'г' },
            { name: 'Молоко 2.5%', amount: 200, unit: 'мл' },
            { name: 'Ягоды свежие', amount: 80, unit: 'г' },
            { name: 'Грецкие орехи', amount: 20, unit: 'г' },
            { name: 'Мед', amount: 10, unit: 'г' }
          ]
        },
        { 
          name: 'Греческий йогурт с фруктами', 
          ingredients: [
            { name: 'Йогурт греческий', amount: 150, unit: 'г' },
            { name: 'Банан', amount: 100, unit: 'г (1 шт)' },
            { name: 'Мюсли', amount: 30, unit: 'г' },
            { name: 'Мед', amount: 15, unit: 'г' },
            { name: 'Миндальные лепестки', amount: 15, unit: 'г' }
          ]
        }
      ],
      vegan: [
        { 
          name: 'Овсянка на растительном молоке', 
          ingredients: [
            { name: 'Овсяные хлопья', amount: 60, unit: 'г' },
            { name: 'Миндальное молоко', amount: 200, unit: 'мл' },
            { name: 'Банан', amount: 100, unit: 'г' },
            { name: 'Семена чиа', amount: 15, unit: 'г' },
            { name: 'Кленовый сироп', amount: 10, unit: 'мл' }
          ]
        },
        { 
          name: 'Тост с авокадо и семенами', 
          ingredients: [
            { name: 'Хлеб цельнозерновой', amount: 60, unit: 'г (2 кусочка)' },
            { name: 'Авокадо', amount: 80, unit: 'г' },
            { name: 'Помидоры черри', amount: 60, unit: 'г' },
            { name: 'Семена льна', amount: 10, unit: 'г' },
            { name: 'Лимонный сок', amount: 5, unit: 'мл' }
          ]
        }
      ],
      meat: [
        { 
          name: 'Омлет с беконом', 
          ingredients: [
            { name: 'Яйца куриные', amount: 150, unit: 'г (3 шт)' },
            { name: 'Бекон', amount: 50, unit: 'г' },
            { name: 'Помидоры', amount: 70, unit: 'г' },
            { name: 'Сыр твердый', amount: 30, unit: 'г' },
            { name: 'Сливочное масло', amount: 10, unit: 'г' }
          ]
        },
        { 
          name: 'Творог с курицей и зеленью', 
          ingredients: [
            { name: 'Творог 5%', amount: 120, unit: 'г' },
            { name: 'Куриная грудка отварная', amount: 60, unit: 'г' },
            { name: 'Огурец', amount: 80, unit: 'г' },
            { name: 'Зелень микс', amount: 15, unit: 'г' },
            { name: 'Оливковое масло', amount: 5, unit: 'мл' }
          ]
        }
      ],
      fish: [
        { 
          name: 'Омлет с красной рыбой', 
          ingredients: [
            { name: 'Яйца куриные', amount: 150, unit: 'г (3 шт)' },
            { name: 'Семга слабосоленая', amount: 40, unit: 'г' },
            { name: 'Сливочный сыр', amount: 30, unit: 'г' },
            { name: 'Укроп', amount: 10, unit: 'г' },
            { name: 'Сливочное масло', amount: 10, unit: 'г' }
          ]
        },
        { 
          name: 'Творог с тунцом', 
          ingredients: [
            { name: 'Творог 5%', amount: 120, unit: 'г' },
            { name: 'Тунец в собственном соку', amount: 60, unit: 'г' },
            { name: 'Огурец', amount: 80, unit: 'г' },
            { name: 'Помидоры черри', amount: 60, unit: 'г' },
            { name: 'Оливковое масло', amount: 5, unit: 'мл' }
          ]
        }
      ],
      default: [
        { 
          name: 'Овсянка с ягодами', 
          ingredients: [
            { name: 'Овсяные хлопья', amount: 50, unit: 'г' },
            { name: 'Молоко', amount: 150, unit: 'мл' },
            { name: 'Ягоды', amount: 70, unit: 'г' },
            { name: 'Мед', amount: 10, unit: 'г' }
          ]
        }
      ]
    };
    
    const options = breakfasts[dietType] || breakfasts.default;
    // Используем номер дня для детерминированного выбора блюда
    const index = (dayNumber - 1) % options.length;
    return options[index];
  }

  function getSnackByDiet(dietType, dayNumber = 1, isEvening = false) {
    const snacks = {
      vegetarian_eggs: [
        { 
          name: 'Творог с орехами', 
          ingredients: [
            { name: 'Творог 5%', amount: 100, unit: 'г' },
            { name: 'Грецкие орехи', amount: 20, unit: 'г' },
            { name: 'Мед', amount: 10, unit: 'г' }
          ]
        },
        { 
          name: 'Банан с йогуртом', 
          ingredients: [
            { name: 'Банан', amount: 100, unit: 'г (1 шт)' },
            { name: 'Йогурт греческий', amount: 80, unit: 'г' },
            { name: 'Корица', amount: 2, unit: 'г' }
          ]
        },
        { 
          name: 'Сыр с яблоком', 
          ingredients: [
            { name: 'Сыр моцарелла', amount: 50, unit: 'г' },
            { name: 'Яблоко', amount: 100, unit: 'г (1 шт)' }
          ]
        }
      ],
      vegetarian_no_eggs: [
        { 
          name: 'Яблоко с миндалем', 
          ingredients: [
            { name: 'Яблоко', amount: 150, unit: 'г (1 шт)' },
            { name: 'Миндаль', amount: 20, unit: 'г' }
          ]
        }
      ],
      vegan: [
        { 
          name: 'Банан с арахисовой пастой', 
          ingredients: [
            { name: 'Банан', amount: 120, unit: 'г' },
            { name: 'Арахисовая паста', amount: 15, unit: 'г' }
          ]
        }
      ],
      meat: [
        { 
          name: 'Куриные кусочки с овощами', 
          ingredients: [
            { name: 'Куриная грудка отварная', amount: 80, unit: 'г' },
            { name: 'Огурец', amount: 50, unit: 'г' },
            { name: 'Помидоры черри', amount: 50, unit: 'г' }
          ]
        }
      ],
      fish: [
        { 
          name: 'Крекеры с красной рыбой', 
          ingredients: [
            { name: 'Крекеры цельнозерновые', amount: 30, unit: 'г' },
            { name: 'Семга слабосоленая', amount: 40, unit: 'г' },
            { name: 'Сливочный сыр', amount: 20, unit: 'г' }
          ]
        }
      ],
      default: [
        { 
          name: 'Йогурт', 
          ingredients: [
            { name: 'Йогурт натуральный', amount: 125, unit: 'г' }
          ]
        }
      ]
    };
    
    const options = snacks[dietType] || snacks.default;
    // Используем номер дня и тип перекуса для детерминированного выбора
    const seed = isEvening ? dayNumber + 100 : dayNumber;
    const index = (seed - 1) % options.length;
    return options[index];
  }

  function getLunchByDiet(dietType, dayNumber = 1) {
    const lunches = {
      vegetarian_eggs: [
        { 
          name: 'Киноа с овощами и сыром', 
          ingredients: [
            { name: 'Киноа', amount: 80, unit: 'г (сухая)' },
            { name: 'Брокколи', amount: 100, unit: 'г' },
            { name: 'Сыр фета', amount: 50, unit: 'г' },
            { name: 'Помидоры', amount: 80, unit: 'г' },
            { name: 'Оливковое масло', amount: 10, unit: 'мл' }
          ]
        },
        { 
          name: 'Омлет с сыром и овощами', 
          ingredients: [
            { name: 'Яйца куриные', amount: 150, unit: 'г (3 шт)' },
            { name: 'Сыр твердый', amount: 40, unit: 'г' },
            { name: 'Кабачок', amount: 100, unit: 'г' },
            { name: 'Помидоры', amount: 80, unit: 'г' },
            { name: 'Оливковое масло', amount: 10, unit: 'мл' }
          ]
        },
        { 
          name: 'Творожная запеканка с овощами', 
          ingredients: [
            { name: 'Творог 5%', amount: 150, unit: 'г' },
            { name: 'Яйца куриные', amount: 100, unit: 'г (2 шт)' },
            { name: 'Морковь', amount: 80, unit: 'г' },
            { name: 'Цукини', amount: 100, unit: 'г' },
            { name: 'Сыр твердый', amount: 30, unit: 'г' }
          ]
        },
        { 
          name: 'Фриттата с шпинатом', 
          ingredients: [
            { name: 'Яйца куриные', amount: 150, unit: 'г (3 шт)' },
            { name: 'Шпинат', amount: 120, unit: 'г' },
            { name: 'Сыр моцарелла', amount: 50, unit: 'г' },
            { name: 'Лук репчатый', amount: 40, unit: 'г' },
            { name: 'Оливковое масло', amount: 10, unit: 'мл' }
          ]
        },
        { 
          name: 'Ризотто с овощами', 
          ingredients: [
            { name: 'Рис арборио', amount: 60, unit: 'г (сухой)' },
            { name: 'Спаржа', amount: 100, unit: 'г' },
            { name: 'Сыр пармезан', amount: 40, unit: 'г' },
            { name: 'Грибы шампиньоны', amount: 80, unit: 'г' },
            { name: 'Овощной бульон', amount: 200, unit: 'мл' }
          ]
        }
      ],
      vegetarian_no_eggs: [
        { 
          name: 'Овощное рагу с бобовыми', 
          ingredients: [
            { name: 'Нут отварной', amount: 120, unit: 'г' },
            { name: 'Баклажан', amount: 100, unit: 'г' },
            { name: 'Кабачок', amount: 100, unit: 'г' },
            { name: 'Перец болгарский', amount: 80, unit: 'г' },
            { name: 'Оливковое масло', amount: 15, unit: 'мл' }
          ]
        }
      ],
      vegan: [
        { 
          name: 'Салат с нутом и тахини', 
          ingredients: [
            { name: 'Нут отварной', amount: 150, unit: 'г' },
            { name: 'Листья салата', amount: 80, unit: 'г' },
            { name: 'Огурец', amount: 100, unit: 'г' },
            { name: 'Тахини', amount: 20, unit: 'г' },
            { name: 'Лимонный сок', amount: 10, unit: 'мл' }
          ]
        }
      ],
      meat: [
        { 
          name: 'Куриная грудка с рисом и овощами', 
          ingredients: [
            { name: 'Куриная грудка', amount: 150, unit: 'г' },
            { name: 'Рис бурый', amount: 60, unit: 'г (сухой)' },
            { name: 'Брокколи', amount: 100, unit: 'г' },
            { name: 'Морковь', amount: 80, unit: 'г' },
            { name: 'Оливковое масло', amount: 10, unit: 'мл' }
          ]
        },
        { 
          name: 'Говядина с гречкой', 
          ingredients: [
            { name: 'Говядина постная', amount: 120, unit: 'г' },
            { name: 'Гречка', amount: 60, unit: 'г (сухая)' },
            { name: 'Лук репчатый', amount: 50, unit: 'г' },
            { name: 'Помидоры', amount: 100, unit: 'г' },
            { name: 'Подсолнечное масло', amount: 10, unit: 'мл' }
          ]
        }
      ],
      fish: [
        { 
          name: 'Семга с киноа и овощами', 
          ingredients: [
            { name: 'Семга свежая', amount: 150, unit: 'г' },
            { name: 'Киноа', amount: 60, unit: 'г (сухая)' },
            { name: 'Спаржа', amount: 100, unit: 'г' },
            { name: 'Лимон', amount: 30, unit: 'г' },
            { name: 'Оливковое масло', amount: 10, unit: 'мл' }
          ]
        },
        { 
          name: 'Треска с рисом', 
          ingredients: [
            { name: 'Треска филе', amount: 150, unit: 'г' },
            { name: 'Рис дикий', amount: 60, unit: 'г (сухой)' },
            { name: 'Цветная капуста', amount: 120, unit: 'г' },
            { name: 'Зелень', amount: 15, unit: 'г' },
            { name: 'Оливковое масло', amount: 10, unit: 'мл' }
          ]
        }
      ],
      default: [
        { 
          name: 'Курица с рисом и овощами', 
          ingredients: [
            { name: 'Куриная грудка', amount: 120, unit: 'г' },
            { name: 'Рис бурый', amount: 60, unit: 'г (сухой)' },
            { name: 'Овощи на пару', amount: 150, unit: 'г' }
          ]
        }
      ]
    };
    
    const options = lunches[dietType] || lunches.default;
    // Используем номер дня для детерминированного выбора обеда
    const index = (dayNumber - 1) % options.length;
    return options[index];
  }

  function getDinnerByDiet(dietType, dayNumber = 1) {
    const dinners = {
      vegetarian_eggs: [
        { 
          name: 'Омлет с зеленью', 
          ingredients: [
            { name: 'Яйца куриные', amount: 100, unit: 'г (2 шт)' },
            { name: 'Шпинат', amount: 60, unit: 'г' },
            { name: 'Укроп', amount: 10, unit: 'г' },
            { name: 'Сыр творожный', amount: 30, unit: 'г' }
          ]
        },
        { 
          name: 'Творог с яйцом и огурцом', 
          ingredients: [
            { name: 'Творог 5%', amount: 120, unit: 'г' },
            { name: 'Яйцо куриное вареное', amount: 50, unit: 'г (1 шт)' },
            { name: 'Огурец', amount: 100, unit: 'г' },
            { name: 'Зелень', amount: 15, unit: 'г' },
            { name: 'Оливковое масло', amount: 5, unit: 'мл' }
          ]
        },
        { 
          name: 'Яичница с овощами', 
          ingredients: [
            { name: 'Яйца куриные', amount: 100, unit: 'г (2 шт)' },
            { name: 'Помидоры', amount: 80, unit: 'г' },
            { name: 'Перец болгарский', amount: 60, unit: 'г' },
            { name: 'Лук зеленый', amount: 20, unit: 'г' },
            { name: 'Оливковое масло', amount: 8, unit: 'мл' }
          ]
        },
        { 
          name: 'Сырники запеченные', 
          ingredients: [
            { name: 'Творог 9%', amount: 150, unit: 'г' },
            { name: 'Яйцо куриное', amount: 50, unit: 'г (1 шт)' },
            { name: 'Мука рисовая', amount: 20, unit: 'г' },
            { name: 'Ягоды', amount: 50, unit: 'г' }
          ]
        },
        { 
          name: 'Салат с моцареллой и помидорами', 
          ingredients: [
            { name: 'Моцарелла', amount: 80, unit: 'г' },
            { name: 'Помидоры', amount: 120, unit: 'г' },
            { name: 'Листья салата', amount: 60, unit: 'г' },
            { name: 'Базилик', amount: 10, unit: 'г' },
            { name: 'Оливковое масло', amount: 10, unit: 'мл' }
          ]
        }
      ],
      vegetarian_no_eggs: [
        { 
          name: 'Творог с зеленью', 
          ingredients: [
            { name: 'Творог 5%', amount: 150, unit: 'г' },
            { name: 'Огурец', amount: 80, unit: 'г' },
            { name: 'Зелень микс', amount: 20, unit: 'г' },
            { name: 'Оливковое масло', amount: 5, unit: 'мл' }
          ]
        }
      ],
      vegan: [
        { 
          name: 'Овощной салат с семенами', 
          ingredients: [
            { name: 'Огурец', amount: 100, unit: 'г' },
            { name: 'Помидор', amount: 100, unit: 'г' },
            { name: 'Семена подсолнечника', amount: 20, unit: 'г' },
            { name: 'Лимонный сок', amount: 10, unit: 'мл' }
          ]
        }
      ],
      meat: [
        { 
          name: 'Куриная грудка с салатом', 
          ingredients: [
            { name: 'Куриная грудка', amount: 120, unit: 'г' },
            { name: 'Листья салата', amount: 80, unit: 'г' },
            { name: 'Огурец', amount: 60, unit: 'г' },
            { name: 'Помидоры черри', amount: 60, unit: 'г' },
            { name: 'Оливковое масло', amount: 10, unit: 'мл' }
          ]
        }
      ],
      fish: [
        { 
          name: 'Треска на пару с овощами', 
          ingredients: [
            { name: 'Треска филе', amount: 120, unit: 'г' },
            { name: 'Брокколи', amount: 100, unit: 'г' },
            { name: 'Цукини', amount: 80, unit: 'г' },
            { name: 'Лимон', amount: 20, unit: 'г' },
            { name: 'Оливковое масло', amount: 5, unit: 'мл' }
          ]
        }
      ],
      default: [
        { 
          name: 'Творог с зеленью', 
          ingredients: [
            { name: 'Творог', amount: 120, unit: 'г' },
            { name: 'Зелень', amount: 15, unit: 'г' }
          ]
        }
      ]
    };
    
    const options = dinners[dietType] || dinners.default;
    // Используем номер дня для детерминированного выбора ужина
    const index = (dayNumber - 1) % options.length;
    return options[index];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', background: '#fff' }}>
      {showVideoTest ? (
        <div>
          <VideoTest />
        </div>
      ) : showAITest ? (
        <div>
          <AITestPage />
        </div>
      ) : null}
      
      {/* Аватарка пользователя из Telegram в правом верхнем углу */}
      {/* Показываем только на странице TestWeek, но НЕ на TodayBlock и НЕ на странице оплаты */}
      {!showSplash && showTestWeek && !isPaymentShown && (
        <div
          onClick={() => setShowProfile(true)}
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
            zIndex: 1001, // Выше чем у кнопки чата
            boxShadow: '0 4px 20px rgba(0, 136, 204, 0.4)',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 16px rgba(0, 136, 204, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 136, 204, 0.4)';
          }}
        >
          {/* Аватарка пользователя из Telegram или иконка по умолчанию */}
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
              onError={() => {
                // Если изображение не загрузилось, убираем аватарку
                setUserAvatar(null);
              }}
            />
          ) : (
            <span 
              style={{ 
                fontSize: 24, 
                color: 'white', 
                fontWeight: 'bold'
              }}
            >
              👤
            </span>
          )}
        </div>
      )}
      
      {showSplash ? (
        <div>
          <SplashScreen />
          <button 
            onClick={() => setShowVideoTest(true)}
            style={{ 
              position: 'fixed', 
              bottom: '20px', 
              left: '20px', 
              zIndex: 1000, 
              padding: '10px 15px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            🎥 Тест видео
          </button>
          <button 
            onClick={() => setShowAITest(true)}
            style={{ 
              position: 'fixed', 
              bottom: '80px', 
              left: '20px', 
              zIndex: 1000, 
              padding: '10px 15px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            🤖 Тест ИИ
          </button>
          <button 
            onClick={() => window.open('/connection-test.html', '_blank')}
            style={{ 
              position: 'fixed', 
              bottom: '140px', 
              left: '20px', 
              zIndex: 1000, 
              padding: '10px 15px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none', 
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            🔗 Тест соединения
          </button>
          
          {/* Временная кнопка для проверки Telegram данных */}
          <button 
            onClick={() => {
              console.log('=== TELEGRAM DEBUG INFO ===');
              console.log('window.Telegram:', window.Telegram);
              console.log('WebApp:', window.Telegram?.WebApp);
              console.log('initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
              console.log('user:', window.Telegram?.WebApp?.initDataUnsafe?.user);
              console.log('userAvatar state:', userAvatar);
              alert('Проверьте консоль для отладочной информации Telegram');
            }}
            style={{ 
              position: 'fixed', 
              bottom: '200px', 
              left: '20px', 
              zIndex: 1000, 
              padding: '10px 15px', 
              backgroundColor: '#6f42c1', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            🐛 Debug Telegram
          </button>
          
          {/* Кнопка для тестирования аватарки */}
          <button 
            onClick={() => {
              const testAvatar = 'https://avatars.githubusercontent.com/u/1?v=4';
              setUserAvatar(testAvatar);
              console.log('Установлена тестовая аватарка:', testAvatar);
            }}
            style={{ 
              position: 'fixed', 
              bottom: '260px', 
              left: '20px', 
              zIndex: 1000, 
              padding: '10px 15px', 
              backgroundColor: '#e83e8c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            🖼️ Тест аватарки
          </button>
          
          {/* Тестовые кнопки скрыты в продакшене */}
          {process.env.NODE_ENV === 'development' && (
            <>
              {/* Кнопка быстрой активации/деактивации премиума - только для разработки */}
              <button 
                onClick={() => {
                  if (isPremium) {
                    setIsPremium(false);
                    setUnlocked(false);
                    localStorage.removeItem('dianafit_premium');
                    alert('❌ Премиум доступ деактивирован!');
                  } else {
                    activatePremium();
                    alert('🎉 Премиум доступ активирован! Теперь можно тестировать ИИ-чат.');
                  }
                }}
                style={{ 
                  position: 'fixed', 
                  bottom: '320px', 
                  left: '20px', 
                  zIndex: 1000, 
                  padding: '10px 15px', 
                  backgroundColor: isPremium ? '#4CAF50' : '#FFD700', 
                  color: isPremium ? 'white' : 'black', 
                  border: 'none', 
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {isPremium ? '✅ Премиум ВКЛ' : '💎 Премиум ВЫКЛ'}
              </button>
            </>
          )}
        </div>
      ) : showProfile ? (
        <ProfilePage
          onClose={() => setShowProfile(false)}
          unlocked={unlocked}
          isPremium={isPremium}
          activatePremium={activatePremium}
          answers={answers}
          onEditQuiz={() => { setShowProfile(false); setShowToday(false); setShowTestWeek(false); setShowTodayBlock(false); }}
          onRestart={() => { 
            setAnswers(null); 
            setProgramId(null); 
            setShowProfile(false); 
            setShowToday(false); 
            setShowTestWeek(false); 
            setShowTodayBlock(false); 
            setUnlocked(false); 
            setIsPremium(false); 
            localStorage.removeItem('dianafit_premium');
            // Очищаем все программы из localStorage
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('program_')) {
                localStorage.removeItem(key);
              }
            });
          }}
        />
      ) : showTestWeek ? (
        <TestWeek 
          isPremium={isPremium}
          activatePremium={activatePremium}
          setIsPaymentShown={setIsPaymentShown}
          programId={programId}
          onStartProgram={() => {
            setShowTestWeek(false);
            setShowToday(true);
          }}
          onShowTodayBlock={() => {
            setShowTestWeek(false);
            setShowTodayBlock(true);
          }}
        />
      ) : showTodayBlock ? (
        <TodayBlock 
          day={todayDay} 
          answers={answers}
          programId={programId}
          isPremium={isPremium}
          activatePremium={activatePremium}
          setIsPaymentShown={setIsPaymentShown}
          onBackToWeek={() => {
            setShowTodayBlock(false);
            setShowTestWeek(true);
          }} 
        />
      ) : (answers && programId && todayDay && !showToday) ? (
        <TestWeek programId={programId} unlocked={unlocked} setUnlocked={setUnlocked} />
      ) : showToday && answers && programId ? (
        <TestWeek programId={programId} unlocked={unlocked} setUnlocked={setUnlocked} />
      ) : (
        <StoryQuiz onFinish={handleQuizFinish} />
      )}
    </div>
  );
}

export default App;
