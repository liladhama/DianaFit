import React from 'react';

export default function ProfilePage({ onClose }) {
  return (
    <div style={{ width: '100vw', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <h2>Личный кабинет</h2>
      <button onClick={onClose} style={{ marginTop: 32, padding: '12px 32px', borderRadius: 12, background: '#e0e7ff', border: 'none', fontWeight: 700, fontSize: 20, cursor: 'pointer' }}>Назад</button>
    </div>
  );
} 