import React, { useEffect, useState } from 'react';
import StoryQuiz from './components/StoryQuiz';
import WeekPlan from './components/WeekPlan';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';

function App() {
  const [programId, setProgramId] = useState(null);
  const [answers, setAnswers] = useState(null);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.expand) {
      window.Telegram.WebApp.expand();
    }
  }, []);

  async function handleQuizFinish(quizAnswers) {
    setAnswers(quizAnswers);
    // Отправляем профиль на backend для генерации программы
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo-user';
    const res = await fetch(`${API_URL}/api/program`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, profile: quizAnswers })
    });
    const data = await res.json();
    setProgramId(data.programId);
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: '#fff',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {!programId ? (
        <StoryQuiz onFinish={handleQuizFinish} />
      ) : (
        <WeekPlan programId={programId} />
      )}
    </div>
  );
}

export default App;
