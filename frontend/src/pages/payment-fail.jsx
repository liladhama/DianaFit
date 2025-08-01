import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    merchantOrderId: params.get('MERCHANT_ORDER_ID'),
    intid: params.get('intid'),
    amount: params.get('AMOUNT'),
    curId: params.get('CUR_ID'),
    reason: params.get('reason') || 'Не указана'
  };
}

export default function PaymentFail() {
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    const urlParams = getUrlParams();
    setPaymentInfo(urlParams);
    console.log('[PaymentFail] URL параметры:', urlParams);
  }, []);

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: 60, 
      padding: '0 20px',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ color: '#e53935', marginBottom: 30, fontSize: 24 }}>
        😞 Оплата не прошла
      </h1>
      
      <div style={{ 
        fontSize: 80, 
        marginBottom: 20 
      }}>❌</div>

      <div style={{ marginBottom: 30 }}>
        <p style={{ 
          fontSize: 20, 
          color: '#e53935', 
          fontWeight: 'bold',
          marginBottom: 15
        }}>
          Не удалось обработать платеж
        </p>
        
        {paymentInfo?.amount && (
          <div style={{ marginBottom: 20, color: '#666', fontSize: 16 }}>
            <p>Сумма: <strong>{paymentInfo.amount} ₽</strong></p>
            {paymentInfo.reason && (
              <p>Причина: <strong>{paymentInfo.reason}</strong></p>
            )}
          </div>
        )}

        <p style={{ color: '#666', fontSize: 16, lineHeight: 1.5 }}>
          Возможные причины:
        </p>
        <ul style={{ 
          textAlign: 'left', 
          display: 'inline-block', 
          color: '#666', 
          fontSize: 14,
          marginTop: 10,
          lineHeight: 1.6
        }}>
          <li>Недостаточно средств на карте</li>
          <li>Карта заблокирована банком</li>
          <li>Сетевая ошибка</li>
          <li>Неверные данные карты</li>
        </ul>
      </div>

      <div style={{ marginBottom: 30 }}>
        <button
          style={{
            marginRight: 15,
            marginBottom: 15,
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
          onClick={() => window.history.back()}
        >
          Попробовать еще раз
        </button>

        <button
          style={{
            marginBottom: 15,
            background: 'transparent',
            color: '#666',
            border: '2px solid #ddd',
            borderRadius: 25,
            padding: '13px 33px',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#4FC3F7';
            e.target.style.color = '#4FC3F7';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#ddd';
            e.target.style.color = '#666';
          }}
          onClick={() => navigate('/testweek')}
        >
          Продолжить бесплатно
        </button>
      </div>
      
      <div style={{ marginTop: 30 }}>
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

      <div style={{ marginTop: 25, color: '#999', fontSize: 14 }}>
        <p>Если проблема повторяется, свяжитесь с поддержкой</p>
      </div>
    </div>
  );
}
