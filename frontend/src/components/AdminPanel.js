import React, { useEffect, useState } from 'react';

const ADMIN_IDS = [
  '123456789', // пример Telegram ID блогера Дианы
  '987654321', // пример Telegram ID блогера Зюли
];

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Ошибка загрузки статистики');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Получаем Telegram ID пользователя
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div style={{color:'red'}}>Ошибка: {error}</div>;
  if (!stats) return null;

  return (
    <div style={{padding:32}}>
      <h2>Админ-панель блогера</h2>
      {/* Показываем Telegram ID пользователя */}
      {tgUser?.id && (
        <div style={{marginBottom: 24, color: '#888', fontSize: 15}}>
          Ваш Telegram ID: <b>{tgUser.id}</b>
        </div>
      )}
      <div>Всего пользователей: <b>{stats.totalUsers}</b></div>
      <div>Премиум пользователей: <b>{stats.premiumUsers}</b></div>
      {/* Можно добавить больше статистики */}
      {stats.referralStats && (
        <div style={{marginTop:24}}>
          <h3>Реферальная статистика</h3>
          {Object.entries(stats.referralStats).map(([ref, count]) => (
            <div key={ref}>{ref}: {count} пользователей</div>
          ))}
        </div>
      )}
    </div>
  );
}
