import React, { useState } from 'react';

export default function DayBlock({ day, openable = true, locked = false }) {
  const [open, setOpen] = useState(false);
  if (locked) {
    return (
      <div style={{ border: '1px solid #e0e7ff', borderRadius: 12, marginBottom: 16, background: '#f3f4f6', boxShadow: '0 2px 8px #e0e7ff22', color: '#bbb', position: 'relative', opacity: 0.7 }}>
        <div style={{ padding: 16, fontWeight: 700, fontSize: 20, display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 8 }}>{day.title}, {day.date}</span>
          <span style={{ fontSize: 22, marginLeft: 'auto' }}>🔒</span>
        </div>
        <div style={{ padding: '0 16px 16px 16px', fontSize: 16 }}>
          <span>Открой доступ, чтобы увидеть детали дня</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ border: '1px solid #e0e7ff', borderRadius: 12, marginBottom: 16, background: '#fff', boxShadow: '0 2px 8px #e0e7ff22' }}>
      <div style={{ padding: 16, cursor: openable ? 'pointer' : 'default', fontWeight: 700, fontSize: 20 }} onClick={() => openable && setOpen(v => !v)}>
        {day.title}, {day.date} {openable ? (open ? '\u25b2' : '\u25bc') : null}
      </div>
      {openable && open && (
        <div style={{ padding: 16, borderTop: '1px solid #e0e7ff' }}>
          {day.workout ? (
            <div style={{ marginBottom: 12 }}>
              <b>Тренировка:</b> {day.workout.title || day.workout.name}
              <ul>{day.workout.exercises.map((ex, i) => <li key={i}>{ex.name} — {ex.reps} раз</li>)}</ul>
            </div>
          ) : (
            <div style={{ marginBottom: 12, color: '#666' }}>
              <b>🌿 День отдыха</b>
              <p style={{ margin: '8px 0', fontSize: 14 }}>Сегодня отдыхаем! Можно прогуляться или сделать лёгкую растяжку.</p>
            </div>
          )}
          <div>
            <b>Меню:</b>
            <ul>
              {day.meals.map((meal, i) => <li key={i}><b>{meal.menu || meal.meal || meal.type}:</b> {meal.menu || meal.meal}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
