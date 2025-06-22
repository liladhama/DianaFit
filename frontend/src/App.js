import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      // Пример: получить user info
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      console.log('Telegram WebApp user:', user);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-300">
      <h1 className="text-3xl font-bold mb-4">ДианаFit Telegram Mini App</h1>
      <p className="mb-2">Добро пожаловать в мини-приложение для похудения!</p>
      {/* Здесь будет сторис-онбординг и основной UI */}
    </div>
  );
}

export default App;
