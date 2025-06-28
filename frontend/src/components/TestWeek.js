import React, { useState } from 'react';
import "../fonts/fonts.css";

export default function TestWeek({ onStartProgram }) {
  const [selectedDay, setSelectedDay] = useState(null);

  // Данные тренировочной недели
  const testWeekData = [
    { day: 'понедельник', date: '2 июля', unlocked: true },
    { day: 'вторник', date: '3 июля', unlocked: true },
    { day: 'среда', date: '4 июля', unlocked: true },
    { day: 'четверг', date: '5 июля', unlocked: false },
    { day: 'пятница', date: '6 июля', unlocked: false },
    { day: 'суббота', date: '7 июля', unlocked: false },
    { day: 'воскресенье', date: '8 июля', unlocked: false },
  ];

  function handleDayClick(index) {
    if (testWeekData[index].unlocked) {
      setSelectedDay(index);
      // Можно добавить логику открытия детального вида дня
    }
  }

  function handleCurrentDay() {
    // Переход к основной программе
    if (onStartProgram) {
      onStartProgram();
    }
  }

  function handleUnlock() {
    // Логика разблокировки/покупки
    console.log('Unlock/Purchase clicked');
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
      padding: '32px 16px 16px 16px',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Кнопка "ТЕКУЩИЙ ДЕНЬ" */}
      <button
        onClick={handleCurrentDay}
        style={{
          background: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)',
          borderRadius: 20,
          padding: '12px 24px',
          marginBottom: 32,
          boxShadow: '0px 4px 12px 0px rgba(79, 195, 247, 0.3)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
      >
        <div style={{
          fontFamily: 'NeutralFace-Bold',
          fontSize: 14,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: 0.5,
          textTransform: 'uppercase'
        }}>
          ТЕКУЩИЙ ДЕНЬ
        </div>
      </button>

      {/* Заголовок "ТРЕНИРОВОЧНАЯ НЕДЕЛЯ" */}
      <div style={{
        fontFamily: 'NeutralFace-Bold',
        fontSize: 24,
        fontWeight: 700,
        color: '#181818',
        marginBottom: 32,
        textAlign: 'center',
        letterSpacing: 0.5,
        textTransform: 'uppercase'
      }}>
        ТРЕНИРОВОЧНАЯ НЕДЕЛЯ
      </div>

      {/* Список дней */}
      <div style={{
        width: '100%',
        maxWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 32
      }}>
        {testWeekData.map((dayData, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(index)}
            disabled={!dayData.unlocked}
            style={{
              background: dayData.unlocked ? '#fff' : '#f5f5f5',
              border: dayData.unlocked ? '1px solid #e0e7ff' : '1px solid #d0d0d0',
              borderRadius: 30,
              padding: '16px 24px',
              cursor: dayData.unlocked ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: dayData.unlocked ? '0px 2px 8px 0px rgba(0, 0, 0, 0.1)' : 'none',
              outline: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: dayData.unlocked ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (dayData.unlocked) {
                e.target.style.borderColor = '#4FC3F7';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0px 4px 12px 0px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (dayData.unlocked) {
                e.target.style.borderColor = '#e0e7ff';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0px 2px 8px 0px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <div style={{
              fontFamily: 'NeutralFace',
              fontSize: 16,
              fontWeight: 500,
              color: dayData.unlocked ? '#181818' : '#999',
              textAlign: 'center',
              lineHeight: 1.2
            }}>
              {dayData.day}, {dayData.date}
            </div>
            
            {/* Замочек для заблокированных дней */}
            {!dayData.unlocked && (
              <div style={{
                position: 'absolute',
                right: 20,
                fontSize: 16,
                color: '#999'
              }}>
                🔒
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Кнопка разблокировки */}
      <button
        onClick={handleUnlock}
        style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
          borderRadius: 25,
          padding: '16px 32px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          boxShadow: '0px 4px 12px 0px rgba(255, 107, 53, 0.3)',
          marginTop: 16
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0px 6px 16px 0px rgba(255, 107, 53, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0px)';
          e.target.style.boxShadow = '0px 4px 12px 0px rgba(255, 107, 53, 0.3)';
        }}
      >
        <div style={{
          fontFamily: 'NeutralFace-Bold',
          fontSize: 16,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: 0.3
        }}>
          РАЗБЛОКИРОВАТЬ ПОЛНЫЙ ДОСТУП
        </div>
      </button>
    </div>
  );
}
