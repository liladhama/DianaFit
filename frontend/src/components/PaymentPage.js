import React from 'react';
import "../styles/animations.css";
import dianaPayment from '../assets/payment/diana-payment.png';
import { API_URL } from '../config/api.js';

export default function PaymentPage({ onClose, onPaymentSuccess }) {
  
  
  async function handlePayment() {
    // Получаем Telegram userId
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user_local_test';
    try {
      console.log('🎯 Отправляем запрос на:', `${API_URL}/api/payment-link`);
      console.log('🎯 Данные:', { userId: tgUserId });
      
      // Запрос на backend для получения ссылки на оплату FreeKassa
      const res = await fetch(`${API_URL}/api/payment-link`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ 
          userId: tgUserId,
          email: window.Telegram?.WebApp?.initDataUnsafe?.user?.email || null,
          phone: window.Telegram?.WebApp?.initDataUnsafe?.user?.phone || null
        })
      });
      
      console.log('🎯 Статус ответа:', res.status);
      console.log('🎯 Response OK:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('🚨 Ошибка ответа:', errorText);
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('🎯 Данные ответа:', data);
      
      if (data.paymentUrl) {
        console.log('🎯 Переходим на страницу оплаты FreeKassa:', data.paymentUrl);
        // Открываем ссылку оплаты в том же окне
        window.location.href = data.paymentUrl;
      } else {
        alert('❌ Ошибка генерации ссылки оплаты: ' + (data.message || 'Неизвестная ошибка'));
      }
    } catch (e) {
      console.error('🚨 Полная ошибка:', e);
      console.error('🚨 Тип ошибки:', e.name);
      console.error('🚨 Стек ошибки:', e.stack);
      
      if (e.name === 'TypeError' && e.message.includes('Failed to fetch')) {
        alert('❌ Ошибка сети: Невозможно подключиться к серверу. Проверьте интернет-соединение или попробуйте позже.');
      } else {
        alert('❌ Ошибка соединения с сервером: ' + e.message);
      }
    }
  }

  return (
    <div
      className="slide-up-appear"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(120,180,255,0.98) 0%, rgba(150,200,255,0.97) 100%)',
        padding: '16px 16px 32px 16px',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
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
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 14,
              color: '#333'
            }}>
              <span style={{ color: '#4FC3F7', fontSize: 14 }}>✓</span>
              Персональные рекомендации по питанию
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 14,
              color: '#333'
            }}>
              <span style={{ color: '#4FC3F7', fontSize: 14 }}>✓</span>
              Отслеживание прогресса
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: 14,
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
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.5px'
          }}>
            Оплатить 1000 ₽
          </div>
        </button>
        {/* Безопасный отступ под кнопкой для любых устройств */}
        <div style={{ minHeight: '60px' }} />
      </div>

      {/* Диана всегда ниже кнопки */}
      <img 
        src={dianaPayment} 
        alt="Диана" 
        style={{
        width: '100%',
        maxWidth: 340,
        height: '48vh',
          objectFit: 'contain',
          objectPosition: 'center bottom',
        marginTop: '-56px',
        marginBottom: 0,
        display: 'block',
        marginLeft: '16px',
        overflow: 'visible',
        left: 'unset',
        transform: 'none'
        }}
      />
    </div>
  );
}
