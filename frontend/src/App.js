import React, { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import StoryQuiz from './components/StoryQuiz';
import WeekPlan from './components/WeekPlan';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [programId, setProgramId] = useState(null);
  const [answers, setAnswers] = useState(null);

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
      {showSplash ? (
        <SplashScreen />
      ) : !programId ? (
        <StoryQuiz onFinish={handleQuizFinish} />
      ) : (
        <WeekPlan programId={programId} />
      )}
    </div>
  );
}

export default App;
