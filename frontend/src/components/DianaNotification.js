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


const DianaNotification = ({ isVisible, onClose, userId, dayOfWeek, customMessage, hasUncompletedTasks }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Обертка для onClose: при закрытии уведомления отправляем отметку на сервер
  const handleClose = async () => {
    if (userId && dayOfWeek) {
      try {
        await fetch(`${API_URL}/api/diana-notification-mark-shown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, dayOfWeek })
        });
        console.log(`📅 DianaNotification: отмечено как показано для дня ${dayOfWeek}`);
      } catch (e) {
        console.error('Ошибка отметки показа уведомления:', e);
      }
    }
    onClose && onClose();
  };

  // Массив мотивирующих напутствий для первого дня
  const greetingMessages = [
    "Новая неделя — новые возможности! Ты уже на шаг ближе к своей цели. Верь в себя и не останавливайся! 💪✨",
    "Ты невероятно сильная! Пусть эта неделя принесёт тебе радость, энергию и уверенность в своих силах. Вперёд к победам! 🌟",
    "Каждый понедельник — это шанс начать с чистого листа. Я рядом, чтобы поддержать тебя на каждом шаге! Давай сделаем эту неделю особенной! 🚀",
    "Ты уже доказала, что способна на многое. Пусть эта неделя будет наполнена маленькими победами и большим вдохновением! 🔥",
    "Смотри на себя с гордостью — ты выбрала путь перемен! Пусть каждый день этой недели будет шагом к лучшей версии себя. Я верю в тебя! 🌈"
  ];

  // Слушаем событие от TypewriterPagedText для перехода в TodayBlock
  useEffect(() => {
    if (!isVisible) return;
    const handler = () => { handleClose(); };
    window.addEventListener('goToTodayBlock', handler);
    return () => window.removeEventListener('goToTodayBlock', handler);
  }, [isVisible]);

  // Простые сообщения для разных дней без вызова AI
  const getSimpleMessage = (day, hasIncomplete) => {
    if (day === 1) {
      // День 1 - случайное напутствие на новую неделю
      const idx = Math.floor(Math.random() * greetingMessages.length);
      return greetingMessages[idx];
    } else if (hasIncomplete) {
      // Дни 2-6 с невыполненными заданиями
      return "Вчера я заметила, что ты не выполнил(а) все задания. Это нормально - иногда жизнь вносит свои коррективы! Рекомендую немного снизить нагрузку в настройках или скорректировать диету. Главное - не сдаваться! Сегодня новый день, и я верю в тебя! 🌟";
    }
    return null;
  };

  useEffect(() => {
    if (!isVisible) return;
    
    // Если передано кастомное сообщение - используем его
    if (customMessage) {
      setMessage(customMessage);
      setLoading(false);
      return;
    }

    // Получаем простое сообщение для дней 1-6
    const simpleMsg = getSimpleMessage(dayOfWeek, hasUncompletedTasks);
    if (simpleMsg) {
      setMessage(simpleMsg);
      setLoading(false);
      return;
    }

    // День 7 - вызов AI для анализа недели
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
  }, [isVisible, userId, dayOfWeek, customMessage, hasUncompletedTasks]);

  // Слушаем событие от TypewriterPagedText для перехода в TodayBlock
  useEffect(() => {
    if (!isVisible) return;
    const handler = () => { handleClose(); };
    window.addEventListener('goToTodayBlock', handler);
    return () => window.removeEventListener('goToTodayBlock', handler);
  }, [isVisible]);

  if (!isVisible) return null;
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
