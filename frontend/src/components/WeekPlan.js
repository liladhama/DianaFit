import React, { useEffect, useState } from 'react';
import DayBlock from './DayBlock';

export default function WeekPlan({ programId, week = 1 }) {
  const [weekData, setWeekData] = useState(null);

  useEffect(() => {
    fetch(`/api/program/week?programId=${programId}&week=${week}`)
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

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 16 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Неделя с {weekData.weekStart}</h2>
      {weekData.days.map(day => (
        <DayBlock key={day.date} day={day} onToggle={handleToggle} />
      ))}
    </div>
  );
}
