import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import DianaChat from './DianaChat';
import { getWorkoutLocation, getDayId, getExerciseEnglishName, getVideoPathForExercise } from '../utils/videoUtils';

// Временно используем только production URL для тестирования ИИ
const API_URL = 'https://dianafit.onrender.com';

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

// Компонент для отображения приема пищи с граммовками
const MealCard = ({ meal, index, isCompleted, onToggleComplete }) => {
  const [showIngredients, setShowIngredients] = useState(false);

  // Получаем информацию о блюде (название + граммовки) 
  const mealInfo = meal.meal || { name: meal.menu || 'Не указано', ingredients: [] };
  const mealName = typeof mealInfo === 'string' ? mealInfo : mealInfo.name;
  const ingredients = typeof mealInfo === 'object' && mealInfo.ingredients ? mealInfo.ingredients : [];

  const checkboxButtonStyle = (completed) => ({
    padding: '8px 16px',
    backgroundColor: completed ? '#22c55e' : '#f1f5f9',
    color: completed ? 'white' : '#64748b',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%'
  });

  return (
    <div style={{
      marginBottom: 12,
      padding: 12,
      background: '#f8fafc',
      borderRadius: 8,
      border: '1px solid #e2e8f0'
    }}>
      {/* Заголовок приема пищи */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
          {meal.type}
        </div>
        <div style={{ fontSize: 14, color: '#666' }}>
          {meal.calories || 0} ккал
        </div>
      </div>

      {/* Название блюда */}
      <div style={{ fontSize: 14, color: '#666', marginBottom: 8, fontWeight: 500 }}>
        {mealName}
      </div>

      {/* Кнопка для разворачивания ингредиентов */}
      {ingredients.length > 0 && (
        <button
          onClick={() => setShowIngredients(!showIngredients)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#e2e8f0',
            color: '#64748b',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          📊 {showIngredients ? 'Скрыть граммовки' : 'Показать граммовки'}
          <span style={{ transform: showIngredients ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
      )}

      {/* Список ингредиентов с граммовками */}
      {showIngredients && ingredients.length > 0 && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          padding: 8,
          marginBottom: 8
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Состав:
          </div>
          {ingredients.map((ingredient, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: idx < ingredients.length - 1 ? '1px solid #f3f4f6' : 'none',
              fontSize: 11,
              color: '#6b7280'
            }}>
              <span>{ingredient.name}</span>
              <span style={{ fontWeight: 500, color: '#374151' }}>
                {ingredient.amount} {ingredient.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка завершения */}
      <button
        onClick={onToggleComplete}
        style={checkboxButtonStyle(isCompleted)}
      >
        {isCompleted ? '✅ Съел' : '🍽️ Съесть'}
      </button>
    </div>
  );
};

export default function TodayBlock({ day, answers, onBackToWeek, programId }) {
  // Состояние для персонального плана
  const [personalPlan, setPersonalPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  
  // Состояние для чата с Дианой
  const [showDianaChat, setShowDianaChat] = useState(false);

  // Загружаем персональный план при монтировании компонента
  useEffect(() => {
    if (programId) {
      loadTodayPlan();
    }
  }, [programId]);

  // Функция загрузки плана на сегодня
  const loadTodayPlan = async () => {
    if (!programId) return;
    
    setLoadingPlan(true);
    setPlanError(null);
    
    try {
      console.log('📅 Загружаем план на сегодня для программы:', programId);
      
      // Сначала пробуем загрузить из localStorage (демо версия)
      const localProgram = localStorage.getItem(`program_${programId}`);
      if (localProgram) {
        const program = JSON.parse(localProgram);
        const today = new Date().toISOString().slice(0, 10);
        const todayPlan = program.days.find(d => d.date === today);
        
        if (todayPlan) {
          console.log('✅ План на сегодня загружен из localStorage:', todayPlan);
          console.log('🎥 Проверка упражнений в плане:', todayPlan.workout?.exercises);
          setPersonalPlan(todayPlan);
          setLoadingPlan(false);
          return;
        } else {
          // Если сегодняшний день не найден, берем первый день программы
          const firstDay = program.days[0];
          if (firstDay) {
            console.log('📅 Сегодняшний день не найден, используем первый день программы:', firstDay);
            console.log('🎥 Проверка упражнений в первом дне:', firstDay.workout?.exercises);
            setPersonalPlan(firstDay);
            setLoadingPlan(false);
            return;
          }
        }
      }
      
      // Если не нашли в localStorage, пробуем обратиться к серверу
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';
      const response = await fetch(`${API_URL}/api/program/today?programId=${programId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ План на сегодня загружен с сервера:', data.plan);
        setPersonalPlan(data.plan);
      } else {
        console.error('❌ Ошибка загрузки плана:', data.error);
        setPlanError(data.error);
      }
    } catch (error) {
      console.error('❌ Ошибка сети при загрузке плана:', error);
      setPlanError('Ошибка подключения к серверу');
    } finally {
      setLoadingPlan(false);
    }
  };

  // Используем персональный план если он есть, иначе переданный день или мок
  const currentDay = personalPlan || day || {
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
  
  // Логируем данные для отладки
  console.log('🏋️‍♀️ TodayBlock Debug:', {
    personalPlan: !!personalPlan,
    dayProp: !!day,
    currentDayWorkout: currentDay.workout,
    currentDayLocation: currentDay.workout?.location,
    currentDayExercises: currentDay.workout?.exercises?.map(ex => ex.name)
  });

  // Проверяем, начинается ли программа сегодня или позже
  const programStartsLater = answers && answers.start_date && new Date(answers.start_date) > new Date();
  
  const [completedExercises, setCompletedExercises] = useState(
    currentDay.workout?.exercises.map((ex, i) => currentDay.completedExercises?.[i] || false) || []
  );
  const [completedMeals, setCompletedMeals] = useState(
    currentDay.meals?.map((m, i) => currentDay.completedMealsArr?.[i] || false) || []
  );
  const [dailySteps] = useState(currentDay.dailySteps || 7500);
  const [stepsGoal] = useState(currentDay.dailyStepsGoal || 10000);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Получаем случайную мотивационную цитату
  const todayQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  
  // Вычисляем общие калории и БЖУ
  const totalCalories = currentDay.meals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 1530;
  const targetCalories = answers?.targetCalories || 1800; // Из квиза
  
  const products = currentDay.meals
    ? Array.from(new Set(currentDay.meals.flatMap(m => {
        const mealInfo = m.meal || { name: m.menu || '', ingredients: [] };
        if (typeof mealInfo === 'string') {
          return mealInfo.split(/,| /).map(s => s.trim()).filter(Boolean);
        } else if (mealInfo.ingredients) {
          return mealInfo.ingredients.map(ing => ing.name);
        } else {
          return [mealInfo.name || ''];
        }
      })))
    : [];

  const localProgramId = programId || currentDay.programId;

  async function handleExerciseChange(idx) {
    const updated = completedExercises.map((v, i) => i === idx ? !v : v);
    setCompletedExercises(updated);
    
    // Добавляем тактильную обратную связь (вибрацию) при успешном выполнении
    if (updated[idx] && navigator.vibrate) {
      navigator.vibrate(100); // 100ms вибрация при отметке как выполнено
    }
    
    if (localProgramId) {
      try {
        await fetch(`${API_URL}/api/program/day-complete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId: localProgramId, date: currentDay.date, completedExercises: updated })
        });
        console.log('✅ Статус упражнения обновлен:', { idx, completed: updated[idx] });
      } catch (error) {
        console.error('❌ Ошибка обновления статуса упражнения:', error);
      }
    }
  }

  async function handleMealChange(idx) {
    const updated = completedMeals.map((v, i) => i === idx ? !v : v);
    setCompletedMeals(updated);
    if (localProgramId) {
      await fetch(`${API_URL}/api/program/day-complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: localProgramId, date: currentDay.date, completedMealsArr: updated })
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
        
        {loadingPlan ? (
          // Показываем загрузку персонального плана
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1a1a1a' }}>
              📅 Загружаем ваш персональный план...
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              Подбираем тренировки и питание специально для вас
            </div>
          </div>
        ) : planError ? (
          // Показываем ошибку загрузки
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#e74c3c' }}>
              ❌ Ошибка загрузки плана
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              {planError}
            </div>
            <button
              onClick={loadTodayPlan}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: '#3498db',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Попробовать снова
            </button>
          </div>
        ) : programStartsLater ? (
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
              
              {currentDay.workout && currentDay.workout.exercises && currentDay.workout.exercises.length > 0 ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>
                    {currentDay.workout.title || 'Тренировка'}
                  </div>
                  
                  {currentDay.workout.exercises.map((ex, i) => {
                    // Используем данные из упражнения, если они есть, иначе анализируем название тренировки
                    const location = ex.location || currentDay.workout.location || getWorkoutLocation(currentDay.workout.title || currentDay.workout.name);
                    const dayId = ex.dayId || getDayId(currentDay.workout.title || currentDay.workout.name, location);
                    const exerciseName = getExerciseEnglishName(ex.name);
                    
                    console.log('🎥 TodayBlock видео данные для упражнения:', {
                      exerciseName: ex.name,
                      location,
                      dayId,
                      exerciseEnglishName: exerciseName,
                      exerciseObject: ex,
                      workoutObject: currentDay.workout,
                      fullVideoPath: location && dayId && exerciseName ? `/videos/${location}/${dayId}/${exerciseName}.mp4` : null
                    });
                    
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
                        
                        {(location && dayId && (ex.videoName || exerciseName)) ? (
                          <VideoPlayer 
                            location={location}
                            dayId={dayId}
                            exerciseName={ex.videoName || exerciseName}
                            title={ex.name}
                          />
                        ) : (
                          <div style={{ 
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: 12
                          }}>
                            <div style={{
                              width: '200px',
                              height: '300px',
                              background: '#e2e8f0', 
                              borderRadius: 12, 
                              display: 'flex', 
                              flexDirection: 'column',
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              color: '#94a3b8', 
                              fontSize: 14
                            }}>
                              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎥</div>
                              <div>Видео скоро</div>
                              <div style={{ fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>
                                Отсутствуют данные:<br/>
                                location: {location || 'нет'}<br/>
                                dayId: {dayId || 'нет'}<br/>
                                exerciseName: {exerciseName || 'нет'}
                              </div>
                            </div>
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
              {currentDay.meals && currentDay.meals.map((meal, i) => (
                <MealCard 
                  key={i} 
                  meal={meal} 
                  index={i} 
                  isCompleted={completedMeals[i]} 
                  onToggleComplete={() => handleMealChange(i)} 
                />
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
      
      {/* Закрепленная кнопка вызова чата с Дианой в правом верхнем углу */}
      <div
        onClick={() => setShowDianaChat(true)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s ease',
        }}
      >
        <span style={{ fontSize: 24, color: 'white' }}>💬</span>
      </div>
      
      {/* Диалог чата с Дианой */}
      {showDianaChat && (
        <DianaChat
          onClose={() => setShowDianaChat(false)}
          isPremium={true} // Временно делаем доступным для всех
        />
      )}
    </div>
  );
}
