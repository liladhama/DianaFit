
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    merchantOrderId: params.get('MERCHANT_ORDER_ID'),
    intid: params.get('intid'),
    amount: params.get('AMOUNT'),
    curId: params.get('CUR_ID')
  };
}

const API_URL = process.env.REACT_APP_API_URL || 'https://dianafit.onrender.com';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    const urlParams = getUrlParams();
    setPaymentInfo(urlParams);
    
    console.log('[PaymentSuccess] URL параметры:', urlParams);
    
    // Проверяем статус подписки через несколько секунд (чтобы webhook успел обработаться)
    const checkSubscription = async () => {
      try {
        // Извлекаем userId из MERCHANT_ORDER_ID
        let userId = 'demo_user_local_test';
        
        if (urlParams.merchantOrderId) {
          // MERCHANT_ORDER_ID имеет формат: userId_timestamp
          // Берём всё до последнего подчеркивания
          const idx = urlParams.merchantOrderId.lastIndexOf('_');
          userId = idx > 0 ? urlParams.merchantOrderId.substring(0, idx) : urlParams.merchantOrderId;
        } else if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
          userId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
        }
        
        console.log('[PaymentSuccess] Проверяем подписку для userId:', userId);
        
        const response = await fetch(`${API_URL}/api/subscription/status/${userId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[PaymentSuccess] Ответ сервера:', data);
        
        if (data && data.status === 'active') {
          localStorage.setItem('dianafit_premium', 'true');
          setSubscriptionStatus('activated');
        } else {
          setSubscriptionStatus('not_activated');
        }
        
      } catch (e) {
        console.error('[PaymentSuccess] Ошибка проверки подписки:', e);
        setError(`Ошибка проверки подписки: ${e.message}`);
        setSubscriptionStatus('error');
      }
    };
    
    // Запускаем проверку через 3 секунды
    setTimeout(checkSubscription, 3000);
  }, []);

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: 60, 
      padding: '0 20px',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ color: '#4FC3F7', marginBottom: 20, fontSize: 24 }}>
        🎉 Оплата прошла успешно!
      </h1>
      
      {paymentInfo?.amount && (
        <div style={{ marginBottom: 20, color: '#666', fontSize: 16 }}>
          <p>Сумма: <strong>{paymentInfo.amount} ₽</strong></p>
          {paymentInfo.intid && (
            <p>ID транзакции: <strong>{paymentInfo.intid}</strong></p>
          )}
        </div>
      )}

      {subscriptionStatus === 'checking' && (
        <div style={{ marginBottom: 30 }}>
          <p style={{ fontSize: 18, marginBottom: 15 }}>Активируем вашу подписку...</p>
          <div style={{
            border: '3px solid #4FC3F7',
            borderRadius: '50%',
            borderTop: '3px solid transparent',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      )}

      {subscriptionStatus === 'activated' && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ 
            fontSize: 60, 
            marginBottom: 15 
          }}>✅</div>
          <p style={{ 
            fontSize: 20, 
            color: '#28a745', 
            fontWeight: 'bold',
            marginBottom: 10
          }}>
            Премиум подписка активирована на месяц!
          </p>
          <p style={{ color: '#666', fontSize: 16 }}>
            Теперь у вас есть доступ ко всем функциям приложения
          </p>
        </div>
      )}

      {(subscriptionStatus === 'not_activated' || subscriptionStatus === 'error') && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ 
            fontSize: 60, 
            marginBottom: 15 
          }}>❌</div>
          <p style={{ 
            fontSize: 18, 
            color: '#e53935', 
            fontWeight: 'bold',
            marginBottom: 10
          }}>
            Не удалось активировать подписку
          </p>
          <p style={{ color: '#666', fontSize: 14 }}>
            {error || 'Попробуйте обновить страницу через несколько минут'}
          </p>
        </div>
      )}

      <button
        style={{
          marginBottom: 20,
          background: '#4FC3F7',
          color: '#fff',
          border: 'none',
          borderRadius: 25,
          padding: '15px 35px',
          fontWeight: 'bold',
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(79, 195, 247, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(79, 195, 247, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(79, 195, 247, 0.3)';
        }}
        onClick={() => navigate('/')}
      >
        Перейти к текущему дню
      </button>
      
      <div style={{ marginTop: 25 }}>
        <a 
          href="https://t.me/DianafitAibot" 
          style={{ 
            color: '#0088cc', 
            fontWeight: 'bold',
            textDecoration: 'none',
            fontSize: 16
          }}
        >
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
