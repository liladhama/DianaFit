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

  function handleQuizFinish(quizAnswers) {
    setAnswers(quizAnswers);
    // Здесь можно добавить логику для получения programId
    // setProgramId(...)
  }

  return (
    <div className="app-root-fullscreen">
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
