import React, { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import StoryQuiz from './components/StoryQuiz';
import ProfilePage from './components/ProfilePage';
import DayBlock from './components/DayBlock';
import TodayBlock from './components/TodayBlock';
import PaymentPage from './components/PaymentPage';
import TestWeek from './components/TestWeek';
import VideoTest from './components/VideoTest';
import AITestPage from './components/AITestPage';
import { API_URL } from './config/api';
import DianaNotification from './components/DianaNotification';
import { VideoCacheProvider } from './components/VideoCacheContext';

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
  // --- Состояния ---
  const [dianaNotification, setDianaNotification] = useState(null); // { type, text, aiAnalysis }
  const [showDianaNotification, setShowDianaNotification] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [programId, setProgramId] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showToday, setShowToday] = useState(false);
  const [showTestWeek, setShowTestWeek] = useState(false);
  const [showTodayBlock, setShowTodayBlock] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [justReturnedFromPayment, setJustReturnedFromPayment] = useState(false); // Флаг возврата с оплаты
  // Универсальная функция перехода на страницу оплаты
  function handleUnlock() {
    setShowTrialExpiredModal(false);
    setShowTestWeek(false);
    setShowPayment(true);
    setJustReturnedFromPayment(false); // Сбрасываем флаг при переходе на оплату
    if (typeof setIsPaymentShown === 'function') setIsPaymentShown(true);
  }
  const [unlocked, setUnlocked] = useState(false);
  const [showVideoTest, setShowVideoTest] = useState(false);
  const [showAITest, setShowAITest] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [todayDay, setTodayDay] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isPaymentShown, setIsPaymentShown] = useState(false);
  const [tgUserId, setTgUserId] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true); // Новый флаг загрузки пользователя
  const [weekData, setWeekData] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false); // Новый стейт для показа квиза
  const [weekDataError, setWeekDataError] = useState(null); // Стейт для ошибки загрузки программы
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false); // Стейт для модального окна истечения пробного периода

  // Автоматический сброс флага justReturnedFromPayment через 5 секунд
  useEffect(() => {
    if (justReturnedFromPayment) {
      console.log('🔄 [PAYMENT FLAG] Установлен таймер сброса флага justReturnedFromPayment');
      const timer = setTimeout(() => {
        console.log('🔄 [PAYMENT FLAG] Автоматический сброс флага justReturnedFromPayment');
        setJustReturnedFromPayment(false);
      }, 5000); // 5 секунд
      
      return () => clearTimeout(timer);
    }
  }, [justReturnedFromPayment]);

  // --- Логика показа уведомлений Дианы по дням недели ---
  useEffect(() => {
    console.log('🔔 [УВЕДОМЛЕНИЯ] useEffect сработал с параметрами:', { 
      hasWeekData: !!weekData, 
      weekDataDaysIsArray: Array.isArray(weekData?.days),
      weekDataDaysLength: weekData?.days?.length,
      hasTodayDay: !!todayDay, 
      todayDayDate: todayDay?.date,
      hasTgUserId: !!tgUserId,
      tgUserId: tgUserId,
      showSplash: showSplash // Добавляем проверку статуса SplashScreen
    });
    
    // НОВАЯ ЛОГИКА: проверяем все условия, но НЕ скрываем SplashScreen заранее
    if (!weekData || !Array.isArray(weekData.days) || !todayDay || !tgUserId) {
      console.log('🔔 [УВЕДОМЛЕНИЯ] Базовые данные не готовы, ждем...');
      return;
    }
    
    console.log('🔔 [УВЕДОМЛЕНИЯ] Все данные готовы, проверяем необходимость уведомлений');
    
    // 🔒 НОВАЯ ПРОВЕРКА: Сначала проверяем доступ к программе (пробный период)
    fetch(`${API_URL}/api/program-access/${tgUserId}`)
      .then(res => res.json())
      .then(accessData => {
        console.log('🔒 [УВЕДОМЛЕНИЯ] Проверка доступа к программе:', accessData);
        
        // Если пробный период истек, НЕ показываем уведомления и перенаправляем в TestWeek
        if (!accessData.hasAccess && accessData.reason === 'trial_expired') {
          console.log('🔒 [УВЕДОМЛЕНИЯ] Пробный период истек - уведомления отключены, показываем TestWeek');
          setShowSplash(false);
          setShowTestWeek(true);
          setShowTodayBlock(false); // Явно отключаем TodayBlock
          // Показываем модалку только если пользователь НЕ вернулся с оплаты
          if (!justReturnedFromPayment) {
            setShowTrialExpiredModal({
              open: true,
              text: 'Для продолжения необходимо активировать премиум-доступ.'
            }); // Показываем универсальную модалку поверх TestWeek
          }
          return; // Прерываем выполнение - никаких уведомлений
        }
        
        // Если есть доступ, продолжаем обычную логику уведомлений
        console.log('🔔 [УВЕДОМЛЕНИЯ] Доступ есть, продолжаем проверку уведомлений');
        
        // Получаем первый день тренировок (начало цикла)
        const firstDayStr = weekData.days[0]?.date;
        if (!firstDayStr) {
          console.log('🔔 [УВЕДОМЛЕНИЯ] Нет данных о первом дне, скрываем SplashScreen');
          setShowSplash(false);
          setShowTodayBlock(true);
          return;
        }
        const todayStr = todayDay.date;
        // Считаем номер дня с начала программы (0-based)
        const dayDiff = Math.floor((new Date(todayStr) - new Date(firstDayStr)) / (1000*60*60*24));
        const weekDay = (dayDiff % 7) + 1; // 1...7

        // Проверяем, было ли уже показано уведомление сегодня (через Firestore)
        console.log('🔔 Проверяем статус уведомления для:', { userId: tgUserId, date: todayStr, weekDay });
        fetch(`${API_URL}/api/diana-notification-status?userId=${tgUserId}&date=${todayStr}&dayOfWeek=${weekDay}`)
          .then(async res => {
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
              const text = await res.text();
              console.error('Ожидался JSON, получен:', contentType, '\nПервые 500 символов ответа:', text.substring(0, 500));
              return null;
            }
            return res.json();
          })
          .then(async (data) => {
            console.log('🔔 Ответ от сервера о статусе уведомления:', data);
            if (!data) {
              console.log('🔔 Нет данных от сервера, скрываем SplashScreen и показываем TodayBlock');
              setShowSplash(false);
              setShowTodayBlock(true);
              return;
            }
            if (data && !data.shouldShow) {
              console.log('🔔 Уведомление уже показано сегодня, скрываем SplashScreen и показываем TodayBlock');
              setShowSplash(false); // Скрываем SplashScreen
              setShowTodayBlock(true);
              return; // Уже показано
            }

            // День 1 недели — мотивационное приветствие
            if (weekDay === 1) {
              console.log('🔔 Показываем приветствие для 1-го дня недели');
              const notification = {
                type: 'greeting'
              };
              console.log('🔔 Устанавливаем уведомление:', notification);
              setShowSplash(false); // Скрываем SplashScreen ПЕРЕД показом уведомления
              setDianaNotification(notification);
              setShowDianaNotification(true);
            }
            // День 7 недели — анализ ИИ
            else if (weekDay === 7) {
              // Получаем анализ ИИ с бэкенда
              try {
                const aiRes = await fetch(`${API_URL}/api/openai-diana-analyze`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: tgUserId })
                });
                const aiContentType = aiRes.headers.get('content-type') || '';
                let aiData = {};
                if (aiContentType.includes('application/json')) {
                  aiData = await aiRes.json();
                } else {
                  const aiText = await aiRes.text();
                  console.error('Ожидался JSON от openai-diana-analyze, получен:', aiContentType, '\nПервые 500 символов ответа:', aiText.substring(0, 500));
                  aiData = { analysis: 'Ошибка получения анализа ИИ.' };
                }
                setDianaNotification({
                  type: 'ai',
                  text: '', // Убираем заголовок, показываем только AI анализ
                  aiAnalysis: aiData?.message || aiData?.analysis || 'Нет данных анализа.'
                });
                setShowSplash(false); // Скрываем SplashScreen ПЕРЕД показом уведомления
                setShowDianaNotification(true);
              } catch (err) {
                setDianaNotification({
                  type: 'ai',
                  text: '', // Убираем заголовок, показываем только AI анализ  
                  aiAnalysis: 'Ошибка получения анализа ИИ.'
                });
                setShowSplash(false); // Скрываем SplashScreen ПЕРЕД показом уведомления
                setShowDianaNotification(true);
              }
            }
            // Дни 2-6 — мотивация при пропусках
            else if (weekDay >= 2 && weekDay <= 6) {
              // Находим вчерашний день
              const yesterdayDate = new Date(new Date(todayStr).getTime() - 86400000).toISOString().slice(0,10);
              const yesterday = weekData.days.find(d => d.date === yesterdayDate);
              
              console.log('🔔 [УВЕДОМЛЕНИЯ] Проверяем данные о вчерашнем дне:', {
                todayStr,
                yesterdayDate,
                yesterdayFound: !!yesterday,
                yesterdayIsWorkoutDay: yesterday?.isWorkoutDay,
                yesterdayHasWorkout: !!yesterday?.workout
              });
              
              if (yesterday) {
                // Получаем РЕАЛЬНЫЙ прогресс из API вместо weekData
                try {
                  const progressRes = await fetch(`${API_URL}/api/progress?userId=${tgUserId}&date=${yesterdayDate}`);
                  const progressData = await progressRes.json();
                  
                  console.log('🔔 [УВЕДОМЛЕНИЯ] Реальный прогресс из API:', progressData);
                  
                  // Анализируем есть ли тренировка в этот день
                  const isWorkoutDay = yesterday.isWorkoutDay || !!yesterday.workout;
                  
                  // Анализируем выполнение заданий из реального прогресса
                  const tasks = progressData.tasks || [];
                  const workoutTasks = tasks.filter(t => t.type === 'exercise');
                  const mealTasks = tasks.filter(t => t.type === 'meal');
                  
                  // Статусы для тренировок (только если был тренировочный день)
                  let workoutCompleted = null;
                  let workoutFailed = null;
                  let workoutIgnored = null;
                  
                  if (isWorkoutDay) {
                    if (workoutTasks.length > 0) {
                      const completedWorkouts = workoutTasks.filter(t => t.done === true);
                      const failedWorkouts = workoutTasks.filter(t => t.done === false);
                      
                      if (completedWorkouts.length === workoutTasks.length) {
                        workoutCompleted = true;
                      } else if (failedWorkouts.length > 0) {
                        workoutFailed = true;
                      } else {
                        workoutIgnored = true;
                      }
                    } else {
                      workoutIgnored = true; // Нет записей о тренировках
                    }
                  }
                  
                  // Статусы для питания
                  let mealsCompleted = null;
                  let mealsFailed = null;
                  let mealsIgnored = null;
                  
                  if (mealTasks.length > 0) {
                    const completedMeals = mealTasks.filter(t => t.done === true);
                    const failedMeals = mealTasks.filter(t => t.done === false);
                    
                    if (completedMeals.length === mealTasks.length && mealTasks.length >= 3) {
                      mealsCompleted = true;
                    } else if (failedMeals.length > 0) {
                      mealsFailed = true;
                    } else {
                      mealsIgnored = true;
                    }
                  } else {
                    mealsIgnored = true; // Нет записей о питании
                  }
                  
                  console.log('🔔 [УВЕДОМЛЕНИЯ] Анализ реального состояния вчерашнего дня:', {
                    isWorkoutDay,
                    workoutTasks: workoutTasks.length,
                    mealTasks: mealTasks.length,
                    workoutCompleted,
                    workoutFailed,
                    workoutIgnored,
                    mealsCompleted,
                    mealsFailed,
                    mealsIgnored
                  });
                  
                  // Если все задания выполнены - никаких уведомлений
                  if ((workoutCompleted || !isWorkoutDay) && mealsCompleted) {
                    console.log('🔔 [УВЕДОМЛЕНИЯ] Все задания выполнены вчера, уведомления не нужны');
                    setShowSplash(false); // Скрываем SplashScreen
                    setShowTodayBlock(true); // Показываем TodayBlock
                    return;
                  }
                  
                  // Логика уведомлений на основе реальных данных
                  // Если и упражнения, и питание провалены
                  if (isWorkoutDay && workoutFailed && mealsFailed) {
                    const notification = {
                      type: 'adjustment',
                      text: `Вчера были трудности с выполнением заданий. Рекомендую снизить количество тренировок в неделю и пересмотреть план питания или постараться следовать текущей диете. Адаптируем план под возможности!`
                    };
                    console.log('🔔 Устанавливаем общее уведомление (оба failed):', notification);
                    setDianaNotification(notification);
                    setShowSplash(false); // Скрываем SplashScreen перед показом уведомления
                    setShowDianaNotification(true);
                  }
                  // Если есть невыполненное упражнение (только в тренировочный день)
                  else if (isWorkoutDay && workoutFailed && !mealsFailed) {
                    const notification = {
                      type: 'adjustment',
                      text: `Вчера была трудность с выполнением тренировки. Рекомендую снизить количество тренировок в неделю. Адаптируем план под возможности!`
                    };
                    console.log('🔔 Устанавливаем уведомление по тренировкам:', notification);
                    setDianaNotification(notification);
                    setShowSplash(false); // Скрываем SplashScreen перед показом уведомления
                    setShowDianaNotification(true);
                  }
                  // Если есть невыполненный приём пищи
                  else if (mealsFailed && (!isWorkoutDay || !workoutFailed)) {
                    const notification = {
                      type: 'adjustment',
                      text: `Вчера была трудность с соблюдением плана питания. Можно попробовать другую диету или постараться следовать текущей. Каждый день — новая возможность!`
                    };
                    console.log('🔔 Устанавливаем уведомление по питанию:', notification);
                    setDianaNotification(notification);
                    setShowSplash(false); // Скрываем SplashScreen перед показом уведомления
                    setShowDianaNotification(true);
                  }
                  // Если оба проигнорированы или один из них проигнорирован
                  else if ((isWorkoutDay && workoutIgnored && mealsIgnored) || 
                           (!isWorkoutDay && mealsIgnored) ||
                           (isWorkoutDay && (workoutIgnored || mealsIgnored))) {
                    const motivationMessages = [
                      `Важно помнить о цели! Каждый день приближает к результату. Даже небольшой прогресс лучше, чем никакого.`,
                      `Тело ждет заботы! Попробуйте начать с малого — это поможет войти в ритм.`,
                      `Забота о себе важна! Регулярность — ключ к достижению выбранной цели.`,
                      `Я верю в успех! Попробуйте отметить хотя бы один пункт сегодня — это станет началом позитивных изменений.`,
                      `Цель стоит усилий! Начните день с заботы о себе — отметьте выполненные задания.`
                    ];
                    const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
                    const notification = {
                      type: 'motivation',
                      text: randomMessage
                    };
                    console.log('🔔 Устанавливаем мотивационное уведомление (ignored):', notification);
                    setDianaNotification(notification);
                    setShowSplash(false); // Скрываем SplashScreen перед показом уведомления
                    setShowDianaNotification(true);
                  }
                  
                } catch (progressError) {
                  console.error('🔔 [УВЕДОМЛЕНИЯ] Ошибка получения прогресса:', progressError);
                  // Показываем общее мотивационное уведомление при ошибке
                  const notification = {
                    type: 'motivation',
                    text: 'Важно помнить о цели! Каждый день приближает к результату. Даже небольшой прогресс лучше, чем никакого.'
                  };
                  console.log('🔔 Устанавливаем fallback уведомление при ошибке:', notification);
                  setDianaNotification(notification);
                  setShowSplash(false); // Скрываем SplashScreen перед показом уведомления
                  setShowDianaNotification(true);
                }
              } else {
                console.log('🔔 [УВЕДОМЛЕНИЯ] Вчерашний день не найден в weekData.days');
                // Скрываем SplashScreen и показываем TodayBlock
                setShowSplash(false);
                setShowTodayBlock(true);
              }
            } else {
              // Дни недели без уведомлений - скрываем SplashScreen и показываем TodayBlock
              console.log('🔔 [УВЕДОМЛЕНИЯ] День без уведомлений, скрываем SplashScreen и показываем TodayBlock');
              setShowSplash(false);
              setShowTodayBlock(true);
            }
          })
          .catch(err => {
            console.error('Ошибка при получении статуса уведомления Дианы:', err);
            // При ошибке получения статуса скрываем SplashScreen и показываем TodayBlock
            setShowSplash(false);
            setShowTodayBlock(true);
          });
        })
        .catch(err => {
          console.error('🔒 [УВЕДОМЛЕНИЯ] Ошибка проверки доступа к программе:', err);
          // При ошибке проверки доступа скрываем SplashScreen и показываем TodayBlock
          setShowSplash(false);
          setShowTodayBlock(true);
        });
  }, [weekData, todayDay, tgUserId]); // Убрали showSplash из зависимостей

  // --- Сохраняем факт показа уведомления в Firestore ---
  useEffect(() => {
    if (showDianaNotification && dianaNotification && todayDay && tgUserId && weekData && Array.isArray(weekData.days)) {
      const firstDayStr = weekData.days[0]?.date;
      const todayStr = todayDay.date;
      const dayDiff = Math.floor((new Date(todayStr) - new Date(firstDayStr)) / (1000*60*60*24));
      const weekDay = (dayDiff % 7) + 1;
      
      console.log('🔔 Отмечаем уведомление как показанное:', { userId: tgUserId, date: todayDay.date, dayOfWeek: weekDay });
      fetch(`${API_URL}/api/diana-notification-mark-shown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tgUserId, date: todayDay.date, dayOfWeek: weekDay })
      })
      .then(res => {
        console.log('🔔 Результат отметки показа:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('🔔 Ответ сервера на отметку показа:', data);
      })
      .catch(err => {
        console.error('🔔 Ошибка при отметке показа:', err);
      });
    }
  }, [showDianaNotification, dianaNotification, todayDay, tgUserId, weekData]);

  // Получаем Telegram userId при инициализации
  useEffect(() => {
    console.log('🔧 [INIT] Проверяем Telegram WebApp:', {
      hasTelegram: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      hasInitData: !!window.Telegram?.WebApp?.initDataUnsafe,
      hasUser: !!window.Telegram?.WebApp?.initDataUnsafe?.user,
      userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    });
    
    const id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (id) {
      setTgUserId(id.toString());
      console.log('✅ [INIT] Получен Telegram userId:', id, 'typeof:', typeof id, 'после toString:', id.toString());
    } else {
      // Fallback для локального тестирования
      const demoUserId = 'demo_user_local_test';
      setTgUserId(demoUserId);
      console.log('🔧 [INIT] Telegram userId не найден, используем demo userId для локального тестирования:', demoUserId);
    }
  }, []);

  // --- Загрузка answers/weekData по Telegram userId ---
  useEffect(() => {
    console.log('🔄 useEffect загрузки weekData:', { tgUserId, isLoadingUserData });
    if (tgUserId && !answers && !weekData) { // ИСПРАВЛЕНО: загружаем только когда нет данных
      console.log('✅ Условия выполнены, начинаем загрузку данных пользователя');
      console.log('[DEBUG] tgUserId:', tgUserId, 'typeof:', typeof tgUserId, '==', tgUserId == null ? 'null' : tgUserId);
      setIsLoadingUserData(true);
      const fetchWithRetry = async (retries = 5, delay = 400) => {
        console.log('📡 Начинаем fetch данных пользователя:', tgUserId);
        // 1. Получаем answers (квиз) по userId
        const quizRes = await fetch(`${API_URL}/api/user/quiz-answers/${tgUserId}`);
        let quizData = null;
        if (quizRes.ok) {
          const userData = await quizRes.json();
          
          // ПРОСТАЯ ЛОГИКА: если backend говорит "quiz есть: true", то просто берем userData.quiz
          quizData = userData.quiz;
          
          console.log('✅ Quiz данные загружены:', !!quizData);
          if (quizData) {
            console.log('[DEBUG] quizData содержит:', Object.keys(quizData || {}));
          } else {
            console.error('[DEBUG] ❌ quizData пустой, хотя backend сказал что quiz есть!');
            console.error('[DEBUG] userData:', userData);
          }
        } else {
          console.log('❌ Quiz данные не найдены, статус:', quizRes.status);
        }
        // 2. Получаем историю и программу (всё в одном файле)
        console.log('📡 Загружаем weekData...');
        let weeklyRes = await fetch(`${API_URL}/api/user/weekly-program/${tgUserId}`);
        if (weeklyRes.ok) {
          const weeklyProgram = await weeklyRes.json();
          console.log('✅ WeekData успешно загружена:', {
            hasDays: !!weeklyProgram.days,
            daysLength: weeklyProgram.days?.length,
            firstDay: weeklyProgram.days?.[0]?.date,
            lastDay: weeklyProgram.days?.[weeklyProgram.days?.length - 1]?.date
          });
          
          // Проверяем квиз перед показом TodayBlock
          console.log('[DEBUG FRONT] Проверка наличия квиза перед показом TodayBlock:', {
            quizDataExists: !!quizData,
            quizDataIsObject: typeof quizData === 'object',
            quizDataKeys: quizData ? Object.keys(quizData) : 'null',
            quizDataKeysLength: quizData ? Object.keys(quizData).length : 0,
            weeklyProgramExists: !!weeklyProgram,
            weeklyProgramDays: weeklyProgram?.days?.length || 0
          });
          
          // УБИРАЕМ ПРОВЕРКУ !quizData - backend говорит что квиз есть, значит показываем TodayBlock
          console.log('[DEBUG FRONT] Backend сказал что quiz есть, проверяем доступ к программе');
          
          // Проверяем доступ к программе (3-дневный пробный период)
          const accessData = await checkProgramAccess(tgUserId);
          
          setWeekData(weeklyProgram);
          setAnswers(quizData ? { ...quizData, userId: tgUserId } : { userId: tgUserId });
          
          // Если доступ запрещен - перенаправляем в TestWeek с уведомлением
          if (!accessData.hasAccess && accessData.reason === 'trial_expired') {
            console.log('🔒 [PROGRAM ACCESS] Пробный период истек, перенаправляем в TestWeek');
            setShowTestWeek(true);
            setIsLoadingUserData(false);
            // Показываем универсальное модальное окно о необходимости премиум
            setShowTrialExpiredModal({
              open: true,
              text: 'Для продолжения необходимо активировать премиум-доступ.'
            });
            return;
          }
          
          setShowTodayBlock(true);
          setIsLoadingUserData(false);
          // Убираем setShowSplash(false) - сплэш скроется по таймеру
          return;
        } else if (weeklyRes.status === 410) {
          console.log('⏰ Программа устарела, пересоздаем...');
          // Программа устарела — пересоздаём
          const regenRes = await fetch(`${API_URL}/api/user/weekly-program/${tgUserId}/regenerate`, { method: 'POST' });
          if (regenRes.ok) {
            const newProgram = await regenRes.json();
            console.log('✅ Новая программа создана:', !!newProgram.days);
            
            // Backend подтвердил наличие квиза, проверяем доступ к программе
            console.log('✅ Backend подтвердил квиз, проверяем доступ после пересоздания программы');
            
            // Проверяем доступ к программе (3-дневный пробный период)
            const accessData = await checkProgramAccess(tgUserId);
            
            setWeekData(newProgram);
            setAnswers(quizData ? { ...quizData, userId: tgUserId } : { userId: tgUserId });
            
            // Если доступ запрещен - перенаправляем в TestWeek с уведомлением
            if (!accessData.hasAccess && accessData.reason === 'trial_expired') {
              console.log('🔒 [PROGRAM ACCESS] Пробный период истек, перенаправляем в TestWeek');
              setShowTestWeek(true);
              setIsLoadingUserData(false);
              // Показываем универсальное модальное окно о необходимости премиум
              setShowTrialExpiredModal({
                open: true,
                text: 'Для продолжения необходимо активировать премиум-доступ.'
              });
              return;
            }
            
            setShowTodayBlock(true);
            setIsLoadingUserData(false);
            // Убираем setShowSplash(false) - сплэш скроется по таймеру
            return;
          }
        } else if (weeklyRes.status === 404) {
          // Backend сказал что квиз есть, поэтому создаем программу
          console.log('🔄 Создаем новую программу на основе квиза (backend подтвердил наличие квиза)');
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
                console.log('✅ Программа создана и загружена:', !!programData.days);
                
                // Проверяем доступ к программе (3-дневный пробный период)
                const accessData = await checkProgramAccess(tgUserId);
                
                setWeekData(programData);
                setAnswers(quizData ? { ...quizData, userId: tgUserId } : null);
                
                // Если доступ запрещен - перенаправляем в TestWeek с уведомлением
                if (!accessData.hasAccess && accessData.reason === 'trial_expired') {
                  console.log('🔒 [PROGRAM ACCESS] Пробный период истек, перенаправляем в TestWeek (fallback)');
                  setShowTestWeek(true);
                  setIsLoadingUserData(false);
                  // Показываем универсальное модальное окно о необходимости премиум
                  setShowTrialExpiredModal({
                    open: true,
                    text: 'Для продолжения необходимо активировать премиум-доступ.'
                  });
                  return;
                }
                
                setShowTodayBlock(true);
                setIsLoadingUserData(false);
                // Убираем setShowSplash(false) - сплэш скроется по таймеру
                return;
              }
            }
          }
        }
        // Если не удалось получить/создать программу — fallback
        console.log('❌ Не удалось загрузить weekData, fallback режим');
        if (quizData) {
          // Проверяем доступ к программе (3-дневный пробный период)
          const accessData = await checkProgramAccess(tgUserId);
          
          // Если доступ запрещен - перенаправляем в TestWeek с уведомлением
          if (!accessData.hasAccess && accessData.reason === 'trial_expired') {
            console.log('🔒 [PROGRAM ACCESS] Пробный период истек, перенаправляем в TestWeek (fallback)');
            setShowTestWeek(true);
            setIsLoadingUserData(false);
            // Показываем универсальное модальное окно о необходимости премиум
            setShowTrialExpiredModal({
              open: true,
              text: 'Для продолжения необходимо активировать премиум-доступ.'
            });
            return;
          }
          
          // Есть квиз — показываем TodayBlock даже без weekData
          setAnswers({ ...quizData, userId: tgUserId });
          setShowTodayBlock(true);
          setIsLoadingUserData(false);
          // Убираем setShowSplash(false) - сплэш скроется по таймеру
        } else {
          // Нет квиза — показываем форму квиза
          setShowQuiz(true);
          setIsLoadingUserData(false);
          // Убираем setShowSplash(false) - сплэш скроется по таймеру
        }
      };
      fetchWithRetry();
    } else {
      console.log('⏳ Условия не выполнены для загрузки данных:', { tgUserId, hasAnswers: !!answers, hasWeekData: !!weekData });
    }
  }, [tgUserId, answers, weekData]); // ИСПРАВЛЕНО: зависим от наличия данных

  // Обновляем todayDay при изменении weekData
  useEffect(() => {
    if (weekData && Array.isArray(weekData.days)) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const foundDay = weekData.days.find(d => d.date === todayStr);
      console.log('🗓️ Поиск текущего дня:', {
        todayStr,
        foundDay: !!foundDay,
        foundDayWorkout: foundDay?.workout?.title,
        allDates: weekData.days.map(d => d.date)
      });
      setTodayDay(foundDay);
      if (foundDay && !showTodayBlock) setShowTodayBlock(true);
    } else {
      console.log('🗓️ weekData недоступен или days не массив:', { weekData: !!weekData, isArray: Array.isArray(weekData?.days) });
      setTodayDay(null);
    }
  }, [weekData, showTodayBlock]);

  // Функция проверки доступа к программе (3-дневный пробный период)
  const checkProgramAccess = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/program-access/${userId}`);
      const accessData = await response.json();
      console.log('🔒 [PROGRAM ACCESS] Результат проверки:', accessData);
      return accessData;
    } catch (error) {
      console.error('❌ [PROGRAM ACCESS] Ошибка проверки доступа:', error);
      // Если ошибка запроса - разрешаем доступ (fallback)
      return { hasAccess: true, reason: 'api_error' };
    }
  };

  // Функция активации премиум доступа (для тестирования)
  const activatePremium = async () => {
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user_local_test';
    console.log('🎯 App.js: activatePremium вызван');
    try {
      const res = await fetch('https://dianafit.onrender.com/api/subscription/activate-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tgUserId })
      });
      const data = await res.json();
      if (data.success) {
        setIsPremium(true);
        setUnlocked(true);
        localStorage.setItem('dianafit_premium', 'true');
        console.log('🔥 App.js: Премиум доступ активирован на сервере!');
        
        // Закрываем все модальные окна
        setShowPayment(false);
        setShowTrialExpiredModal(false);
        
        // Перепроверяем доступ к программе после активации премиума
        const accessData = await checkProgramAccess(tgUserId);
        console.log('🔄 Проверка доступа к программе после активации премиума:', accessData);
        
        // После успешной активации премиума направляем пользователя в нужное место
        if (answers && weekData) {
          // Если есть программа, открываем TestWeek
          setShowTestWeek(true);
          setShowTodayBlock(false);
          console.log('🎯 После активации премиума: открываем TestWeek');
        } else if (answers) {
          // Если есть только ответы квиза, но нет программы
          setShowTestWeek(true);
          setShowTodayBlock(false);
          console.log('🎯 После активации премиума: открываем TestWeek (только ответы)');
        } else {
          // Если нет ни программы, ни ответов - возвращаем к началу
          setShowSplash(true);
          setShowTestWeek(false);
          setShowTodayBlock(false);
          console.log('🎯 После активации премиума: возвращаем к SplashScreen');
        }
        
      } else {
        console.error('❌ Ошибка активации премиум на сервере:', data);
      }
    } catch (err) {
      console.error('❌ Ошибка запроса на сервер для активации премиум:', err);
    }
  };

  // Проверяем статус подписки при входе в приложение
  React.useEffect(() => {
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user_local_test';
    async function checkPremium() {
      try {
        const res = await fetch(`https://dianafit.onrender.com/api/diana-limits/${tgUserId}`);
        const data = await res.json();
        if (data.isPremium) {
          setIsPremium(true);
          setUnlocked(true);
          localStorage.setItem('dianafit_premium', 'true');
          console.log('� Премиум активен, все функции открыты!');
        } else {
          setIsPremium(false);
          setUnlocked(false);
          localStorage.removeItem('dianafit_premium');
          console.log('� Премиум неактивен, базовые функции.');
        }
      } catch (e) {
        console.error('Ошибка проверки премиума:', e);
      }
    }
    checkPremium();
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
    
    // Убираем fallback таймер - SplashScreen скрывается только когда определяется судьба уведомления
    
  }, []);  // Убираем showDianaNotification из зависимостей

  // УДАЛЕН СТАРЫЙ useEffect - теперь используется только новая логика с Telegram userId и weekData

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
    // Используем Telegram userId или demo userId для локального тестирования
    const userId = tgUserId ? String(tgUserId) : 'demo_user_local_test';
    quizAnswers.userId = userId;
    // Определяем timezone пользователя
    quizAnswers.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('💾 Сохраняем квиз для userId:', userId, 'typeof:', typeof userId);
    try {
      await safeFetch(`${API_URL}/api/user/quiz-answers/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizAnswers)
      });
    } catch (error) {
      console.error('❌ Ошибка сохранения квиза:', error);
    }
    // --- Отправка калоража на бэкенд сразу после прохождения квиза ---
    try {
      // Формула расчёта калоража как в ProfilePage.js
      const weight = Number(quizAnswers.weight) || Number(quizAnswers.weight_kg) || 60;
      const height = Number(quizAnswers.height) || Number(quizAnswers.height_cm) || 165;
      const age = Number(quizAnswers.age) || 30;
      const sex = (quizAnswers.gender || quizAnswers.sex || 'female').toLowerCase();
      const activity = quizAnswers.activity_coef || 1.375;
      let bmr;
      if (sex === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
      const goal = Number(quizAnswers.goal);
      let deficit = 0;
      let calories;
      if ([3,4,5].includes(goal)) {
        deficit = goal * 7700 / 30;
        calories = Math.round(bmr * activity - deficit);
      } else {
        calories = Math.round(bmr * activity);
      }
      calories = Math.max(1400, calories);
      await safeFetch(`${API_URL}/api/user/calories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, caloriesNorm: calories })
      });
      console.log('✅ Калораж отправлен на бэкенд:', calories);
    } catch (err) {
      console.error('Ошибка отправки калоража на бэкенд:', err);
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
      const userId = tgUserId || 'demo_user_local_test';
      console.log('🔄 Создаем недельную программу для userId:', userId);
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
            // Убираем setShowSplash(false) - сплэш скроется по таймеру
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
      {/* --- Фирменное уведомление Дианы --- */}
      {showDianaNotification && (
        <DianaNotification
          isVisible={showDianaNotification}
          userId={tgUserId}
          dayOfWeek={(() => {
            if (!todayDay || !weekData || !Array.isArray(weekData.days)) return null;
            const firstDayStr = weekData.days[0]?.date;
            const todayStr = todayDay.date;
            const dayDiff = Math.floor((new Date(todayStr) - new Date(firstDayStr)) / (1000*60*60*24));
            return (dayDiff % 7) + 1;
          })()}
          customMessage={dianaNotification?.text}
          aiAnalysis={dianaNotification?.aiAnalysis}
          notificationType={dianaNotification?.type}
          hasUncompletedTasks={dianaNotification && dianaNotification.type === 'motivation'}
          onClose={() => {
            setShowDianaNotification(false);
            setShowTodayBlock(true);
          }}
        />
      )}
      {/* Видеотесты - только в dev режиме */}
      {showVideoTest ? (
        <div>
          <VideoTest />
        </div>
      ) : showAITest ? (
        <div>
          <AITestPage />
        </div>
      ) : null}

      {/* Dev-кнопки для теста, показывать только в режиме разработки И когда НЕТ уведомлений */}
      {process.env.NODE_ENV === 'development' && showSplash && !showDianaNotification && (
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


      
      {/* Основной контент приложения */}
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : showDianaNotification ? (
        <DianaNotification
          isVisible={showDianaNotification}
          userId={tgUserId}
          dayOfWeek={(() => {
            if (!todayDay || !weekData || !Array.isArray(weekData.days)) return null;
            const firstDayStr = weekData.days[0]?.date;
            const todayStr = todayDay.date;
            const dayDiff = Math.floor((new Date(todayStr) - new Date(firstDayStr)) / (1000*60*60*24));
            return (dayDiff % 7) + 1;
          })()}
          customMessage={dianaNotification?.text}
          aiAnalysis={dianaNotification?.aiAnalysis}
          notificationType={dianaNotification?.type}
          hasUncompletedTasks={dianaNotification && dianaNotification.type === 'motivation'}
          onClose={() => {
            setShowDianaNotification(false);
            setShowTodayBlock(true);
          }}
        />
      ) : showProfile ? (
        <ProfilePage
          onClose={() => setShowProfile(false)}
          unlocked={unlocked}
          isPremium={isPremium}
          activatePremium={activatePremium}
          answers={answers}
          userAvatar={userAvatar}
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
          answers={answers}
          userAvatar={userAvatar}
          onProfileClick={() => setShowProfile(true)}
          onStartProgram={() => {
            setShowTestWeek(false);
            setShowToday(true);
          }}
          onShowTodayBlock={async () => {
            // Проверяем доступ к программе перед переходом в TodayBlock
            if (!tgUserId) {
              console.error('❌ [PROGRAM ACCESS] tgUserId не найден');
              alert('Ошибка: не удалось определить пользователя');
              return;
            }
            
            // Если локально уже активирован премиум - разрешаем доступ сразу
            if (isPremium) {
              console.log('✅ [PROGRAM ACCESS] Премиум активен локально, переходим в TodayBlock');
              setShowTestWeek(false);
              setShowTodayBlock(true);
              return;
            }
            
            console.log('🔒 [PROGRAM ACCESS] Проверяем доступ к программе...');
            const accessData = await checkProgramAccess(tgUserId);
            console.log('🔒 [PROGRAM ACCESS] Результат проверки:', accessData);
            
            if (!accessData.hasAccess && accessData.reason === 'trial_expired') {
              console.log('🔒 [PROGRAM ACCESS] Доступ запрещен, НЕМЕДЛЕННО показываем уведомление о премиум');
              
              // Сбрасываем флаг возврата с оплаты перед показом модалки
              setJustReturnedFromPayment(false);
              
              // Показываем модалку немедленно без setTimeout
              console.log('🔒 [PROGRAM ACCESS] Устанавливаем showTrialExpiredModal = true');
              setShowTrialExpiredModal(true);
              console.log('🔒 [PROGRAM ACCESS] Модалка должна показаться!');
              return; // Остаемся в TestWeek
            }
            
            // Доступ разрешен - переходим в TodayBlock
            console.log('✅ [PROGRAM ACCESS] Доступ разрешен, переходим в TodayBlock');
            setShowTestWeek(false);
            setShowTodayBlock(true);
            setJustReturnedFromPayment(false); // Сбрасываем флаг при успешном переходе
          }}
        />
      ) : showPayment ? (
        <PaymentPage
          onClose={async () => {
            // Проверяем доступ после закрытия страницы оплаты
            const accessData = await checkProgramAccess(tgUserId);
            if (!accessData.hasAccess && accessData.reason === 'trial_expired') {
              console.log('🔒 [PAYMENT CLOSE] Пробный период истек, возвращаемся в TestWeek БЕЗ модалки');
              // Сначала устанавливаем TestWeek, потом закрываем Payment
              setShowTestWeek(true);
              setShowTodayBlock(false);
              setShowTrialExpiredModal(false);
              setJustReturnedFromPayment(true);
              setShowPayment(false);
            } else {
              console.log('✅ [PAYMENT CLOSE] Доступ есть, переходим в TodayBlock');
              setShowTestWeek(false);
              setShowTodayBlock(true);
              setJustReturnedFromPayment(false);
              setShowPayment(false);
            }
          }}
          onPaymentSuccess={activatePremium}
        />
      ) : (showTodayBlock && todayDay && !justReturnedFromPayment) || (showTodayBlock && answers && !weekData && !justReturnedFromPayment) ? (
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
        <>
          {weekDataError && (
            <div style={{color:'red',textAlign:'center',marginTop:20}}>{weekDataError}</div>
          )}
          <TodayBlock 
            day={todayDay} 
            answers={answers}
            programId={programId}
            isPremium={isPremium}
            activatePremium={activatePremium}
            setIsPaymentShown={setIsPaymentShown}
            setShowPayment={setShowPayment}
            userAvatar={userAvatar}
            onProfileClick={() => setShowProfile(true)}
            onBackToWeek={() => {
              setShowTodayBlock(false);
              setShowTestWeek(true);
            }} 
          />
        </>
      ) : showQuiz ? (
        <StoryQuiz onFinish={handleQuizFinish} />
      ) : (
        <StoryQuiz onFinish={handleQuizFinish} />
      )}

      {/* Модальное окно об истечении пробного периода */}
      {(() => {
        console.log('🔍 [MODAL RENDER] showTrialExpiredModal:', showTrialExpiredModal);
        console.log('🔍 [MODAL RENDER] justReturnedFromPayment:', justReturnedFromPayment);
        console.log('🔍 [MODAL RENDER] showTestWeek:', showTestWeek);
        const shouldShowModal = showTrialExpiredModal;
        console.log('🔍 [MODAL RENDER] shouldShowModal:', shouldShowModal);
        return shouldShowModal;
      })() && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              ⏰
            </div>
            <h2 style={{
              margin: '0 0 15px 0',
              color: '#2c3e50',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Необходим премиум-доступ
            </h2>
            <p style={{
              margin: '0 0 25px 0',
              color: '#7f8c8d',
              fontSize: '16px',
              lineHeight: '1.4'
            }}>
              Для продолжения использования программы необходимо активировать премиум-доступ.
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleUnlock}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
              >
                Подключить Premium
              </button>
              <button
                onClick={() => {
                  setShowTrialExpiredModal(false);
                  setJustReturnedFromPayment(true); // Устанавливаем флаг при закрытии модалки
                  // При закрытии модалки остаемся в TestWeek, не переходим в TodayBlock
                  console.log('🔒 [MODAL CLOSE] Модалка закрыта, остаемся в TestWeek');
                }}
                style={{
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Оборачиваем всё приложение в VideoCacheProvider
function AppWithCacheProvider(props) {
  return <VideoCacheProvider><App {...props} /></VideoCacheProvider>;
}

export default AppWithCacheProvider;
