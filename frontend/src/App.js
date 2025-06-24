import React, { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import StoryQuiz from './components/StoryQuiz';
import WeekPlan from './components/WeekPlan';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [programId, setProgramId] = useState(null);
  const [answers, setAnswers] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Диагностика размеров
    setTimeout(() => {
      console.log('window.innerHeight:', window.innerHeight);
      console.log('document.documentElement.clientHeight:', document.documentElement.clientHeight);
      const root = document.getElementById('root');
      if (root) {
        console.log('#root bounding:', root.getBoundingClientRect());
      }
    }, 1000);
  }, [showSplash]);

  function handleQuizFinish(quizAnswers) {
    setAnswers(quizAnswers);
    // Здесь можно добавить логику для получения programId
    // setProgramId(...)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', width: '100vw', background: '#fff', border: '4px solid red' }}>
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
