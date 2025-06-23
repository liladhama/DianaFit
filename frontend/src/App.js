import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.expand) {
      window.Telegram.WebApp.expand();
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', minWidth: '100vw', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%)' }}>
      <h1 style={{ textAlign: 'center', marginTop: 32 }}>ДианаFit Telegram Mini App</h1>
      <p style={{ textAlign: 'center' }}>Приложение автоматически разворачивается на весь экран.</p>
    </div>
  );
}

export default App;
