import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { getWorkoutLocation, getDayId, getExerciseEnglishName } from '../utils/videoUtils';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';

// Мотивационные цитаты от Дианы
const motivationalQuotes = [
  "Не нужно быть идеальной. Нужно быть стабильной. — Диана",
  "Каждый день — это новая возможность стать лучше. — Диана",
  "Твое тело может. Твой разум сомневается. Слушай тело. — Диана",
  "Прогресс важнее совершенства. — Диана",
  "Твоя цель — не быть как все, а быть лучшей версией себя. — Диана"
];

// Получаем текущую дату в формате "Вторник, 25 июня"
const getCurrentDateString = () => {
  const now = new Date();
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
};

// Стили компонентов
const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  border: '1px solid #f0f0f0',
  width: '100%',
  boxSizing: 'border-box'
};

const headerStyle = {
  fontSize: 20,
  fontWeight: 700,
  color: '#1a1a1a',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const checkboxButtonStyle = (completed) => ({
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #e0e7ff',
  background: completed ? '#e0e7ff' : '#fff',
  color: completed ? '#2196f3' : '#666',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  marginTop: 8
});

export default function TodayBlock({ day, answers, onBackToWeek }) {
  // Если day не передан или невалиден — используем мок-день
  if (!day || !day.date) {
    day = {
      date: '2024-06-03',
      title: 'Понедельник',
      workout: { title: 'Домашняя тренировка №2', exercises: [ { name: 'Приседания', reps: 15 }, { name: 'Отжимания', reps: 10 } ] },
      meals: [ 
        { type: 'Завтрак', menu: 'Овсянка с ягодами', calories: 320 },
        { type: 'Перекус', menu: 'Греческий йогурт с орехами', calories: 180 },
        { type: 'Обед', menu: 'Курица с рисом и овощами', calories: 450 },
        { type: 'Полдник', menu: 'Яблоко с арахисовой пастой', calories: 200 },
        { type: 'Ужин', menu: 'Запеченная рыба с салатом', calories: 380 }
      ],
      completed: false,
      dailySteps: 7500,
      dailyStepsGoal: 10000
    };
  }

  // Проверяем, начинается ли программа сегодня или позже
  const programStartsLater = answers && answers.start_date && new Date(answers.start_date) > new Date();
  
  const [completedExercises, setCompletedExercises] = useState(
    day.workout?.exercises.map((ex, i) => day.completedExercises?.[i] || false) || []
  );
  const [completedMeals, setCompletedMeals] = useState(
    day.meals?.map((m, i) => day.completedMealsArr?.[i] || false) || []
  );
  const [dailySteps] = useState(day.dailySteps || 7500);
  const [stepsGoal] = useState(day.dailyStepsGoal || 10000);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Получаем случайную мотивационную цитату
  const todayQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  
  // Вычисляем общие калории и БЖУ
  const totalCalories = day.meals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 1530;
  const targetCalories = answers?.targetCalories || 1800; // Из квиза
  
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
    <div style={{ 
      width: '100vw', 
      minHeight: '100dvh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' 
    }}>
      {/* Шапка с кнопкой назад */}
      <div style={{ 
        padding: '16px 20px', 
        background: '#fff', 
        borderBottom: '1px solid #e2e8f0'
      }}>
        <button
          onClick={onBackToWeek}
          style={{
            fontSize: 16,
            padding: '8px 16px',
            borderRadius: 8,
            background: '#e0e7ff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#2196f3',
            whiteSpace: 'nowrap'
          }}
        >← К расписанию</button>
        
        {/* Заголовок под кнопкой */}
        <div style={{ 
          fontSize: 20, 
          fontWeight: 700, 
          color: '#1a1a1a', 
          textAlign: 'center',
          marginTop: 12
        }}>
          Текущий день
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        padding: '20px', 
        maxWidth: 480, 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {programStartsLater ? (
          // Показываем сообщение о том, что программа начнется позже
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#1a1a1a' }}>
              Программа начнется позже
            </div>
            <div style={{ fontSize: 16, color: '#666', lineHeight: 1.5, marginBottom: 20 }}>
              Вы выбрали начать тренировки {answers?.start_date ? new Date(answers.start_date).toLocaleDateString('ru-RU') : 'в выбранную дату'}. 
              До этого времени можете ознакомиться с недельным расписанием.
            </div>
            <div style={{ 
              background: '#e3f0ff', 
              borderRadius: 12, 
              padding: '16px', 
              border: '1px solid #2196f3',
              color: '#1976d2',
              fontSize: 14,
              fontWeight: 500 
            }}>
              💡 Подготовьтесь заранее: посмотрите упражнения и составьте список покупок для правильного питания
            </div>
          </div>
        ) : (
          <>
            {/* 1. Заголовок с датой */}
            <div style={{ ...cardStyle, textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Сегодня</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
                {getCurrentDateString()}
              </div>
            </div>

            {/* 2. Блок тренировки */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                🏋️‍♀️ Тренировка
              </div>
              
              {day.workout && day.workout.exercises && day.workout.exercises.length > 0 ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>
                    {day.workout.title || 'Тренировка'}
                  </div>
                  
                  {day.workout.exercises.map((ex, i) => {
                    const location = getWorkoutLocation(day.workout.title || day.workout.name);
                    const dayId = getDayId(day.workout.title || day.workout.name, location);
                    const exerciseName = getExerciseEnglishName(ex.name);
                    
                    return (
                      <div key={i} style={{ 
                        marginBottom: 20, 
                        padding: 16, 
                        background: '#f8fafc', 
                        borderRadius: 12,
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>
                          {ex.name}
                        </div>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                          {ex.reps} повторений
                        </div>
                        
                        {location && dayId && exerciseName ? (
                          <VideoPlayer 
                            location={location}
                            dayId={dayId}
                            exerciseName={exerciseName}
                            title={ex.name}
                          />
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            height: 120, 
                            background: '#e2e8f0', 
                            borderRadius: 8, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#94a3b8', 
                            fontSize: 14,
                            marginBottom: 12
                          }}>
                            🎥 Видео скоро
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleExerciseChange(i)}
                          style={{
                            ...checkboxButtonStyle(completedExercises[i]),
                            width: '100%'
                          }}
                        >
                          {completedExercises[i] ? '✅ Выполнено' : '⭕ Выполнить'}
                        </button>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center',
                  padding: 24,
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                  borderRadius: 12
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#2d5a2d', marginBottom: 8 }}>
                    Сегодня день отдыха
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    Прогуляйся 10 000 шагов 💪
                  </div>
                </div>
              )}
            </div>

            {/* 3. Блок питания */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                🥗 Питание на день
              </div>
              
              {/* БЖУ и Калории */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                background: '#f8fafc', 
                padding: 16, 
                borderRadius: 12,
                marginBottom: 16,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2196f3' }}>{totalCalories}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Ккал</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>120г</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Белки</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>80г</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Жиры</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>180г</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Углеводы</div>
                </div>
              </div>

              {/* Приемы пищи */}
              {day.meals && day.meals.map((meal, i) => (
                <div key={i} style={{
                  marginBottom: 12,
                  padding: 12,
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
                      {meal.type}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {meal.calories || 0} ккал
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    {meal.menu}
                  </div>
                  <button
                    onClick={() => handleMealChange(i)}
                    style={checkboxButtonStyle(completedMeals[i])}
                  >
                    {completedMeals[i] ? '✅ Съел' : '🍽️ Съесть'}
                  </button>
                </div>
              ))}
            </div>

            {/* 4. Блок активности */}
            <div style={cardStyle}>
              <div style={headerStyle}>
                🚶 Активность
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <div style={{ fontSize: 16, color: '#1a1a1a' }}>Шаги сегодня</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: dailySteps >= stepsGoal ? '#10b981' : '#2196f3' }}>
                  {dailySteps.toLocaleString()} / {stepsGoal.toLocaleString()}
                </div>
              </div>
              
              {/* Прогресс-бар шагов */}
              <div style={{ 
                height: 8, 
                background: '#e2e8f0', 
                borderRadius: 4, 
                overflow: 'hidden',
                marginBottom: 12 
              }}>
                <div style={{ 
                  width: `${Math.min((dailySteps / stepsGoal) * 100, 100)}%`, 
                  height: '100%', 
                  background: dailySteps >= stepsGoal ? '#10b981' : '#2196f3',
                  transition: 'width 0.3s ease' 
                }} />
              </div>
              
              <div style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                {dailySteps >= stepsGoal ? 
                  '🎉 Цель достигнута! Отлично!' : 
                  `Осталось ${(stepsGoal - dailySteps).toLocaleString()} шагов до цели`
                }
              </div>
            </div>

            {/* 5. Мотивация дня */}
            <div style={{
              ...cardStyle,
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              border: '1px solid #a5b4fc',
              textAlign: 'center',
              marginBottom: 24
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>💬</div>
              <div style={{ 
                fontSize: 16, 
                fontStyle: 'italic', 
                color: '#3730a3', 
                lineHeight: 1.4,
                fontWeight: 500
              }}>
                {todayQuote}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
