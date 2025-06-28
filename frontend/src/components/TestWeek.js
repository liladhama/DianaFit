import React, { useState } from 'react';
import PaymentPage from './PaymentPage';
import "../fonts/fonts.css";

export default function TestWeek({ onStartProgram, onShowTodayBlock }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

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
    // Переход к TodayBlock
    if (onShowTodayBlock) {
      onShowTodayBlock();
    }
  }

  function handleUnlock() {
    // Показываем страницу оплаты
    setShowPayment(true);
  }

  function handlePaymentSuccess() {
    // После успешной оплаты разблокируем все дни
    setShowPayment(false);
    // Здесь можно добавить логику разблокировки дней
    console.log('Payment successful! All days unlocked.');
  }

  // Если показываем страницу оплаты
  if (showPayment) {
    return (
      <PaymentPage 
        onClose={() => setShowPayment(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
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
          borderRadius: 25,
          padding: '14px 28px',
          marginBottom: 24,
          boxShadow: '0px 4px 12px 0px rgba(79, 195, 247, 0.4)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
      >
        <div style={{
          fontFamily: 'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 14,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          ТЕКУЩИЙ ДЕНЬ
        </div>
      </button>

      {/* Заголовок "ТРЕНИРОВОЧНАЯ НЕДЕЛЯ" */}
      <div style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 22,
        fontWeight: 800,
        color: '#181818',
        marginBottom: 24,
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
        gap: 10,
        marginBottom: 24
      }}>
        {testWeekData.map((dayData, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(index)}
            disabled={!dayData.unlocked}
            style={{
              background: dayData.unlocked ? '#fff' : '#f5f5f5',
              border: 'none',
              borderRadius: 25,
              padding: '18px 24px',
              cursor: dayData.unlocked ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: dayData.unlocked ? '0px 4px 12px 0px rgba(0, 0, 0, 0.12)' : '0px 2px 6px 0px rgba(0, 0, 0, 0.06)',
              outline: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: dayData.unlocked ? 1 : 0.7
            }}
            onMouseEnter={(e) => {
              if (dayData.unlocked) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0px 6px 16px 0px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (dayData.unlocked) {
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0px 4px 12px 0px rgba(0, 0, 0, 0.12)';
              }
            }}
          >
            <div style={{
              fontFamily: 'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 16,
              fontWeight: 700,
              color: dayData.unlocked ? '#181818' : '#999',
              textAlign: 'center',
              lineHeight: 1.2,
              letterSpacing: '0.5px'
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
          padding: '18px 36px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          boxShadow: '0px 4px 12px 0px rgba(255, 107, 53, 0.4)',
          marginTop: 20
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0px 6px 16px 0px rgba(255, 107, 53, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0px)';
          e.target.style.boxShadow = '0px 4px 12px 0px rgba(255, 107, 53, 0.4)';
        }}
      >
        <div style={{
          fontFamily: 'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.5px'
        }}>
          РАЗБЛОКИРОВАТЬ ПОЛНЫЙ ДОСТУП
        </div>
      </button>
    </div>
  );
}
