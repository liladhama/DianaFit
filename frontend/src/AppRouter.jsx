

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App';
import PaymentSuccess from './pages/payment-success';
import PaymentFail from './pages/payment-fail';
import TestWeek from './components/TestWeek';

function RouteLogger() {
  const location = useLocation();
  useEffect(() => {
    console.log('[ROUTER] Переход на:', location.pathname);
  }, [location]);
  return null;
}

function NotFoundPage() {
  useEffect(() => {
    console.error('[ROUTER] Страница не найдена!');
  }, []);
  return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <h1>404 — Страница не найдена</h1>
      <p>Проверьте адрес или попробуйте вернуться на главную.</p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <RouteLogger />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-fail" element={<PaymentFail />} />
        <Route path="/testweek" element={<TestWeek />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
