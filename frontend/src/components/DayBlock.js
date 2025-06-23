import React, { useState } from 'react';

export default function DayBlock({ day, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #e0e7ff', borderRadius: 12, marginBottom: 16, background: '#fff', boxShadow: '0 2px 8px #e0e7ff22' }}>
      <div style={{ padding: 16, cursor: 'pointer', fontWeight: 700, fontSize: 20 }} onClick={() => setOpen(v => !v)}>
        {day.title}, {day.date} {open ? '▲' : '▼'}
      </div>
      {open && (
        <div style={{ padding: 16, borderTop: '1px solid #e0e7ff' }}>
          {day.workout && (
            <div style={{ marginBottom: 12 }}>
              <b>Тренировка:</b> {day.workout.title}
              <ul>{day.workout.exercises.map((ex, i) => <li key={i}>{ex}</li>)}</ul>
            </div>
          )}
          <div>
            <b>Меню:</b>
            <ul>
              {day.meals.map((meal, i) => <li key={i}><b>{meal.type}:</b> {meal.menu}</li>)}
            </ul>
          </div>
          <button onClick={() => onToggle(day.date)} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, background: day.completed ? '#a7f3d0' : '#e0e7ff', border: 'none', fontWeight: 600 }}>
            {day.completed ? 'Выполнено' : 'Отметить как выполнено'}
          </button>
        </div>
      )}
    </div>
  );
}
