import React from 'react';
import { getDietIcon, getDietName } from '../utils/dietUtils';

export default function ProfilePage({ onClose, unlocked, answers, onEditQuiz, onRestart }) {
  // Получаем данные пользователя
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || { first_name: 'Диана', last_name: '', photo_url: 'https://twa.netlify.app/ava.png' };
  
  // Мок-данные из ответов квиза
  const quizAnswers = answers || { 
    name: 'Диана', 
    age: 26, 
    diet_flags: 'meat',
    goal_weight_loss: 3
  };

  // Мок-статистика прогресса
  const progressData = {
    workouts: 79, // процент готовых тренировок
    nutrition: 56  // процент успехов в питании
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
      position: 'relative',
      padding: '32px 16px 32px 16px',
      boxSizing: 'border-box'
    }}>
      {/* Кнопка назад */}
      <button 
        onClick={onClose} 
        style={{ 
          position: 'absolute', 
          top: 16, 
          left: 16, 
          background: 'transparent', 
          border: 'none', 
          fontSize: 28, 
          color: '#333', 
          cursor: 'pointer', 
          padding: 8,
          zIndex: 100
        }}
      >
        ←
      </button>

      {/* Круглая фотография */}
      <div style={{
        width: 140,
        height: 140,
        borderRadius: '50%',
        overflow: 'hidden',
        marginBottom: 16,
        boxShadow: '0px 8px 24px 0px rgba(0, 0, 0, 0.15)',
        marginTop: 12
      }}>
        <img 
          src={user.photo_url} 
          alt="profile" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }} 
        />
      </div>

      {/* Имя */}
      <div style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 36,
        fontWeight: 800,
        color: '#000',
        marginBottom: 4,
        textAlign: 'center'
      }}>
        {quizAnswers.name || user.first_name}
      </div>

      {/* Возраст */}
      <div style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 22,
        color: '#666',
        marginBottom: 12,
        fontWeight: 600,
        textAlign: 'center'
      }}>
        {quizAnswers.age} лет
      </div>

      {/* Тип диеты */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 18,
        color: '#181818',
        fontWeight: 600
      }}>
        <span>ем {getDietName(quizAnswers.diet_flags)} пищу</span>
        <img 
          src={getDietIcon(quizAnswers.diet_flags)} 
          alt={getDietName(quizAnswers.diet_flags)}
          style={{ 
            width: 24, 
            height: 24, 
            objectFit: 'contain' 
          }}
        />
      </div>

      {/* Прогресс блоки */}
      <div style={{
        width: '100%',
        maxWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 32
      }}>
        {/* Готовые тренировки */}
        <div style={{
          background: '#E3F2FD',
          borderRadius: 25,
          padding: '16px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Прогресс-бар фон */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${progressData.workouts}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #42A5F5 0%, #1E88E5 50%, #1976D2 100%)',
            borderRadius: 25,
            transition: 'width 0.8s ease-in-out',
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)'
          }} />
          
          {/* Контент */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 16,
              color: '#fff',
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}>
              готовые тренировки
            </span>
            <span style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 22,
              color: '#fff',
              fontWeight: 800,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}>
              {progressData.workouts}%
            </span>
          </div>
        </div>

        {/* Успехи в питании */}
        <div style={{
          background: '#E3F2FD',
          borderRadius: 25,
          padding: '16px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Прогресс-бар фон */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${progressData.nutrition}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #42A5F5 0%, #1E88E5 50%, #1976D2 100%)',
            borderRadius: 25,
            transition: 'width 0.8s ease-in-out',
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)'
          }} />
          
          {/* Контент */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 16,
              color: '#fff',
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}>
              успехи в питании
            </span>
            <span style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 22,
              color: '#fff',
              fontWeight: 800,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}>
              {progressData.nutrition}%
            </span>
          </div>
        </div>
      </div>

      {/* Кнопка цели */}
      <button
        style={{
          background: '#fff',
          border: '2px solid #181818',
          borderRadius: 30,
          padding: '18px 48px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.1)',
          minWidth: 280
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0px 6px 16px 0px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0px)';
          e.target.style.boxShadow = '0px 4px 12px 0px rgba(0, 0, 0, 0.1)';
        }}
      >
        <span style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 20,
          color: '#181818',
          fontWeight: 800,
          textTransform: 'uppercase'
        }}>
          МОЯ ЦЕЛЬ -{quizAnswers.goal_weight_loss || 3} кг
        </span>
      </button>
    </div>
  );
} 