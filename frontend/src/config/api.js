// Единая конфигурация API URL для всего приложения
<<<<<<< HEAD
let API_URL;
const host = typeof window !== 'undefined' && window.location ? window.location.hostname : '';
if (host === 'localhost' || host === '127.0.0.1') {
  API_URL = 'http://localhost:3001';
} else {
  API_URL = 'https://dianafit.onrender.com';
}
export { API_URL };
=======
// Автоматическое определение окружения:
// - Если запуск локально (localhost или 127.0.0.1) - используем локальный backend
// - Если запуск через Telegram или по внешней ссылке - используем Render
function getApiUrl() {
  const currentHost = window.location.hostname;
  const isTelegramApp = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData;
  
  // Проверяем, запущено ли локально
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Для всех остальных случаев (Telegram, внешние ссылки) используем Render
  return 'https://dianafit.onrender.com';
}

export const API_URL = getApiUrl();

>>>>>>> ed6c1d9fac235ac362c7c915bb5c59cb289f041f
console.log('API_URL установлен на:', API_URL);
console.log('Текущий хост:', window.location.hostname);
console.log('Telegram WebApp:', !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData));
