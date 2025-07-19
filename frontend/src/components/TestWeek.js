import React, { useState } from 'react';
import PaymentPage from './PaymentPage';
import DianaChat from './DianaChat';
import "../fonts/fonts.css";
import "../styles/animations.css";
import chatDianaIcon from '../assets/icons/chat-diana-icon.png';

export default function TestWeek({ onStartProgram, onShowTodayBlock, isPremium: propIsPremium, activatePremium, setIsPaymentShown, weekData }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showDianaChat, setShowDianaChat] = useState(false);
  const [isPremium, setIsPremium] = useState(propIsPremium || false);

  // Данные тренировочной недели - только из weekData
  const getTestWeekData = () => {
    if (weekData && weekData.days && Array.isArray(weekData.days)) {
      const result = weekData.days.slice(0, 7).map((day, index) => ({
        day: day.title,
        date: new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
        unlocked: index < 3 || isPremium,
        planData: day
      }));
      return result;
    }
    return [];
  };
  const testWeekData = getTestWeekData();

  function handleDayClick(index) {
    if (testWeekData[index].unlocked) {
      setSelectedDay(selectedDay === index ? null : index); // Переключение: открыть/закрыть
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
    // Уведомляем родительский компонент
    if (setIsPaymentShown) {
      setIsPaymentShown(true);
    }
  }

  function handlePaymentSuccess() {
    console.log('🎯 TestWeek: handlePaymentSuccess вызван');
    
    // После успешной оплаты разблокируем все дни и активируем премиум
    setShowPayment(false);
    setIsPremium(true);
    console.log('🔥 TestWeek: setIsPremium(true) - локальное состояние обновлено');
    
    // Уведомляем родительский компонент что страница оплаты скрыта
    if (setIsPaymentShown) {
      setIsPaymentShown(false);
      console.log('🔥 TestWeek: setIsPaymentShown(false) - скрыли страницу оплаты');
    }
    
    // Активируем премиум в глобальном состоянии App.js
    if (activatePremium) {
      activatePremium();
      console.log('🔥 TestWeek: activatePremium() - глобальное состояние обновлено');
    } else {
      console.error('❌ TestWeek: activatePremium функция не передана');
    }
    
    // Автоматически открываем чат с Дианой после активации премиума
    setTimeout(() => {
      setShowDianaChat(true);
      console.log('🎉 TestWeek: Автоматически открыли чат с Дианой после активации премиума');
    }, 500);
    
    console.log('✅ Payment successful! All days unlocked, premium activated, chat opened.');
  }

  // Если показываем страницу оплаты
  if (showPayment) {
    return (
      <PaymentPage 
        onClose={() => {
          setShowPayment(false);
          // Уведомляем родительский компонент что страница оплаты скрыта
          if (setIsPaymentShown) {
            setIsPaymentShown(false);
          }
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <div
      className="slide-up-appear"
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(200,225,255,0.92) 0%, rgba(200,225,255,0.98) 100%)', // менее блеклый голубой
        padding: '32px 16px 16px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Иконка чата с Дианой в левом верхнем углу - всегда видна */}
      <button
        onClick={() => setShowDianaChat(true)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          width: '60px',
          height: '60px',
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
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
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
        
        {/* Замочек для заблокированного состояния */}
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
            border: '2px solid white'
          }}>
            🔒
          </div>
        )}
      </button>

      {/* Кнопка "ТЕКУЩИЙ ДЕНЬ" */}
      <button
        onClick={handleCurrentDay}
        style={{
          background: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)',
          borderRadius: 25,
          padding: '14px 28px',
          marginBottom: 8,
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

      {/* Тонкий бейдж статуса премиума прямо под кнопкой "ТЕКУЩИЙ ДЕНЬ" */}
      <div style={{
        background: isPremium ? '#4CAF50' : '#ff9800',
        color: 'white',
        padding: '3px 12px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
        maxWidth: '150px',
        opacity: 0.9
      }}>
        {isPremium ? '✅ ПРЕМИУМ' : '🔒 БАЗОВЫЙ'}
      </div>

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
          <div key={index}>
            <button
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
                opacity: dayData.unlocked ? 1 : 0.7,
                width: '100%'
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
            
            {/* Развернутый план дня */}
            {selectedDay === index && dayData.unlocked && (
              <div style={{
                marginTop: 12,
                padding: 16,
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: 12
                }}>
                  План на {dayData.day}
                </div>
                
                {/* Тренировка */}
                <div style={{
                  marginBottom: 12,
                  padding: 12,
                  background: '#fff',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>
                    🏋️‍♀️ Тренировка
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {dayData.planData && dayData.planData.workout ? (
                      <>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {dayData.planData.workout.title}
                        </div>
                        {dayData.planData.workout.exercises && dayData.planData.workout.exercises.map((ex, exIndex) => (
                          <div key={exIndex} style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
                            - {ex.name} — {ex.reps}
                          </div>
                        ))}
                      </>
                    ) : (
                      'Нет тренировки'
                    )}
                  </div>
                </div>
                
                {/* Питание */}
                <div style={{
                  padding: 12,
                  background: '#fff',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#059669', marginBottom: 8 }}>
                    🍽️ Питание
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {(() => {
                      // Примеры блюд для каждого типа
                      const fallbackMeals = {
                        'Завтрак': 'Овсянка с ягодами',
                        'Перекус': 'Протеиновый коктейль',
                        'Обед': 'Суп из чечевицы с овощами',
                        'Полдник': 'Авокадо-тост с томатами',
                        'Ужин': 'Лосось с лимоном и спаржей'
                      };
                      if (dayData.planData && dayData.planData.meals) {
                        return dayData.planData.meals.map((meal, mealIndex) => {
                          const mealInfo = meal.meal || { name: meal.menu || fallbackMeals[meal.type] || 'Блюдо' };
                          const mealName = typeof mealInfo === 'string' ? mealInfo : mealInfo.name;
                          // Если mealName пусто или "Не указано", подставляем пример
                          const showName = (!mealName || mealName === 'Не указано') ? (fallbackMeals[meal.type] || 'Блюдо') : mealName;
                          return (
                            <div key={mealIndex} style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
                              • {meal.type}: {showName}
                            </div>
                          );
                        });
                      } else {
                        // Если вообще нет массива, выводим все типы с примерами
                        return [
                          <div key="breakfast" style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>• Завтрак: Овсянка с ягодами</div>,
                          <div key="snack" style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>• Перекус: Протеиновый коктейль</div>,
                          <div key="lunch" style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>• Обед: Суп из чечевицы с овощами</div>,
                          <div key="afternoon" style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>• Полдник: Авокадо-тост с томатами</div>,
                          <div key="dinner" style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>• Ужин: Лосось с лимоном и спаржей</div>
                        ];
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Кнопка разблокировки */}
      {!isPremium && (
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
      )}

      {/* Чат с Дианой */}
      {showDianaChat && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 300,
          maxWidth: '80%',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          backgroundColor: '#fff',
          zIndex: 1000
        }}>
          <DianaChat 
            onClose={() => setShowDianaChat(false)} 
            isPremium={isPremium}
            activatePremium={activatePremium}
            setShowPayment={setShowPayment}
          />
        </div>
      )}
    </div>
  );
}
