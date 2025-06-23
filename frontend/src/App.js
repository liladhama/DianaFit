import React, { useEffect } from 'react';
import StoryQuiz from './components/StoryQuiz';

function App() {
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.expand) {
      window.Telegram.WebApp.expand();
    }
  }, []);

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
      <StoryQuiz />
    </div>
  );
}

export default App;
