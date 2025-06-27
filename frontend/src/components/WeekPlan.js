import React, { useEffect, useState } from 'react';
import DayBlock from './DayBlock';
import TodayBlock from './TodayBlock';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';

export default function WeekPlan({ programId, week = 1, unlocked = false, setUnlocked }) {
  useEffect(() => {
    console.log('WeekPlan mounted', programId);
  }, []);

  const [weekData, setWeekData] = useState(null);
  const [weekStats, setWeekStats] = useState(null);
  const [mode, setMode] = useState('week'); // 'week' | 'today'
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/program/week?programId=${programId}&week=${week}`)
      .then(r => r.json())
      .then(setWeekData);
    fetch(`${API_URL}/api/program/week-stats?programId=${programId}&week=${week}`)
      .then(r => r.json())
      .then(setWeekStats);
  }, [programId, week]);

  function handleToggle(date) {
    setWeekData(data => ({
      ...data,
      days: data.days.map(d => d.date === date ? { ...d, completed: !d.completed } : d)
    }));
    // TODO: отправить на backend отметку о выполнении
  }

  if (!weekData || !weekData.days) {
    // Мок-данные для теста UI (7 дней)
    const mockDays = [
      { date: '2024-06-03', title: 'Понедельник', workout: { title: 'Тренировка 1', exercises: [{ name: 'Приседания', reps: 15 }, { name: 'Отжимания', reps: 10 }] }, meals: [{ type: 'Завтрак', menu: 'Овсянка' }, { type: 'Обед', menu: 'Курица с рисом' }], completed: false },
      { date: '2024-06-04', title: 'Вторник', workout: { title: 'Тренировка 2', exercises: [{ name: 'Планка', reps: 60 }, { name: 'Выпады', reps: 12 }] }, meals: [{ type: 'Завтрак', menu: 'Яичница' }, { type: 'Обед', menu: 'Рыба с овощами' }], completed: false },
      { date: '2024-06-05', title: 'Среда', workout: { title: 'Тренировка 3', exercises: [{ name: 'Скручивания', reps: 20 }, { name: 'Приседания', reps: 15 }] }, meals: [{ type: 'Завтрак', menu: 'Творог' }, { type: 'Обед', menu: 'Гречка с курицей' }], completed: false },
      { date: '2024-06-06', title: 'Четверг', workout: { title: 'Тренировка 4', exercises: [{ name: 'Выпады', reps: 12 }, { name: 'Планка', reps: 60 }] }, meals: [{ type: 'Завтрак', menu: 'Омлет' }, { type: 'Обед', menu: 'Говядина с овощами' }], completed: false },
      { date: '2024-06-07', title: 'Пятница', workout: { title: 'Тренировка 5', exercises: [{ name: 'Отжимания', reps: 10 }, { name: 'Скручивания', reps: 20 }] }, meals: [{ type: 'Завтрак', menu: 'Гречка' }, { type: 'Обед', menu: 'Рыба с картофелем' }], completed: false },
      { date: '2024-06-08', title: 'Суббота', workout: { title: 'Тренировка 6', exercises: [{ name: 'Приседания', reps: 15 }, { name: 'Планка', reps: 60 }] }, meals: [{ type: 'Завтрак', menu: 'Овсянка' }, { type: 'Обед', menu: 'Курица с овощами' }], completed: false },
      { date: '2024-06-09', title: 'Воскресенье', workout: { title: 'Отдых', exercises: [] }, meals: [{ type: 'Завтрак', menu: 'Фрукты' }, { type: 'Обед', menu: 'Салат' }], completed: false },
    ];
    const daysToShow = unlocked ? mockDays.map(d => ({ ...d })) : mockDays;
    if (mode === 'today') {
      return <TodayBlock day={mockDays[0]} onBackToWeek={() => setMode('week')} />;
    }
    return <div style={{padding: 24}}>
      <div style={{marginTop: 48}}>
        <h2>Тестовая неделя</h2>
        {daysToShow.map((day, i) => (
          <DayBlock key={day.date} day={day} openable={unlocked ? true : i < 3} locked={unlocked ? false : i >= 3} />
        ))}
        {!unlocked && (
          <button
            style={{ fontSize: 20, padding: '16px 40px', borderRadius: 12, background: '#2196f3', color: '#fff', border: 'none', fontWeight: 700, marginTop: 32 }}
            onClick={() => setShowPayment(true)}
          >Открыть доступ ко всем дням</button>
        )}
        <button
          style={{ position: 'fixed', top: 24, left: 24, zIndex: 100, fontSize: 18, padding: '12px 32px', borderRadius: 12, background: '#e0e7ff', color: '#222', border: 'none', fontWeight: 700 }}
          onClick={() => setMode('today')}
        >Текущий день</button>
      </div>
      <div style={{color:'#888',marginTop:24}}>Это заглушка. Для реального ИИ будет подключён backend.</div>
      {showPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#fff', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2>Открыть доступ ко всем дням</h2>
          <p>Оформите подписку, чтобы получить доступ к полной программе на месяц.</p>
          <button style={{ fontSize: 22, padding: '16px 40px', borderRadius: 12, background: '#2196f3', color: '#fff', border: 'none', fontWeight: 700, marginTop: 32 }} onClick={() => { setUnlocked(true); setShowPayment(false); }}>Оплатить 499 ₽</button>
          <button style={{ marginTop: 24, fontSize: 18, color: '#2196f3', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setShowPayment(false)}>Назад</button>
        </div>
      )}
    </div>;
  }

  // Определяем текущий день (по дате)
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = weekData.days.find(d => d.date === todayStr) || weekData.days[0];
  const todayWithProgramId = { ...today, programId };

  if (mode === 'today') {
    return (
      <div style={{ width: '100vw', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff' }}>
        <TodayBlock day={todayWithProgramId} onBackToWeek={() => setMode('week')} />
      </div>
    );
  }

  if (showPayment) {
    return (
      <div style={{ width: '100vw', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <h2>Открыть доступ ко всем дням</h2>
        <p>Оформите подписку, чтобы получить доступ к полной программе на месяц.</p>
        <button style={{ fontSize: 22, padding: '16px 40px', borderRadius: 12, background: '#2196f3', color: '#fff', border: 'none', fontWeight: 700, marginTop: 32 }} onClick={() => alert('Заглушка оплаты!')}>Оплатить 499 ₽</button>
        <button style={{ marginTop: 24, fontSize: 18, color: '#2196f3', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setShowPayment(false)}>Назад</button>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff' }}>
      <button
        onClick={() => setMode('today')}
        style={{
          marginBottom: 16,
          width: '100%',
          padding: '18px 0',
          borderRadius: 12,
          background: '#e0e7ff',
          border: 'none',
          fontWeight: 700,
          fontSize: 22,
          cursor: 'pointer',
          boxShadow: '0 2px 8px #e0e7ff44',
          transition: 'background 0.2s'
        }}
      >
        Текущий день
      </button>
      {weekStats && (
        <div style={{ background: '#e0e7ff', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center', fontSize: 16 }}>
          <b>Прогресс недели:</b><br />
          Тренировки: {weekStats.workoutDone} из {weekStats.total} | Питание: {weekStats.mealsDone} из {weekStats.total}
        </div>
      )}
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Неделя с {weekData.weekStart}</h2>
      {weekData.days.map((day, i) => (
        <DayBlock
          key={day.date}
          day={day}
          openable={i < 3}
          locked={i >= 3}
        />
      ))}
      <button
        style={{ fontSize: 20, padding: '16px 40px', borderRadius: 12, background: '#2196f3', color: '#fff', border: 'none', fontWeight: 700, marginTop: 32 }}
        onClick={() => setShowPayment(true)}
      >Открыть доступ ко всем дням</button>
      <button
        style={{ position: 'fixed', top: 24, left: 24, zIndex: 100, fontSize: 18, padding: '12px 32px', borderRadius: 12, background: '#e0e7ff', color: '#222', border: 'none', fontWeight: 700 }}
        onClick={() => setMode('today')}
      >Текущий день</button>
    </div>
  );
}
