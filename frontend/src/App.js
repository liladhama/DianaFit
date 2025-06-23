import React, { useEffect } from 'react';

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
      background: '#fff'
    }}>
      <h1 style={{ textAlign: 'center', marginTop: 32 }}>ДианаFit Telegram Mini App</h1>
      <p style={{ textAlign: 'center' }}>Приложение автоматически разворачивается на весь экран.</p>
    </div>
  );
}

export default App;
