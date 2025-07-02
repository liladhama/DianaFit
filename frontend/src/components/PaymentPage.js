import React from 'react';
import dianaPayment from '../assets/payment/diana-payment.png';

export default function PaymentPage({ onClose, onPaymentSuccess }) {
  
  function handlePayment() {
    // Имитируем успешную оплату для тестирования
    console.log('🎯 Тестовая оплата - активируем премиум доступ');
    
    // Показываем сообщение об успешной активации
    alert('🎉 ТЕСТОВАЯ АКТИВАЦИЯ ПРЕМИУМА!\n\n✅ Премиум доступ активирован\n✅ Чат с ИИ-тренером открыт\n✅ 5 вопросов в день доступно\n\nТеперь вы можете пользоваться всеми функциями!');
    
    // Активируем премиум функции
    if (onPaymentSuccess) {
      console.log('🔥 Вызываем onPaymentSuccess для активации премиума');
      onPaymentSuccess();
    } else {
      console.error('❌ onPaymentSuccess не передан в PaymentPage');
    }
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
      padding: '16px 16px 32px 16px',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Кнопка назад */}
      <button 
        onClick={onClose} 
        style={{ 
          position: 'absolute', 
          top: 8, 
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

      {/* Контент оплаты */}
      <div style={{
        maxWidth: 340,
        textAlign: 'center',
        marginTop: 40,
        position: 'relative',
        zIndex: 10
      }}>
        {/* Заголовок */}
        <div style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 20,
          fontWeight: 800,
          color: '#181818',
          marginBottom: 28,
          textAlign: 'center'
        }}>
          Открыть доступ ко всем дням
        </div>

        {/* Описание */}
        <div style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 14,
          color: '#666',
          marginBottom: 20,
          lineHeight: 1.5
        }}>
          Оформите подписку, чтобы получить доступ к полной программе тренировок на месяц
        </div>

        {/* Преимущества */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '20px',
          marginBottom: 20,
          boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.1)',
          textAlign: 'left'
        }}>
          <div style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#181818',
            marginBottom: 12
          }}>
            Что входит в подписку:
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 14,
              color: '#333'
            }}>
              <span style={{ color: '#4FC3F7', fontSize: 14 }}>✓</span>
              Полная программа тренировок на месяц
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 13,
              color: '#333'
            }}>
              <span style={{ color: '#4FC3F7', fontSize: 14 }}>✓</span>
              Персональные рекомендации по питанию
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 13,
              color: '#333'
            }}>
              <span style={{ color: '#4FC3F7', fontSize: 14 }}>✓</span>
              Отслеживание прогресса
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 13,
              color: '#333'
            }}>
              <span style={{ color: '#4FC3F7', fontSize: 14 }}>✓</span>
              Поддержка ИИ-тренера
            </div>
          </div>
        </div>

        {/* Кнопка оплаты */}
        <button
          onClick={handlePayment}
          style={{
            background: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)',
            borderRadius: 25,
            padding: '18px 40px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            boxShadow: '0px 8px 20px 0px rgba(79, 195, 247, 0.6), 0px 2px 8px 0px rgba(0, 0, 0, 0.15)',
            width: '100%',
            marginBottom: 16
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0px 12px 28px 0px rgba(79, 195, 247, 0.7), 0px 4px 12px 0px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = '0px 8px 20px 0px rgba(79, 195, 247, 0.6), 0px 2px 8px 0px rgba(0, 0, 0, 0.15)';
          }}
        >
          <div style={{
            fontFamily: 'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.5px'
          }}>
            Оплатить 999 ₽
          </div>
        </button>
      </div>

      {/* Изображение Дианы внизу на всю страницу */}
      <div style={{
        position: 'fixed',
        bottom: -50,
        left: 0,
        width: '100vw',
        height: '50vh',
        overflow: 'hidden',
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        <img 
          src={dianaPayment} 
          alt="Диана" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center bottom',
            opacity: 1
          }}
        />
      </div>
    </div>
  );
}
