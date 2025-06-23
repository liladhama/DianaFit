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
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      fontSize: 24,
      color: '#222'
    }}>
      Приложение работает!
    </div>
  );
}

export default App;
