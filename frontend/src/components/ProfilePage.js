import React from 'react';

export default function ProfilePage({ onClose, unlocked, answers, onEditQuiz, onRestart }) {
  // Мок-данные для профиля
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || { first_name: 'Имя', last_name: '', photo_url: 'https://twa.netlify.app/ava.png' };
  const subDate = unlocked ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
  const subStr = subDate ? subDate.toLocaleDateString('ru-RU') : 'Нет подписки';
  // Мок-статистика
  const stats = { workouts: 47, meals: 38 };
  // Мок-ответы квиза
  const quizAnswers = answers || { name: 'Иван', sex: 'муж', age: 25, diet: 'мясной', goal: 'похудение' };

  return (
    <div style={{ width: '100vw', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'fixed', top: 24, left: 24, zIndex: 100, padding: '8px 24px', borderRadius: 12, background: '#e0e7ff', border: 'none', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>Назад</button>
      <div style={{ marginTop: 48, marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src={user.photo_url} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', boxShadow: '0 2px 8px #e0e7ff44', objectFit: 'cover', marginBottom: 12 }} />
        <div style={{ fontWeight: 700, fontSize: 22 }}>{user.first_name} {user.last_name}</div>
      </div>
      <div style={{ marginBottom: 24, fontSize: 18 }}>
        <b>Подписка:</b> {subStr}
      </div>
      <div style={{ marginBottom: 24, fontSize: 18 }}>
        <b>Статистика:</b><br />
        Тренировки: {stats.workouts}%<br />
        Питание: {stats.meals}%
      </div>
      <div style={{ marginBottom: 24, fontSize: 18, width: 320, maxWidth: '90vw', background: '#f6faff', borderRadius: 12, padding: 16 }}>
        <b>Ответы в квизе:</b><br />
        Имя: {quizAnswers.name}<br />
        Пол: {quizAnswers.sex}<br />
        Возраст: {quizAnswers.age}<br />
        Диета: {quizAnswers.diet}<br />
        Цель: {quizAnswers.goal}
        <button onClick={onEditQuiz} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 10, background: '#2196f3', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', float: 'right' }}>Edit</button>
      </div>
    </div>
  );
} 