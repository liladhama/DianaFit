import React, { useState, useEffect, useMemo } from 'react';
import dietUtils from '../utils/dietUtils';
import QuizSettings from './QuizSettings.js';
import DianaNotification from './DianaNotification.js';
import { API_URL } from '../config/api';

// Используем функции из default export
const getDietIcon = dietUtils.getDietIcon;
const getDietName = dietUtils.getDietName;
const getDietDisplayName = dietUtils.getDietDisplayName;

export default function ProfilePage({ onClose, unlocked, isPremium, activatePremium, answers, onEditQuiz, onRestart }) {
  // Получаем данные пользователя
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || { first_name: 'Диана', last_name: '', photo_url: 'https://twa.netlify.app/ava.png' };
  
  // Состояние для ответов квиза и настроек
  const [quizAnswers, setQuizAnswers] = useState(answers || {});
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDianaNotification, setShowDianaNotification] = useState(false);

  // Состояние для диеты и коэффициентов
  const [dietStats, setDietStats] = useState({
    currentDiet: '',
    macroRatios: {},
    weeklyResults: []
  });

  // --- Формула BMR как на бэкенде (Харрис-Бенедикта) ---
  function calculateBMR(weight, height, age, sex = 'female') {
    if (sex === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  }

  // --- Функция расчёта КБЖУ на основе данных пользователя (как на бэкенде) ---
  function calculateMacrosFromQuiz(quiz) {
    // Поддержка weight и weight_kg
    const weight = Number(quiz.weight) || Number(quiz.weight_kg) || 60;
    const height = Number(quiz.height) || Number(quiz.height_cm) || 165;
    const age = Number(quiz.age) || 30;
    const sex = (quiz.gender || quiz.sex || 'female').toLowerCase();
    const activity = quiz.activity_coef || 1.375;
    
    let bmr = calculateBMR(weight, height, age, sex);
    
    // --- Расчёт дефицита по goal (3/4/5 кг в месяц) как на бэкенде ---
    const goal = Number(quiz.goal);
    let deficit = 0;
    let calories;
    
    if ([3,4,5].includes(goal)) {
      deficit = goal * 7700 / 30;
      calories = Math.round(bmr * activity - deficit);
    } else {
      calories = Math.round(bmr * activity);
    }
    
    // Минимум 1400 ккал для всех (по базе Дианы)
    calories = Math.max(1400, calories);
    
    // Расчёт БЖУ как на бэкенде
    const protein = Math.round(weight * 1.8);
    const fat = Math.round(weight * 0.9);
    const carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
    
    console.log('[DEBUG КБЖУ]', {
      weight, height, age, sex, bmr, activity, deficit, calories, protein, fat, carbs
    });
    
    return { calories, protein, fats: fat, carbs };
  }

  // --- Функция округления КБЖУ ---
  function roundMacros(macros) {
    return {
      calories: Math.round(macros.calories / 10) * 10,
      protein: Math.round(macros.protein / 5) * 5,
      fats: Math.round(macros.fats / 5) * 5,
      carbs: Math.round(macros.carbs / 5) * 5,
    };
  }

  // --- КБЖУ загружаем с бэкенда ---
  useEffect(() => {
    const fetchNutritionFromBackend = async () => {
      try {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'testuser1';
        const response = await fetch(`${API_URL}/api/user/nutrition/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Nutrition data from backend:', data);
          setNutritionInfo(data);
        } else {
          // Если нет данных на бэкенде, используем локальный расчет
          if (answers && Object.keys(answers).length > 0) {
            const macros = calculateMacrosFromQuiz(answers);
            setNutritionInfo(roundMacros(macros));
          }
        }
      } catch (error) {
        console.error('Error fetching nutrition from backend:', error);
        // Fallback к локальному расчету при ошибке
        if (answers && Object.keys(answers).length > 0) {
          const macros = calculateMacrosFromQuiz(answers);
          setNutritionInfo(roundMacros(macros));
        }
      }
    };

    fetchNutritionFromBackend();
  }, [answers]);

  // Получаем реальные данные о прогрессе
  const [progressData, setProgressData] = React.useState({
    workouts: 0,
    nutrition: 0,
    details: {
      meals: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
      weeklyProgress: [],
      commonIssues: [],
      improvements: { weekOverWeek: 0, trend: 'up' }
    }
  });
  
  // Мемоизация частиц фона для стабильной производительности
  const backgroundParticles = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      size: Math.random() * 6 + 2,
      left: Math.random() * 100,
      duration: Math.random() * 15 + 35,
      delay: Math.random() * 5
    }));
  }, []); // Пустой массив зависимостей - создаётся только один раз

  // Загрузка данных прогресса из файла userid_progress.json
  React.useEffect(() => {
    const fetchProgress = async () => {
      try {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'testuser1';
        const response = await fetch(`${API_URL}/api/user-progress/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch progress');
        const data = await response.json();
        
        console.log('Progress data from backend:', data);
        // Используем данные прогресса напрямую с бэкенда (без пересчета на фронте)
        setProgressData(data);
      } catch (error) {
        console.error('Error fetching progress:', error);
        // Можно добавить fallback/заглушку
      }
    };

    fetchProgress();
    // Обновляем каждые 5 минут
    const interval = setInterval(fetchProgress, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Загружаем quizAnswers напрямую из API при монтировании
  useEffect(() => {
    const fetchQuizAnswers = async () => {
      try {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'testuser1';
        const response = await fetch(`${API_URL}/api/user/quiz-answers/${userId}`);
        if (response.ok) {
          const data = await response.json();
          // Приводим возраст к строке для корректного отображения
          if (typeof data.age !== 'undefined') data.age = String(data.age);
          setQuizAnswers(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки quizAnswers:', error);
        // Можно добавить fallback/заглушку
      }
    };
    fetchQuizAnswers();
  }, []);

  // Функция для обновления quizAnswers после изменений в QuizSettings
  const handleQuizSettingsChange = async () => {
    try {
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'testuser1';
      const response = await fetch(`${API_URL}/api/user/quiz-answers/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setQuizAnswers(data);
      }
    } catch (error) {
      console.error('Ошибка обновления quizAnswers:', error);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'linear-gradient(180deg, rgba(150,200,255,0.97) 0%, rgba(120,180,255,0.98) 100%)', // более яркий голубой
      backgroundSize: '400% 400%',
      animation: 'gradientShift 8s ease infinite',
      position: 'relative',
      padding: '40px 12px 40px 12px',
      boxSizing: 'border-box',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden'
    }}>
      {/* Floating particles animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
        willChange: 'contents',
        backfaceVisibility: 'hidden'
      }}>
        {/* Используем мемоизированные частицы */}
        {backgroundParticles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              width: particle.size + 'px',
              height: particle.size + 'px',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              left: particle.left + '%',
              animationDelay: particle.delay + 's',
              animationDuration: particle.duration + 's',
              animationName: 'float',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
              willChange: 'transform'
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          5% { opacity: 0.3; }
          15% { opacity: 0.6; }
          50% { opacity: 0.8; }
          85% { opacity: 0.6; }
          95% { opacity: 0.3; }
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>

      {/* Кнопка назад */}
      <button 
        onClick={onClose} 
        style={{ 
          position: 'absolute', 
          top: 16, 
          left: 16, 
          background: 'rgba(255, 255, 255, 0.2)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)', 
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16, 
          color: '#fff', 
          cursor: 'pointer', 
          transition: 'all 0.3s ease',
          zIndex: 100,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ←
      </button>

      {/* Круглая фотография с элегантным обрамлением */}
      <div style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
        padding: 4,
        marginBottom: 16,
        marginTop: 16,
        animation: 'slideUp 0.8s ease-out',
        zIndex: 10,
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), inset 0 0 0 2px rgba(255,255,255,0.3)',
          position: 'relative'
        }}>
          <img 
            src={user.photo_url} 
            alt="profile" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }} 
          />
          {/* Статус онлайн */}
          <div style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            width: 18,
            height: 18,
            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
            borderRadius: '50%',
            border: '2px solid white',
            animation: 'pulse 2s infinite'
          }} />
        </div>
      </div>

      {/* Контейнер профиля с glass morphism */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        padding: '16px',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        textAlign: 'center',
        marginBottom: 16,
        animation: 'slideUp 0.8s ease-out 0.2s both',
        zIndex: 10,
        position: 'relative',
        maxWidth: 320,
        width: '95%'
      }}>
        {/* Имя */}
        <h1 style={{
          fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
          fontSize: 28,
          fontWeight: 800,
          margin: '0 0 8px 0',
          color: '#222',
          letterSpacing: '0.5px',
          textShadow: 'none',
        }}>
          {quizAnswers.name || user.first_name}
        </h1>
        {/* Возраст */}
        <p style={{
          fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
          fontSize: 16,
          color: '#222',
          margin: '0 0 14px 0',
          fontWeight: 500,
          letterSpacing: '0.3px',
          textShadow: 'none',
        }}>
          {quizAnswers.age ? `${quizAnswers.age} лет` : 'Возраст не указан'}
        </p>
        {/* Тип диеты */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          padding: '10px 16px',
          borderRadius: 30,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          fontSize: 14,
          color: '#222',
          fontWeight: 600,
          fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
          letterSpacing: '0.3px',
          textShadow: 'none',
        }}>
          <img 
            src={getDietIcon(quizAnswers.diet_flags)} 
            alt={getDietName(quizAnswers.diet_flags)}
            style={{ 
              width: 20, 
              height: 20, 
              objectFit: 'contain',
              filter: 'brightness(1.2) contrast(1.1)'
            }}
          />
          <span>{getDietDisplayName(quizAnswers.diet_flags)}</span>
        </div>
      </div>

      {/* Главная панель контента */}
      <div style={{
        width: '95%',
        maxWidth: 600,
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        padding: '16px',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        animation: 'slideUp 0.8s ease-out 0.4s both',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Элегантные вкладки */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 24,
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: 6,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          gap: 4
        }}>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              background: !showSettings ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)' : 'transparent',
              color: !showSettings ? '#667eea' : 'rgba(255,255,255,0.8)',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: !showSettings ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              flex: 1,
              letterSpacing: '0.3px',
              color: '#222'
            }}
            onMouseEnter={(e) => {
              if (!showSettings) return;
              e.target.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              if (!showSettings) return;
              e.target.style.background = 'transparent';
            }}
          >
            📊 Прогресс
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: showSettings ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)' : 'transparent',
              color: showSettings ? '#667eea' : 'rgba(255,255,255,0.8)',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: showSettings ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              flex: 1,
              letterSpacing: '0.3px',
              color: '#222'
            }}
            onMouseEnter={(e) => {
              if (showSettings) return;
              e.target.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              if (showSettings) return;
              e.target.style.background = 'transparent';
            }}
          >
            ⚙️ Настройки
          </button>
        </div>

        {/* Контент вкладок */}
        {showSettings ? (
          <div style={{ color: '#fff' }}>
            <QuizSettings
              quizAnswers={quizAnswers}
              onSettingChange={async (changes) => {
                try {
                  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'default';
                  console.log('Updating settings:', changes);
                  setQuizAnswers(prev => ({ ...prev, ...changes }));
                  
                  // Обновляем КБЖУ с бэкенда при изменении настроек
                  if (changes.weight || changes.height || changes.age || changes.activity_level || changes.goal) {
                    try {
                      const response = await fetch(`${API_URL}/api/user/nutrition/${userId}`);
                      if (response.ok) {
                        const data = await response.json();
                        setNutritionInfo(data);
                      } else {
                        // Fallback к локальному расчету
                        const macros = calculateMacrosFromQuiz({ ...quizAnswers, ...changes });
                        setNutritionInfo(roundMacros(macros));
                      }
                    } catch (error) {
                      console.error('Error fetching updated nutrition:', error);
                      // Fallback к локальному расчету
                      const macros = calculateMacrosFromQuiz({ ...quizAnswers, ...changes });
                      setNutritionInfo(roundMacros(macros));
                    }
                  }
                } catch (error) {
                  console.error('Error updating settings:', error);
                }
              }}
            />
          </div>
        ) : (
          <>
            {/* Заголовок прогресса */}
            <h2 style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
              marginBottom: 32,
              letterSpacing: '0.02em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: '#222'
            }}>
              Прогресс за неделю
            </h2>

            {/* Улучшенные прогресс-бары */}
            <div style={{ marginBottom: 24 }}>
              {/* Питание */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: 12, 
                  alignItems: 'center' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16
                    }}>
                      🍽️
                    </div>
                    <div>
                      <h3 style={{ 
                        fontSize: 16, 
                        fontWeight: 700, 
                        color: '#222',
                        margin: 0,
                        fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                        letterSpacing: '0.3px',
                        textShadow: 'none'
                      }}>
                        Питание
                      </h3>
                      <p style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                        margin: 0
                      }}>
                        Приемы пищи в неделю
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background: progressData.nutrition >= 70 ? 
                      'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 
                      'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    minWidth: 60,
                    textAlign: 'center'
                  }}>
                    {progressData.nutrition}%
                  </div>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: 12, 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: 12, 
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div
                    style={{ 
                      width: `${progressData.nutrition}%`,
                      height: '100%',
                      background: progressData.nutrition >= 70 ? 
                        'linear-gradient(90deg, #48bb78 0%, #68d391 50%, #38a169 100%)' : 
                        'linear-gradient(90deg, #ed8936 0%, #f6ad55 50%, #dd6b20 100%)',
                      borderRadius: 12,
                      transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      animation: 'shimmer 2s infinite'
                    }} />
                  </div>
                </div>
              </div>

              {/* Тренировки */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: 12, 
                  alignItems: 'center' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16
                    }}>
                      💪
                    </div>
                    <div>
                      <h3 style={{ 
                        fontSize: 16, 
                        fontWeight: 700, 
                        color: '#222',
                        margin: 0,
                        fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                        letterSpacing: '0.3px',
                        textShadow: 'none'
                      }}>
                        Тренировки
                      </h3>
                      <p style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                        margin: 0
                      }}>
                        Задания в неделю
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background: progressData.workouts >= 70 ? 
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    minWidth: 60,
                    textAlign: 'center'
                  }}>
                    {progressData.workouts}%
                  </div>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: 12, 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: 12, 
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div
                    style={{ 
                      width: `${progressData.workouts}%`,
                      height: '100%',
                      background: progressData.workouts >= 70 ? 
                        'linear-gradient(90deg, #667eea 0%, #9f7aea 50%, #764ba2 100%)' : 
                        'linear-gradient(90deg, #f093fb 0%, #f687b3 50%, #f5576c 100%)',
                      borderRadius: 12,
                      transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      animation: 'shimmer 2s infinite 0.5s'
                    }} />
                  </div>
                </div>
              </div>

              {/* Улучшенная статистика питания */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ 
                  fontSize: 18, 
                  fontWeight: 700, 
                  color: '#222',
                  marginBottom: 16,
                  textAlign: 'center',
                  fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                  letterSpacing: '0.3px'
                }}>
                  Мои показатели БЖУ
                </h3>
                {nutritionInfo && !nutritionInfo.error && (() => {
                  const items = [
                    { label: 'Белки', value: `${nutritionInfo.protein}г`, color: '#48bb78', icon: '🥩' },
                    { label: 'Жиры', value: `${nutritionInfo.fats}г`, color: '#ed8936', icon: '🥑' },
                    { label: 'Углеводы', value: `${nutritionInfo.carbs}г`, color: '#667eea', icon: '🍞' },
                    { label: 'Калории', value: nutritionInfo.calories, color: '#f093fb', icon: '🔥' }
                  ];
                  return (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 12,
                      marginBottom: 20
                    }}>
                      {items.map((item, index) => (
                        <div key={index} style={{ 
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 12,
                          padding: 16,
                          textAlign: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={e => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                        >
                          <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                          <div style={{ 
                            fontSize: 18, 
                            fontWeight: 700, 
                            color: '#222',
                            fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                            marginBottom: 2
                          }}>
                            {item.value}
                          </div>
                          <div style={{ 
                            fontSize: 12, 
                            color: '#222',
                            fontWeight: 500,
                            fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                            letterSpacing: '0.3px'
                          }}>
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {nutritionInfo?.error && (
                  <div style={{
                    background: 'rgba(255, 0, 0, 0.1)',
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 0, 0, 0.2)',
                    color: '#ff4444'
                  }}>
                    Ошибка загрузки данных КБЖУ: {nutritionInfo.error}
                  </div>
                )}
                {!nutritionInfo && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#666'
                  }}>
                    Загрузка данных КБЖУ...
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Уведомления от Дианы */}
      <DianaNotification 
        isVisible={showDianaNotification}
        onClose={() => setShowDianaNotification(false)}
        progressData={progressData}
        userAnswers={quizAnswers}
      />

      {/* Улучшенная кнопка цели */}
      <div style={{
        animation: 'slideUp 0.8s ease-out 0.6s both',
        zIndex: 10,
        position: 'relative',
        marginTop: 20 // Добавляем отступ сверху для смещения вниз
      }}>
        <button
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 50,
            padding: '16px 48px', // Уменьшаем вертикальный padding с 24px до 16px
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            minWidth: 320,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-8px) scale(1.02)';
            e.target.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.8)';
            e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 100%)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)';
            e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)';
          }}
        >
          {/* Animated background effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            transition: 'left 0.6s ease'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: 36, // Уменьшаем с 48px до 36px
              height: 36, // Уменьшаем с 48px до 36px
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20, // Уменьшаем с 24px до 20px
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
            }}>
              🎯
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: 12, // Уменьшаем с 14px до 12px
                color: 'rgba(102, 126, 234, 0.8)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: 2 // Уменьшаем с 4px до 2px
              }}>
                Моя цель
              </div>
              <div style={{
                fontSize: 20, // Уменьшаем с 24px до 20px
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 800,
                letterSpacing: '0.02em',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#222'
              }}>
                -{quizAnswers.goal || 3} кг
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}