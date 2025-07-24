import React, { useState, useEffect } from 'react';

import dianaAvatar from '../assets/diana-avatar.png';
import { API_URL } from '../config/api';
import TypewriterPagedText from './TypewriterPagedText';
import SplashScreen from './SplashScreen';

// Компонент анимированной печатки: все строки сразу, буквы проявляются по очереди
const TypewriterText = ({ text, speed = 30 }) => {
  // Разбиваем текст на строки (по \n или по предложениям)
  const lines = (text || '').split(/\n|(?<=[.!?])\s+/g).filter(Boolean);
  // Считаем общее количество символов до каждой строки
  const lineOffsets = lines.reduce((arr, line, idx) => {
    arr.push((arr[idx - 1] || 0) + (lines[idx - 1]?.length || 0));
    return arr;
  }, []);
  const totalChars = lines.reduce((sum, l) => sum + l.length, 0);
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    setVisibleChars(0);
    if (!totalChars) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleChars(i);
      if (i >= totalChars) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, totalChars, speed]);

  return (
    <div style={{ width: '100%' }}>
      {lines.map((line, idx) => {
        // Сколько символов уже можно показать в этой строке
        const start = lineOffsets[idx];
        const end = start + line.length;
        let charsToShow = 0;
        if (visibleChars > start) {
          charsToShow = Math.min(line.length, visibleChars - start);
        }
        return (
          <div key={idx} style={{ marginBottom: 4, minHeight: 24 }}>
            {line.split('').map((ch, i) => (
              <span key={i} style={{ opacity: i < charsToShow ? 1 : 0, transition: 'opacity 0.1s' }}>{ch}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
};


// Асинхронный анализ недели через OpenAI (только для 7-го дня)
async function fetchOpenAIDianaAnalysis(userId) {
  try {
    const response = await fetch(`${API_URL}/api/openai-diana-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (response.status === 429) {
      return { alreadyShown: true };
    }
    if (!response.ok) throw new Error('Ошибка анализа недели');
    const data = await response.json();
    return data?.message || 'Поздравляю с завершением недели! Ты большая молодец! 🎉';
  } catch (e) {
    console.error('Ошибка получения недельного анализа:', e);
    return 'Поздравляю с завершением недели! К сожалению, не удалось получить подробный анализ, но ты точно большая молодец! 🎉';
  }
}


const DianaNotification = ({ isVisible, onClose, userId, dayOfWeek, customMessage, aiAnalysis, notificationType, hasUncompletedTasks }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userSex, setUserSex] = useState('female'); // По умолчанию женский

  // Функция для получения пола пользователя
  const getUserSex = async () => {
    if (!userId) return 'female';
    
    try {
      const response = await fetch(`${API_URL}/api/user/quiz-answers/${userId}`);
      if (response.ok) {
        const quizData = await response.json();
        return quizData.sex || 'female';
      }
    } catch (error) {
      console.error('Ошибка получения пола пользователя:', error);
    }
    return 'female';
  };

  // Получаем пол пользователя при открытии уведомления
  useEffect(() => {
    if (isVisible && userId) {
      getUserSex().then(sex => {
        setUserSex(sex);
      });
    }
  }, [isVisible, userId]);

  // Обертка для onClose: при закрытии уведомления отправляем отметку на сервер
  const handleClose = async () => {
    if (userId && dayOfWeek) {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD формат
        await fetch(`${API_URL}/api/diana-notification-mark-shown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, dayOfWeek, date: today })
        });
        console.log(`📅 DianaNotification: отмечено как показано для дня ${dayOfWeek}, дата ${today}`);
      } catch (e) {
        console.error('Ошибка отметки показа уведомления:', e);
      }
    }
    onClose && onClose();
  };

  // Массивы мотивирующих напутствий для первого дня (разделены по полу)
  const greetingMessagesFemale = [
    "Новая неделя — новые возможности! Ты уже на шаг ближе к своей цели. Верь в себя и не останавливайся! 💪✨",
    "Ты невероятно сильная! Пусть эта неделя принесёт тебе радость, энергию и уверенность в своих силах. Вперёд к победам! 🌟",
    "Каждый понедельник — это шанс начать с чистого листа. Я рядом, чтобы поддержать тебя на каждом шаге! Давай сделаем эту неделю особенной! 🚀",
    "Ты уже доказала, что способна на многое. Пусть эта неделя будет наполнена маленькими победами и большим вдохновением! 🔥",
    "Смотри на себя с гордостью — ты выбрала путь перемен! Пусть каждый день этой недели будет шагом к лучшей версии себя. Я верю в тебя! 🌈"
  ];

  const greetingMessagesMale = [
    "Новая неделя — новые возможности! Ты уже на шаг ближе к своей цели. Верь в себя и не останавливайся! 💪✨",
    "Ты невероятно сильный! Пусть эта неделя принесёт тебе энергию, мотивацию и уверенность в своих силах. Вперёд к победам! 🌟",
    "Каждый понедельник — это шанс начать с чистого листа. Я рядом, чтобы поддержать тебя на каждом шаге! Давай сделаем эту неделю особенной! 🚀",
    "Ты уже доказал, что способен на многое. Пусть эта неделя будет наполнена маленькими победами и большим вдохновением! 🔥",
    "Смотри на себя с гордостью — ты выбрал путь перемен! Пусть каждый день этой недели будет шагом к лучшей версии себя. Я верю в тебя! 🌈"
  ];

  // Слушаем событие от TypewriterPagedText для перехода в TodayBlock
  useEffect(() => {
    if (!isVisible) return;
    const handler = () => { handleClose(); };
    window.addEventListener('goToTodayBlock', handler);
    return () => window.removeEventListener('goToTodayBlock', handler);
  }, [isVisible]);

  // Простые сообщения для разных дней без вызова AI
  const getSimpleMessage = (day, hasIncomplete, sex = 'female') => {
    if (day === 1) {
      // День 1 - случайное напутствие на новую неделю (с учетом пола)
      const greetingMessages = sex === 'male' ? greetingMessagesMale : greetingMessagesFemale;
      const idx = Math.floor(Math.random() * greetingMessages.length);
      return greetingMessages[idx];
    } else if (hasIncomplete) {
      // Дни 2-6 с невыполненными заданиями (с учетом пола)
      if (sex === 'male') {
        return "Вчера я заметила, что ты не выполнил все задания. Это нормально - иногда жизнь вносит свои коррективы! Рекомендую немного снизить нагрузку в настройках или скорректировать диету. Главное - не сдаваться! Сегодня новый день, и я верю в тебя! 🌟";
      } else {
        return "Вчера я заметила, что ты не выполнила все задания. Это нормально - иногда жизнь вносит свои коррективы! Рекомендую немного снизить нагрузку в настройках или скорректировать диету. Главное - не сдаваться! Сегодня новый день, и я верю в тебя! 🌟";
      }
    }
    return null;
  };

  useEffect(() => {
    if (!isVisible) return;
    
    // Приоритет 1: Если передан кастомный текст - используем его
    if (customMessage) {
      setMessage(customMessage);
      setLoading(false);
      return;
    }

    // Приоритет 2: Если передан AI анализ - используем его  
    if (aiAnalysis) {
      setMessage(aiAnalysis);
      setLoading(false);
      return;
    }

    // Приоритет 3: Определяем тип уведомления и показываем соответствующее сообщение
    if (notificationType === 'greeting') {
      // День 1 - случайное напутствие на новую неделю (с учетом пола)
      const greetingMessages = userSex === 'male' ? greetingMessagesMale : greetingMessagesFemale;
      const idx = Math.floor(Math.random() * greetingMessages.length);
      setMessage(greetingMessages[idx]);
      setLoading(false);
      return;
    }

    if (notificationType === 'motivation') {
      // Мотивирующие сообщения для null значений (с учетом пола)
      const motivationMessagesFemale = [
        "Помни о своей цели! Каждый день приближает тебя к результату. Даже небольшой прогресс лучше, чем никакого.",
        "Твое тело ждет заботы! Попробуй начать с малого - это поможет войти в ритм.",
        "Не забывай о себе! Регулярность - ключ к достижению цели, которую ты выбрала.",
        "Диана верит в тебя! Попробуй отметить хотя бы один пункт сегодня - это станет началом позитивных изменений.",
        "Твоя цель стоит усилий! Начни день с заботы о себе - отметь выполненные задания."
      ];

      const motivationMessagesMale = [
        "Помни о своей цели! Каждый день приближает тебя к результату. Даже небольшой прогресс лучше, чем никакого.",
        "Твое тело ждет заботы! Попробуй начать с малого - это поможет войти в ритм.",
        "Не забывай о себе! Регулярность - ключ к достижению цели, которую ты выбрал.",
        "Диана верит в тебя! Попробуй отметить хотя бы один пункт сегодня - это станет началом позитивных изменений.",
        "Твоя цель стоит усилий! Начни день с заботы о себе - отметь выполненные задания."
      ];

      const motivationMessages = userSex === 'male' ? motivationMessagesMale : motivationMessagesFemale;
      const idx = Math.floor(Math.random() * motivationMessages.length);
      setMessage(motivationMessages[idx]);
      setLoading(false);
      return;
    }

    if (notificationType === 'adjustment') {
      // Рекомендации по корректировке (уже передан customMessage)
      setMessage(customMessage || "Давайте адаптируем план под ваши возможности!");
      setLoading(false);
      return;
    }

    if (notificationType === 'ai') {
      // AI анализ для 7-го дня (уже передан aiAnalysis)
      setMessage(aiAnalysis || "Поздравляю с завершением недели! Ты большая молодец! 🎉");
      setLoading(false);
      return;
    }

    // Получаем простое сообщение для дней 1-6 (fallback)
    const simpleMsg = getSimpleMessage(dayOfWeek, hasUncompletedTasks, userSex);
    if (simpleMsg) {
      setMessage(simpleMsg);
      setLoading(false);
      return;
    }

    // День 7 - вызов AI для анализа недели (fallback если нет aiAnalysis)
    if (dayOfWeek === 7 && userId) {
      setMessage('');
      setLoading(true);
      fetchOpenAIDianaAnalysis(userId)
        .then(res => {
          if (res && res.alreadyShown) {
            // Если уже показывали сегодня — сразу закрыть модалку
            onClose && onClose();
            return;
          }
          if (typeof res === 'string') {
            console.log('AI weekly analysis:', res);
            setMessage(res);
          } else {
            console.log('AI weekly analysis:', res.message);
            setMessage(res.message);
          }
        })
        .catch(err => {
          console.error('Ошибка получения AI анализа:', err);
          setMessage('Не удалось получить анализ недели. Но ты молодец, что дошел(а) до 7-го дня! Продолжай в том же духе! 🎉');
        })
        .finally(() => setLoading(false));
    }
  }, [isVisible, userId, dayOfWeek, customMessage, aiAnalysis, notificationType, hasUncompletedTasks, userSex]);

  // Слушаем событие от TypewriterPagedText для перехода в TodayBlock
  useEffect(() => {
    if (!isVisible) return;
    const handler = () => { handleClose(); };
    window.addEventListener('goToTodayBlock', handler);
    return () => window.removeEventListener('goToTodayBlock', handler);
  }, [isVisible]);

  if (!isVisible) return null;
  
  // Не показываем уведомление, если нет сообщения и не идет загрузка
  if (!loading && !message) {
    console.warn('DianaNotification: Попытка показать пустое уведомление');
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #e3f0ff 0%, #b3d8ff 100%)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      transition: 'background 0.3s'
    }}>
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          width: 36,
          height: 36,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}
        aria-label="Закрыть"
      >×</button>
      {/* Крупная Диана без круглого фона */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'absolute',
          top: 32,
          left: 0,
          right: 0,
          marginTop: 0,
          zIndex: 2,
        }}
      >
        <img
          src={dianaAvatar}
          alt="Диана"
          style={{
            width: '70vw',
            maxWidth: 320,
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 0,
            boxShadow: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 2
          }}
        />
        <div
          style={{
            marginTop: 12,
            width: '90vw',
            maxWidth: 340,
            minWidth: 220,
            minHeight: 120,
            background: '#fff',
            borderRadius: 22,
            padding: '28px 18px 24px 18px',
            color: '#222',
            fontSize: 18,
            fontFamily: "'Montserrat Alternates', 'Montserrat', Arial, sans-serif",
            textAlign: 'left',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            boxSizing: 'border-box',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            zIndex: 3,
            maxHeight: 220,
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <SplashScreen />
          ) : (
            <TypewriterPagedText text={message} speed={28} charsPerPage={220} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DianaNotification;
