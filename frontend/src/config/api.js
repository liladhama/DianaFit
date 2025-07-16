// Единая конфигурация API URL для всего приложения
let API_URL;
const host = typeof window !== 'undefined' && window.location ? window.location.hostname : '';
const isLocal = (
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host === '::1' ||
  /^192\.168\./.test(host) ||
  /^10\./.test(host)
);
if (isLocal) {
  API_URL = 'http://localhost:3001';
} else {
  API_URL = 'https://dianafit.onrender.com'; // изменено на Render
}
export { API_URL };
console.log('API_URL установлен на:', API_URL);
