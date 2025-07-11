import React, { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import StoryQuiz from './components/StoryQuiz';
import ProfilePage from './components/ProfilePage';
import DayBlock from './components/DayBlock';
import TodayBlock from './components/TodayBlock';
import TestWeek from './components/TestWeek';
import VideoTest from './components/VideoTest';
import AITestPage from './components/AITestPage';
import { API_URL } from './config/api';

// 🚨 ГЛОБАЛЬНЫЙ ПЕРЕХВАТЧИК ВСЕХ FETCH-ЗАПРОСОВ ДЛЯ ОТЛАДКИ
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [url, options = {}] = args;
  console.log(`🌐 ГЛОБАЛЬНЫЙ FETCH: ${url}`, options);
  
  try {
    const response = await originalFetch(...args);
    
    // Клонируем response для проверки содержимого
    const responseClone = response.clone();
    const contentType = response.headers.get('content-type');
    
    console.log(`📊 ГЛОБАЛЬНЫЙ ОТВЕТ для ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      contentType,
      url: response.url,
      ok: response.ok
    });
    
    // Если ожидается JSON, но получен HTML - логируем первые символы
    if (contentType && !contentType.includes('application/json') && contentType.includes('text/html')) {
      const text = await responseClone.text();
      console.error(`🚨 ПОЛУЧЕН HTML ВМЕСТО JSON для ${url}:`, text.substring(0, 200));
    }
    
    return response;
  } catch (error) {
    console.error(`🚨 ГЛОБАЛЬНАЯ ОШИБКА FETCH для ${url}:`, error);
    throw error;
  }
};

// Универсальная функция для fetch с детальным логированием
const safeFetch = async (url, options = {}) => {
  try {
    console.log(`🔄 Начинаем fetch-запрос: ${url}`);
    console.log(`📋 Опции запроса:`, options);
    
    const response = await fetch(url, options);
    
    console.log(`📊 Ответ получен:`, {
      status: response.status,
      statusText: response.statusText,
      headers: [...response.headers.entries()],
      url: response.url,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.error(`❌ Ошибка HTTP: ${response.status} ${response.statusText}`);
      // Попробуем получить текст ответа для диагностики
      const text = await response.text();
      console.error(`📄 Текст ответа (первые 500 символов):`, text.substring(0, 500));
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Проверяем, что получили JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`❌ Ожидался JSON, получен:`, contentType);
      console.error(`📄 Полученный контент:`, text.substring(0, 500));
      throw new Error(`Ожидался JSON, получен: ${contentType}`);
    }
    
    const data = await response.json();
    console.log(`✅ JSON успешно обработан:`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ Ошибка в safeFetch для ${url}:`, error);
    
    // Если это ошибка подключения к backend
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.error(`🚨 BACKEND НЕ ЗАПУЩЕН! Запустите backend сервер: npm start в папке backend`);
      throw new Error('Backend сервер не доступен. Запустите backend сервер.');
    }
    
    throw error;
  }
};

