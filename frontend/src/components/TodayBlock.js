import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';

export default function TodayBlock({ day, onBackToWeek }) {
  // day: объект дня из weekData.days
  // Состояния для упражнений и приёмов пищи
  const [completedExercises, setCompletedExercises] = useState(
    day.workout?.exercises.map((ex, i) => day.completedExercises?.[i] || false) || []
  );
  const [completedMeals, setCompletedMeals] = useState(
    day.meals?.map((m, i) => day.completedMealsArr?.[i] || false) || []
  );

  // Генерация списка продуктов из меню (примитивно)
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
      background: '#f8fafc',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      boxShadow: '0 2px 8px #e0e7ff44',
      maxWidth: 420,
      margin: '0 auto 24px auto',
      position: 'relative'
    }}>
      <button
        onClick={onBackToWeek}
        style={{
          position: 'absolute', left: 24, top: 24, padding: '6px 16px', borderRadius: 8, background: '#e0e7ff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 16
        }}
      >К неделе</button>
      <h2 style={{ marginBottom: 12, marginTop: 0, textAlign: 'center' }}>Сегодня: {day.title} <span style={{fontSize:14, color:'#888'}}>({day.date})</span></h2>
      {day.workout ? (
        <div style={{ marginBottom: 16 }}>
          <b>Тренировка:</b> {day.workout.title}
          <ul style={{ margin: '8px 0 0 16px' }}>
            {day.workout.exercises.map((ex, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <input type="checkbox" checked={completedExercises[i]} onChange={() => handleExerciseChange(i)} style={{ marginRight: 8 }} />
                <span>{ex}</span>
                {/* Можно добавить подробности, если есть: <span style={{marginLeft:8, color:'#888'}}>({ex.details})</span> */}
              </li>
            ))}
          </ul>
        </div>
      ) : <div style={{ marginBottom: 16, color: '#888' }}>Сегодня нет тренировки</div>}
      <div style={{ marginBottom: 16 }}>
        <b>Меню на день:</b>
        <ul style={{ margin: '8px 0 0 16px' }}>
          {day.meals && day.meals.map((meal, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <input type="checkbox" checked={completedMeals[i]} onChange={() => handleMealChange(i)} style={{ marginRight: 8 }} />
              <span><b>{meal.type}:</b> {meal.menu}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <b>Список продуктов:</b>
        <ul style={{ margin: '8px 0 0 16px' }}>
          {products.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
    </div>
  );
}
