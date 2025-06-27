import React, { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import StoryQuiz from './components/StoryQuiz';
import WeekPlan from './components/WeekPlan';
import ProfilePage from './components/ProfilePage';
import DayBlock from './components/DayBlock';
import TodayBlock from './components/TodayBlock';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [programId, setProgramId] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showToday, setShowToday] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Получаем текущий день из мок-данных (если нет weekData)
  let todayDay = null;
  if (answers && programId) {
    // Мок-данные на неделю
    const days = [
      { date: '2024-06-03', title: 'Понедельник', workout: { title: 'Тренировка 1', exercises: [{ name: 'Приседания', reps: 15 }, { name: 'Отжимания', reps: 10 }] }, meals: [{ type: 'Завтрак', menu: 'Овсянка' }, { type: 'Обед', menu: 'Курица с рисом' }], completed: false },
      { date: '2024-06-04', title: 'Вторник', workout: { title: 'Тренировка 2', exercises: [{ name: 'Планка', reps: 60 }, { name: 'Выпады', reps: 12 }] }, meals: [{ type: 'Завтрак', menu: 'Яичница' }, { type: 'Обед', menu: 'Рыба с овощами' }], completed: false },
      { date: '2024-06-05', title: 'Среда', workout: { title: 'Тренировка 3', exercises: [{ name: 'Скручивания', reps: 20 }, { name: 'Приседания', reps: 15 }] }, meals: [{ type: 'Завтрак', menu: 'Творог' }, { type: 'Обед', menu: 'Гречка с курицей' }], completed: false },
      { date: '2024-06-06', title: 'Четверг', workout: { title: 'Тренировка 4', exercises: [{ name: 'Выпады', reps: 12 }, { name: 'Планка', reps: 60 }] }, meals: [{ type: 'Завтрак', menu: 'Омлет' }, { type: 'Обед', menu: 'Говядина с овощами' }], completed: false },
      { date: '2024-06-07', title: 'Пятница', workout: { title: 'Тренировка 5', exercises: [{ name: 'Отжимания', reps: 10 }, { name: 'Скручивания', reps: 20 }] }, meals: [{ type: 'Завтрак', menu: 'Гречка' }, { type: 'Обед', menu: 'Рыба с картофелем' }], completed: false },
      { date: '2024-06-08', title: 'Суббота', workout: { title: 'Тренировка 6', exercises: [{ name: 'Приседания', reps: 15 }, { name: 'Планка', reps: 60 }] }, meals: [{ type: 'Завтрак', menu: 'Овсянка' }, { type: 'Обед', menu: 'Курица с овощами' }], completed: false },
      { date: '2024-06-09', title: 'Воскресенье', workout: { title: 'Отдых', exercises: [] }, meals: [{ type: 'Завтрак', menu: 'Фрукты' }, { type: 'Обед', menu: 'Салат' }], completed: false },
    ];
    const todayStr = new Date().toISOString().slice(0, 10);
    todayDay = days.find(d => d.date === todayStr) || days[0];
  }

  useEffect(() => {
    // Автоматическое расширение окна Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.expand) {
      window.Telegram.WebApp.expand();
    }
    const timer = setTimeout(() => setShowSplash(false), 4000); // 4 секунды
    return () => clearTimeout(timer);
  }, []);

  function handleQuizFinish(quizAnswers) {
    setAnswers(quizAnswers);
    // Если в ответах есть programId, используем его, иначе заглушка
    setProgramId(quizAnswers.programId || quizAnswers.id || 'demo-program');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', background: '#fff' }}>
      {((answers && programId) || (showToday && todayDay)) && (
        // Аватарка пользователя только на странице недели и текущего дня
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
          <button onClick={() => setShowProfile(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <img src={window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || 'https://twa.netlify.app/ava.png'} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%', boxShadow: '0 2px 8px #e0e7ff44', objectFit: 'cover' }} />
          </button>
        </div>
      )}
      {showSplash ? (
        <SplashScreen />
      ) : showProfile ? (
        <ProfilePage
          onClose={() => setShowProfile(false)}
          unlocked={unlocked}
          answers={answers}
          onEditQuiz={() => { setShowProfile(false); setShowToday(false); }}
          onRestart={() => { setAnswers(null); setProgramId(null); setShowProfile(false); setShowToday(false); setUnlocked(false); }}
        />
      ) : (answers && programId && todayDay && !showToday) ? (
        <TodayBlock day={todayDay} onBackToWeek={() => setShowToday(true)} />
      ) : showToday && answers && programId ? (
        <WeekPlan programId={programId} unlocked={unlocked} setUnlocked={setUnlocked} />
      ) : (
        <StoryQuiz onFinish={handleQuizFinish} />
      )}
    </div>
  );
}

export default App;
