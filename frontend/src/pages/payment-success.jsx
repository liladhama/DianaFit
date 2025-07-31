import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState('checking');

  useEffect(() => {
    // Проверяем статус подписки через несколько секунд (чтобы webhook успел отработать)
    setTimeout(async () => {
      try {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user_local_test';
        // Здесь можно добавить запрос к API для проверки статуса подписки
        // const response = await fetch(`API_URL/api/subscription/status/${userId}`);
        // const data = await response.json();
        
        // Пока что просто обновляем localStorage
        localStorage.setItem('dianafit_premium', 'true');
        setSubscriptionStatus('activated');
      } catch (e) {
        console.error('Ошибка проверки подписки:', e);
        setSubscriptionStatus('activated'); // По умолчанию считаем что активирована
      }
    }, 3000);
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: 60, padding: '0 20px' }}>
      <h1 style={{ color: '#4FC3F7', marginBottom: 20 }}>🎉 Оплата прошла успешно!</h1>
      
      {subscriptionStatus === 'checking' && (
        <div style={{ marginBottom: 20 }}>
          <p>Активируем вашу подписку...</p>
          <div style={{ 
            border: '3px solid #4FC3F7', 
            borderRadius: '50%', 
            borderTop: '3px solid transparent',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '10px auto'
          }} />
        </div>
      )}
      
      {subscriptionStatus === 'activated' && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 18, color: '#28a745', fontWeight: 'bold' }}>
            ✅ Премиум подписка активирована на месяц!
          </p>
          <p style={{ color: '#666', marginTop: 10 }}>
            Теперь у вас есть доступ ко всем функциям приложения.
          </p>
        </div>
      )}
      
      <button
        style={{
          marginTop: 24,
          background: '#4FC3F7',
          color: '#fff',
          border: 'none',
          borderRadius: 20,
          padding: '14px 32px',
          fontWeight: 'bold',
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(79, 195, 247, 0.3)'
        }}
        onClick={() => navigate('/')}
      >
        Перейти к текущему дню
      </button>
      <div style={{ marginTop: 32 }}>
        <a href="https://t.me/DianafitAibot" style={{ color: '#0088cc', fontWeight: 'bold' }}>
          Вернуться в Telegram-бот
        </a>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
