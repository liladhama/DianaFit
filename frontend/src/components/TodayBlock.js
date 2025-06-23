import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';

export default function TodayBlock({ day, onBackToWeek }) {
  const [completedExercises, setCompletedExercises] = useState(
    day.workout?.exercises.map((ex, i) => day.completedExercises?.[i] || false) || []
  );
  const [completedMeals, setCompletedMeals] = useState(
    day.meals?.map((m, i) => day.completedMealsArr?.[i] || false) || []
  );

  const products = day.meals
    ? Array.from(new Set(day.meals.flatMap(m => m.menu.split(/,| /).map(s => s.trim()).filter(Boolean))))
    : [];

  const programId = day.programId;

  async function handleExerciseChange(idx) {
    const updated = completedExercises.map((v, i) => i === idx ? !v : v);
    setCompletedExercises(updated);
    if (programId) {
      await fetch(`${API_URL}/api/program/day-complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, date: day.date, completedExercises: updated })
      });
    }
  }

  async function handleMealChange(idx) {
    const updated = completedMeals.map((v, i) => i === idx ? !v : v);
    setCompletedMeals(updated);
    if (programId) {
      await fetch(`${API_URL}/api/program/day-complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, date: day.date, completedMealsArr: updated })
      });
    }
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      boxShadow: '0 2px 8px #e0e7ff44',
      maxWidth: 420,
      margin: '0 auto 24px auto',
      position: 'relative',
      textAlign: 'left'
    }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <button
          onClick={onBackToWeek}
          style={{
            fontSize: 22,
            padding: '12px 32px',
            borderRadius: 12,
            background: '#e0e7ff',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #e0e7ff44',
            margin: 0
          }}
        >К неделе</button>
      </div>
      <div style={{ marginBottom: 18 }}>
        <span style={{ fontSize: 26, fontWeight: 700 }}>День {day.title.replace(/\D/g, '')}</span>
        <span style={{ fontSize: 16, color: '#888', marginLeft: 10 }}>({day.date})</span>
      </div>
      {day.workout ? (
        <div style={{ marginBottom: 18 }}>
          <b>Тренировка:</b> {day.workout.title}
          <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
            {day.workout.exercises.map((ex, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <input type="checkbox" checked={completedExercises[i]} onChange={() => handleExerciseChange(i)} style={{ marginRight: 8 }} />
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : <div style={{ marginBottom: 16, color: '#888' }}>Сегодня нет тренировки</div>}
      <div style={{ marginBottom: 18 }}>
        <b>Меню на день:</b>
        <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
          {day.meals && day.meals.map((meal, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <input type="checkbox" checked={completedMeals[i]} onChange={() => handleMealChange(i)} style={{ marginRight: 8 }} />
              <span><b>{meal.type}:</b> {meal.menu}</span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 32 }}>
        <b>Список продуктов:</b>
        <ul style={{ margin: '8px 0 0 18px' }}>
          {products.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
    </div>
  );
}
