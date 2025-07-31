import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import PaymentSuccess from './pages/payment-success';
import PaymentFail from './pages/payment-fail';
import TestWeek from './components/TestWeek';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-fail" element={<PaymentFail />} />
        <Route path="/testweek" element={<TestWeek />} />
      </Routes>
    </BrowserRouter>
  );
}
