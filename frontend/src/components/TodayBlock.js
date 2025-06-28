import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { getWorkoutLocation, getDayId, getExerciseEnglishName } from '../utils/videoUtils';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';

export default function TodayBlock({ day, onBackToWeek }) {
  // Если day не передан или невалиден — используем мок-день
  if (!day || !day.date) {
    day = {
      date: '2024-06-03',
      title: 'Понедельник',
      workout: { title: 'Тренировка 1', exercises: [ { name: 'Приседания', reps: 15 }, { name: 'Отжимания', reps: 10 } ] },
      meals: [ { type: 'Завтрак', menu: 'Овсянка' }, { type: 'Обед', menu: 'Курица с рисом' } ],
      completed: false
    };
  }

  const [completedExercises, setCompletedExercises] = useState(
    day.workout?.exercises.map((ex, i) => day.completedExercises?.[i] || false) || []
  );
  const [completedMeals, setCompletedMeals] = useState(
    day.meals?.map((m, i) => day.completedMealsArr?.[i] || false) || []
  );
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

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

  async function handleAnalyzeClick() {
    setLoadingAI(true);
    setAiAnalysis('');
    try {
      const res = await fetch(`${API_URL}/api/calculate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          completedExercises,
          completedMeals,
          feedback: 'analyze-today'
        })
      });
      const data = await res.json();
      setAiAnalysis(data.plan || 'Нет ответа от ИИ');
    } catch (e) {
      setAiAnalysis('Ошибка при обращении к ИИ');
    }
    setLoadingAI(false);
  }

  return (
    <div style={{ width: '100vw', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff' }}>
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
          margin: '32px auto 24px auto',
          display: 'block',
        }}
      >К расписанию</button>
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
        <div style={{ marginBottom: 18, marginTop: 0 }}>
          <span style={{ fontSize: 26, fontWeight: 700 }}>
            День {(day && typeof day.title === 'string' ? day.title.replace(/\D/g, '') : '')}
          </span>
          <span style={{ fontSize: 16, color: '#888', marginLeft: 10 }}>({day?.date || ''})</span>
        </div>
        {day.workout ? (
          <div style={{ marginBottom: 18 }}>
            <b>Тренировка:</b> {day.workout.title || day.workout.name}
            <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
              {day.workout.exercises.map((ex, i) => {
                const location = getWorkoutLocation(day.workout.title || day.workout.name);
                const dayId = getDayId(day.workout.title || day.workout.name, location);
                const exerciseName = getExerciseEnglishName(ex.name);
                
                return (
                  <li key={i} style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{ex.name} — {ex.reps} раз</div>
                    {location && dayId && exerciseName ? (
                      <VideoPlayer 
                        location={location}
                        dayId={dayId}
                        exerciseName={exerciseName}
                        title={ex.name}
                      />
                    ) : (
                      <div style={{ width: 120, height: 80, background: '#eee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
                        Видео<br />скоро
                      </div>
                    )}
                    <div>
                      <input type="checkbox" checked={completedExercises[i]} onChange={() => handleExerciseChange(i)} style={{ marginRight: 8 }} />
                      <span>Выполнено</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : <div style={{ marginBottom: 16, color: '#888' }}>Сегодня нет тренировки</div>}
        <div style={{ marginBottom: 18 }}>
          <b>Меню на день:</b>
          <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
            {day.meals && day.meals.map((meal, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <input type="checkbox" checked={completedMeals[i]} onChange={() => handleMealChange(i)} style={{ marginRight: 8 }} />
                <span><b>{meal.type}:</b> {meal.menu}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 32 }}>
          <b>Список продуктов на день:</b>
          <ul style={{ margin: '8px 0 0 18px' }}>
            {products.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div style={{ marginTop: 32 }}>
          {/* Кнопка анализа дня от ИИ временно убрана */}
          {aiAnalysis && (
            <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 16, marginTop: 8, color: '#222', fontSize: 16 }}>
              <b>Анализ и совет от ИИ:</b><br />
              {aiAnalysis}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
