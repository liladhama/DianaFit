

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getMerchantOrderId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('MERCHANT_ORDER_ID') || null;
}

const API_URL = process.env.REACT_APP_API_URL || 'https://dianafit.onrender.com';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Проверяем статус подписки через несколько секунд (чтобы webhook успел отработать)
    setTimeout(async () => {
      try {
        // Получаем userId из URL, если есть, иначе из Telegram WebApp
        const merchantOrderId = getMerchantOrderId();
        const userId = merchantOrderId || window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user_local_test';
        const response = await fetch(`${API_URL}/api/subscription/status/${userId}`);
        if (!response.ok) throw new Error('Ошибка запроса к серверу');
        const data = await response.json();
        if (data && data.status === 'active') {
          localStorage.setItem('dianafit_premium', 'true');
          setSubscriptionStatus('activated');
        } else {
          setSubscriptionStatus('not_activated');
        }
      } catch (e) {
        setError('Ошибка проверки подписки. Попробуйте позже.');
        setSubscriptionStatus('not_activated');
        console.error('Ошибка проверки подписки:', e);
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

      {subscriptionStatus === 'not_activated' && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 18, color: '#e53935', fontWeight: 'bold' }}>
            ❌ Не удалось активировать подписку.
          </p>
          <p style={{ color: '#666', marginTop: 10 }}>
            {error || 'Попробуйте обновить страницу чуть позже.'}
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
