import React, { useEffect, useState } from 'react';
import DayBlock from './DayBlock';
import TodayBlock from './TodayBlock';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';

export default function WeekPlan({ programId, week = 1 }) {
  useEffect(() => {
    console.log('WeekPlan mounted', programId);
  }, []);

  const [weekData, setWeekData] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/program/week?programId=${programId}&week=${week}`)
      .then(r => r.json())
      .then(setWeekData);
  }, [programId, week]);

  function handleToggle(date) {
    setWeekData(data => ({
      ...data,
      days: data.days.map(d => d.date === date ? { ...d, completed: !d.completed } : d)
    }));
    // TODO: отправить на backend отметку о выполнении
  }

  if (!weekData) return <div>Загрузка недели…</div>;

  // Определяем текущий день (по дате)
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = weekData.days.find(d => d.date === todayStr) || weekData.days[0];
  const todayWithProgramId = { ...today, programId };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 16 }}>
      <TodayBlock day={todayWithProgramId} />
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Неделя с {weekData.weekStart}</h2>
      {weekData.days.map(day => (
        <DayBlock key={day.date} day={day} onToggle={handleToggle} />
      ))}
    </div>
  );
}
