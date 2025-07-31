import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentFail() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <h1>Оплата не удалась</h1>
      <p>Что-то пошло не так. Попробуйте ещё раз или свяжитесь с поддержкой.</p>
      <button
        style={{
          marginTop: 24,
          background: '#FF5252',
          color: '#fff',
          border: 'none',
          borderRadius: 20,
          padding: '14px 32px',
          fontWeight: 'bold',
          fontSize: 16,
          cursor: 'pointer'
        }}
        onClick={() => navigate('/testweek')}
      >
        Перейти к TestWeek
      </button>
      <div style={{ marginTop: 32 }}>
        <a href="https://t.me/DianafitAibot" style={{ color: '#0088cc', fontWeight: 'bold' }}>
          Вернуться в Telegram-бот
        </a>
      </div>
    </div>
  );
}