// Функция проверки доступности backend
const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`, { 
      method: 'GET',
      timeout: 5000 
    });
    return response.ok;
  } catch (error) {
    console.error('🚨 Backend недоступен:', error);
    return false;
  }
};

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
  const [todayDay, setTodayDay] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isPaymentShown, setIsPaymentShown] = useState(false);
  // --- Новый стейт для Telegram userId ---
  const [tgUserId, setTgUserId] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true); // Новый флаг загрузки пользователя
  const [weekData, setWeekData] = useState(null);

  // Получаем Telegram userId при инициализации
  useEffect(() => {
    const id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (id) {
      setTgUserId(id.toString());
      console.log('✅ Получен Telegram userId:', id);
    } else {
      setTgUserId(null);
      console.log('❌ Telegram userId не найден');
    }
  }, []);

  // --- Загрузка answers/weekData по Telegram userId ---
  useEffect(() => {
    if (!showSplash && tgUserId) {
      setIsLoadingUserData(true);
      const fetchWithRetry = async (retries = 5, delay = 400) => {
        // 1. Получаем answers (квиз) по userId
        const quizRes = await fetch(`${API_URL}/api/user/quiz-answers/${tgUserId}`);
        let quizData = null;
        if (quizRes.ok) {
          quizData = await quizRes.json();
        }
        // 2. Получаем историю и программу (всё в одном файле)
        let weeklyRes = await fetch(`${API_URL}/api/user/weekly-program/${tgUserId}`);
        if (weeklyRes.ok) {
          const weeklyProgram = await weeklyRes.json();
          setWeekData(weeklyProgram);
          setAnswers(quizData ? { ...quizData, userId: tgUserId } : null);
          setShowTodayBlock(true);
          setIsLoadingUserData(false);
          setShowSplash(false);
          return;
        } else if (weeklyRes.status === 410) {
          // Программа устарела — пересоздаём
          const regenRes = await fetch(`${API_URL}/api/user/weekly-program/${tgUserId}/regenerate`, { method: 'POST' });
          if (regenRes.ok) {
            const newProgram = await regenRes.json();
            setWeekData(newProgram);
            setAnswers(quizData ? { ...quizData, userId: tgUserId } : null);
            setShowTodayBlock(true);
            setIsLoadingUserData(false);
            setShowSplash(false);
            return;
          }
        } else if (weeklyRes.status === 404) {
          if (!quizData) {
            // Нет квиза — показываем форму квиза, не создаём программу!
            setShowQuiz(true);
            setIsLoadingUserData(false);
            setShowSplash(false);
            return;
          }
          // Есть квиз — создаём программу
          const createRes = await fetch(`${API_URL}/api/user/weekly-program/${tgUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...quizData, userId: tgUserId })
          });
          if (createRes.ok) {
            // После создания ждем и пробуем получить программу с задержкой и retry
            for (let i = 0; i < retries; i++) {
              await new Promise(res => setTimeout(res, delay));
              let retryRes = await fetch(`${API_URL}/api/user/weekly-program/${tgUserId}`);
              if (retryRes.ok) {
                const programData = await retryRes.json();
                setWeekData(programData);
                setAnswers(quizData ? { ...quizData, userId: tgUserId } : null);
                setShowTodayBlock(true);
                setIsLoadingUserData(false);
                setShowSplash(false);
                return;
              }
            }
          }
        } else if (weeklyRes.status === 404) {
          // Нет программы — создаём новую
          const createRes = await fetch(`${API_URL}/api/user/weekly-program/${tgUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quizData ? { ...quizData, userId: tgUserId } : { userId: tgUserId })
          });
          if (createRes.ok) {
            // После создания ждем и пробуем получить программу с задержкой и retry
            for (let i = 0; i < retries; i++) {
              await new Promise(res => setTimeout(res, delay));
              let retryRes = await fetch(`${API_URL}/api/user/weekly-program/${tgUserId}`);
              if (retryRes.ok) {
                const programData = await retryRes.json();
                setWeekData(programData);
                setAnswers(quizData ? { ...quizData, userId: tgUserId } : null);
                setShowTodayBlock(true);
                setIsLoadingUserData(false);
                setShowSplash(false);
                return;
              }
            }
          }
        }
        // Если не удалось получить/создать программу — fallback
        setAnswers(quizData ? { ...quizData, userId: tgUserId } : null);
        setShowTodayBlock(false);
        setIsLoadingUserData(false);
        setShowSplash(false);
      };
      fetchWithRetry();
    }
  }, [showSplash, tgUserId]);

  // Обновляем todayDay при изменении weekData
  useEffect(() => {
    if (answers && weekData && Array.isArray(weekData.days)) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const foundDay = weekData.days.find(d => d.date === todayStr);
      setTodayDay(foundDay);
      if (foundDay && !showTodayBlock) setShowTodayBlock(true);
    } else {
      setTodayDay(null);
    }
  }, [answers, weekData, showTodayBlock]);

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
    
    // Добавим проверку всех данных в localStorage
    console.log('📦 Содержимое localStorage:', Object.keys(localStorage));
    const programKeys = Object.keys(localStorage).filter(key => key.startsWith('program_'));
    console.log('🗂️ Программы в localStorage:', programKeys);
    
    // Проверим состояние переменных
    console.log('📊 Начальное состояние App:', {
      showSplash,
      showTodayBlock,
      answers,
      programId
    });
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

  useEffect(() => {
    // Автоматическое расширение окна Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.expand) {
      window.Telegram.WebApp.expand();
    }
    const timer = setTimeout(() => setShowSplash(false), 4000); // 4 секунды
    return () => clearTimeout(timer);
  }, []);

  // Проверка существующего пользователя - только после окончания splash и только если нет активного квиза
  useEffect(() => {
    console.log('🔍 useEffect проверки пользователя сработал, showSplash:', showSplash);
    // Проверяем только если splash уже не показывается
    if (showSplash) {
      console.log('⏳ Splash еще показывается, пропускаем проверку');
      return;
    }
    
    console.log('🚀 Splash закончился, запускаем проверку пользователя');
    
    const checkExistingUser = async () => {
      try {
        const userId = 'newtestuser999'; // ВРЕМЕННО ИЗМЕНЯЕМ для теста
        console.log('🔍 Проверяем существующего пользователя после splash:', userId);
        // Используем API_URL вместо localhost
        const response = await fetch(`${API_URL}/api/user/quiz-answers/${userId}`);
        console.log('📊 Ответ от backend:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (response.status === 404) {
          console.log('👤 Новый пользователь, квиз не найден - остаемся в квизе');
          // НЕ трогаем состояние - оставляем как есть (квиз)
          return;
        }
        
        if (response.ok) {
          const quizData = await response.json();
          console.log('✅ Найдены данные квиза:', quizData);
          
          // Проверяем есть ли уже сохраненная недельная программа
          let existingProgramId = localStorage.getItem('programId');
          let shouldCreateNewProgram = false;
          
          if (existingProgramId) {
            const existingProgram = localStorage.getItem(`program_${existingProgramId}`);
            if (existingProgram) {
              try {
                const program = JSON.parse(existingProgram);
                const createdAt = new Date(program.createdAt);
                const now = new Date();
                const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                
                console.log('📅 Проверка существующей программы:', {
                  programId: existingProgramId,
                  createdAt: program.createdAt,
                  daysPassed,
                  isExpired: daysPassed >= 7
                });
                
                if (daysPassed >= 7) {
                  console.log('⏰ Программа устарела (прошло 7+ дней), нужно создать новую');
                  shouldCreateNewProgram = true;
                } else {
                  console.log('✅ Программа актуальна, используем существующую');
                  setProgramId(existingProgramId);
                  setAnswers(quizData);
                  setShowTodayBlock(true);
                  return;
                }
              } catch (error) {
                console.error('❌ Ошибка при парсинге существующей программы:', error);
                shouldCreateNewProgram = true;
              }
            } else {
              console.log('❌ Программа с ID не найдена в localStorage');
              shouldCreateNewProgram = true;
            }
          } else {
            console.log('❌ ProgramId не найден в localStorage');
            shouldCreateNewProgram = true;
          }
          
          if (shouldCreateNewProgram) {
            console.log('🔄 Создаем новую недельную программу на основе прогресса...');
            
            // Проверяем, есть ли API для получения недельной программы
            try {
              const weeklyResponse = await fetch(`${API_URL}/api/user/weekly-program/${userId}`);
              
              if (weeklyResponse.status === 410) {
                // Программа устарела на сервере, нужен пересчет
                console.log('⏰ Серверная программа тоже устарела, запрашиваем новую');
                const regenerateResponse = await fetch(`${API_URL}/api/user/weekly-program/${userId}/regenerate`, {
                  method: 'POST'
                });
                
                if (regenerateResponse.ok) {
                  const newProgram = await regenerateResponse.json();
                  console.log('✅ Новая программа получена с сервера:', newProgram);
                  
                  // Сохраняем новую программу
                  const newProgramId = `program_${userId}_${Date.now()}`;
                  localStorage.setItem(`program_${newProgramId}`, JSON.stringify(newProgram.program));
                  localStorage.setItem('programId', newProgramId);
                  setProgramId(newProgramId);
                  setAnswers(quizData);
                  setShowTodayBlock(true);
                  return;
                }
              } else if (weeklyResponse.ok) {
                // Есть актуальная программа на сервере
                const weeklyProgram = await weeklyResponse.json();
                console.log('✅ Получена актуальная программа с сервера:', weeklyProgram);
                
                const newProgramId = `program_${userId}_${Date.now()}`;
                localStorage.setItem(`program_${newProgramId}`, JSON.stringify(weeklyProgram));
                localStorage.setItem('programId', newProgramId);
                setProgramId(newProgramId);
                setAnswers(quizData);
                setShowTodayBlock(true);
                return;
              }
            } catch (serverError) {
              console.error('❌ Ошибка при работе с сервером:', serverError);
            }
            
            // Fallback: создаем демо программу
            console.log('🔄 Fallback: создаем демо программу');
            const demoProgram = createProgram(quizData);
            setProgramId(demoProgram);
            setAnswers(quizData);
            setShowTodayBlock(true);
          }
        } else {
          console.log('👤 Ошибка получения данных пользователя - остаемся в квизе');
          // НЕ трогаем состояние
        }
      } catch (error) {
        console.error('❌ Ошибка проверки пользователя:', error);
        // При ошибке явно скрываем splash и показываем fallback/demo
        setShowSplash(false);
        setShowTodayBlock(false);
        // Можно добавить показ заглушки или сообщения об ошибке
      }
    };

    // Запускаем проверку только через 1 секунду после исчезновения splash
    console.log('⏰ Устанавливаем таймер на проверку пользователя через 1 секунду');
    const timer = setTimeout(() => {
      console.log('⏰ Таймер сработал, запускаем checkExistingUser');
      checkExistingUser();
    }, 1000);
    return () => clearTimeout(timer);
  }, [showSplash]); // Зависимость от showSplash!

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
  function createProgram(quizAnswers) {
    const workoutsPerWeek = parseInt(quizAnswers.workouts_per_week) || 3;
    const location = quizAnswers.gym_or_home === 'gym' ? 'gym' : 'home'; // Исправлено: сравниваем с 'gym'
    const startDate = new Date(quizAnswers.start_date || new Date());
    const goal = quizAnswers.goal_weight_loss || 'weight_loss';
    const level = quizAnswers.training_level || 'beginner';
    // Получаем Telegram userId, если он есть
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const userId = quizAnswers.userId || tgUserId || 'user';
    
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
          { type: 'Завтрак', menu: getBreakfastByDiet(quizAnswers.diet_flags, i + 1), calories: 320, time: '08:00' },
          { type: 'Перекус', menu: getSnackByDiet(quizAnswers.diet_flags, i + 1), calories: 80, time: '11:00' },
          { type: 'Обед', menu: getLunchByDiet(quizAnswers.diet_flags, i + 1), calories: 450, time: '14:00' },
          { type: 'Полдник', menu: getSnackByDiet(quizAnswers.diet_flags, i + 1, true), calories: 120, time: '17:00' },
          { type: 'Ужин', menu: getDinnerByDiet(quizAnswers.diet_flags, i + 1), calories: 350, time: '19:00' }
        ],
        dailySteps: 0,
        dailyStepsGoal: level === 'beginner' ? 8000 : 10000,
        completedExercises: isWorkoutDay ? new Array(4).fill(null) : [],
        completedMealsArr: new Array(5).fill(null),
        completedWorkout: false,
        completedMeals: false
      };
      
      days.push(day);
    }
    
    // Сохраняем программу в localStorage
    const programId = `program_${userId}_${Date.now()}`;
    const program = {
      programId,
      userId,
      profile: quizAnswers,
      days,
      type: 'monthly',
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`program_${programId}`, JSON.stringify(program));
    
    console.log('✅ Демо программа создана:', programId);
    console.log('📅 Всего дней:', days.length);
    console.log('🏋️‍♀️ Тренировочных дней:', days.filter(d => d.isWorkoutDay).length);
    
    return programId;
  }

  async function handleQuizFinish(quizAnswers) {
    // Используем только Telegram userId или newtestuser999
    const userId = tgUserId || 'newtestuser999';
    quizAnswers.userId = userId;
    try {
      await safeFetch(`${API_URL}/api/user/quiz-answers/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizAnswers)
      });
    } catch (error) {
      console.error('❌ Ошибка сохранения квиза:', error);
    }
    setAnswers(quizAnswers);
    try {
      const demoProgramId = createProgram(quizAnswers);
      if (demoProgramId) {
        localStorage.setItem('programId', demoProgramId);
        setProgramId(demoProgramId);
      } else {
        console.error('❌ Не удалось создать демо-программу');
      }
    } catch (e) {
      console.error('❌ Ошибка при создании демо-программы:', e);
    }
    
    // Сразу после сохранения квиза - создаем и сохраняем недельную программу на сервере
    try {
      console.log('🔄 App.js: Сразу после сохранения квиза - создаем и сохраняем недельную программу на сервере');
      const weeklyProgramId = await createAndSaveWeeklyProgram(quizAnswers);
      if (weeklyProgramId) {
        console.log('✅ Новая недельная программа успешно создана и сохранена на сервере:', weeklyProgramId);
        localStorage.setItem('programId', weeklyProgramId);
        setProgramId(weeklyProgramId);
      } else {
        console.error('❌ Не удалось создать недельную программу на сервере');
      }
    } catch (e) {
      console.error('❌ Ошибка при создании недельной программы на сервере:', e);
    }
  }

  // Функция для создания и сохранения недельной программы на сервере
  async function createAndSaveWeeklyProgram(quizAnswers) {
    try {
      const userId = tgUserId || 'newtestuser999';
      // Генерируем объект программы
      const programId = createProgram(quizAnswers);
      const programData = JSON.parse(localStorage.getItem(`program_${programId}`));
      const response = await fetch(`${API_URL}/api/user/weekly-program/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programData)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // После создания делаем retry с задержкой для получения программы и отображения TodayBlock
      const retries = 5;
      const delay = 500;
      for (let i = 0; i < retries; i++) {
        await new Promise(res => setTimeout(res, delay));
        try {
          let retryRes = await fetch(`${API_URL}/api/user/weekly-program/${userId}`);
          if (retryRes.ok) {
            const weeklyProgram = await retryRes.json();
            setWeekData(weeklyProgram);
            setShowTodayBlock(true);
            setShowSplash(false);
            setIsLoadingUserData(false);
            console.log('✅ WeekData загружена после создания программы, TodayBlock активирован');
            break;
          }
        } catch (retryError) {
          console.warn(`Попытка ${i + 1} получить программу неудачна:`, retryError);
        }
      }
      
      return data.program?.program?.programId || null;
    } catch (error) {
      console.error('❌ Ошибка при создании и сохранении недельной программы на сервере:', error);
      return null;
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
          title: location === 'gym' 
            ? `День ${workoutNumber} | Тренировка в зале`
            : `День ${workoutNumber} | Домашняя тренировка`,
          exercises: getExercisesForDay(location, workoutNumber, level),
          duration: level === 'beginner' ? 30 : 45,
          difficulty: level,
          location: location
        } : null,
        meals: [
          { type: 'Завтрак', menu: getBreakfastByDiet(quizAnswers.diet_flags, i + 1), calories: 320, time: '08:00' },
          { type: 'Перекус', menu: getSnackByDiet(quizAnswers.diet_flags, i + 1), calories: 80, time: '11:00' },
          { type: 'Обед', menu: getLunchByDiet(quizAnswers.diet_flags, i + 1), calories: 450, time: '14:00' },
          { type: 'Полдник', menu: getSnackByDiet(quizAnswers.diet_flags, i + 1, true), calories: 120, time: '17:00' },
          { type: 'Ужин', menu: getDinnerByDiet(quizAnswers.diet_flags, i + 1), calories: 350, time: '19:00' }
        ],
        dailySteps: 0,
        dailyStepsGoal: level === 'beginner' ? 8000 : 10000,
        completedExercises: isWorkoutDay ? new Array(4).fill(null) : [],
        completedMealsArr: new Array(5).fill(null),
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
    
    // Временно используем только fallback - базовые упражнения
    const exercises = getExercisesForDay(location, workoutNumber, level);
    console.log('🔧 ИИ fallback упражнения (количество):', exercises?.length);
    console.log('🔧 ИИ fallback упражнения (первое):', exercises?.[0]);
    
    return exercises;
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
        
        // Используем правильную начальную дату
        const startDate = new Date(quizAnswers.start_date || new Date());
        
        parsedResponse.weeks.forEach(week => {
          if (week.days && week.days.length > 0) {
            week.days.forEach(day => {
              // Вычисляем правильную дату для каждого дня
              const currentDate = new Date(startDate);
              currentDate.setDate(startDate.getDate() + days.length);
              
              const formattedDay = {
                date: day.date || currentDate.toISOString().slice(0, 10),
                title: currentDate.toLocaleDateString('ru-RU', { weekday: 'long' }),
                dayNumber: days.length + 1,
                isWorkoutDay: day.isWorkoutDay || false,
                workout: day.workout || null,
                meals: day.meals || [],
                dailySteps: 0,
                dailyStepsGoal: 10000,
                completedExercises: day.isWorkoutDay ? new Array(4).fill(null) : [], // Фиксированно 4 упражнения
                completedMealsArr: new Array(5).fill(null),
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
    const index = (dayNumber -  1) % options.length;
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

  // Отладочные логи для todayDay
  console.log('🔍 App.js RENDER: todayDay состояние:', {
    todayDay: todayDay,
    hasTodayDay: !!todayDay,
    todayWorkout: todayDay?.workout?.title,
    isWorkoutDay: todayDay?.isWorkoutDay,
    programId: programId,
    answers: !!answers
  });

  // Явный лог для контроля splash
  console.log('showSplash:', showSplash, 'isLoadingUserData:', isLoadingUserData);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', background: '#fff' }}>
      {showSplash ? (
        <SplashScreen />
      ) : showVideoTest ? (
        <div>
          <VideoTest />
        </div>
      ) : showAITest ? (
        <div>
          <AITestPage />
        </div>
      ) : null}

      {/* Dev-кнопки для теста, показывать только в режиме разработки */}
      {process.env.NODE_ENV === 'development' && showSplash && (
        <div>
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
        </div>
      )}

      {/* Аватарка пользователя из Telegram в правом верхнем углу */}
      {/* Показываем только на странице TestWeek (тренировочная неделя), но НЕ в профиле и НЕ на странице оплаты */}
      {!showSplash && showTestWeek && !showProfile && !isPaymentShown && (
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
          weekData={weekData}
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
        (() => {
          console.log('🎯 App.js РЕНДЕР: Передаем данные в TodayBlock:', {
            todayDay: !!todayDay,
            todayDayIsNull: todayDay === null,
            todayDayType: typeof todayDay,
            todayDayWorkout: todayDay?.workout?.title,
            todayDayIsWorkoutDay: todayDay?.isWorkoutDay,
            todayDayExercises: todayDay?.workout?.exercises?.length,
            todayDayDate: todayDay?.date,
            answers: !!answers,
            programId,
            fullTodayDay: todayDay
          });
          return null;
        })(),
        <TodayBlock 
          day={todayDay} 
          answers={answers}
          programId={programId}
          isPremium={isPremium}
          activatePremium={activatePremium}
          setIsPaymentShown={setIsPaymentShown}
          userAvatar={userAvatar}
          onProfileClick={() => setShowProfile(true)}
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
