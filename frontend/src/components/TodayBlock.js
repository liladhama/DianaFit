import React, { useState } from 'react';

export default function TodayBlock({ day }) {
  // day: объект дня из weekData.days
  const [workoutDone, setWorkoutDone] = useState(day.completedWorkout || false);
  const [mealsDone, setMealsDone] = useState(day.completedMeals || false);

  // Генерация списка продуктов из меню (примитивно)
  const products = day.meals
    ? Array.from(new Set(day.meals.flatMap(m => m.menu.split(/,| /).map(s => s.trim()).filter(Boolean))))
    : [];

  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      boxShadow: '0 2px 8px #e0e7ff44',
      maxWidth: 420,
      margin: '0 auto 24px auto'
    }}>
      <h2 style={{ marginBottom: 12 }}>Сегодня: {day.title} <span style={{fontSize:14, color:'#888'}}>({day.date})</span></h2>
      {day.workout ? (
        <div style={{ marginBottom: 16 }}>
          <b>Тренировка:</b> {day.workout.title}
          <ul style={{ margin: '8px 0 0 16px' }}>
            {day.workout.exercises.map((ex, i) => <li key={i}>{ex}</li>)}
          </ul>
          <label style={{ display: 'block', marginTop: 8 }}>
            <input type="checkbox" checked={workoutDone} onChange={e => setWorkoutDone(e.target.checked)} /> Выполнил тренировку
          </label>
        </div>
      ) : <div style={{ marginBottom: 16, color: '#888' }}>Сегодня нет тренировки</div>}
      <div style={{ marginBottom: 16 }}>
        <b>Меню на день:</b>
        <ul style={{ margin: '8px 0 0 16px' }}>
          {day.meals && day.meals.map((meal, i) => <li key={i}><b>{meal.type}:</b> {meal.menu}</li>)}
        </ul>
        <label style={{ display: 'block', marginTop: 8 }}>
          <input type="checkbox" checked={mealsDone} onChange={e => setMealsDone(e.target.checked)} /> Выполнил питание
        </label>
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
