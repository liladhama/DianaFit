import React, { useState, useEffect } from 'react';
import '../styles/WeeklyNotification.css';

// Компонент для отображения уведомлений о результатах недели
const WeeklyNotification = ({ recommendations, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Автоматически скрываем уведомление через 30 секунд
    const timeout = setTimeout(() => {
      handleClose();
    }, 30000);

    return () => clearTimeout(timeout);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 500); // Даем время для анимации закрытия
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="weekly-notification-overlay">
      <div className="weekly-notification-container">
        <div className="weekly-notification-header">
          <h2>Анализ твоей недели</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="weekly-notification-content">
          <div className="notification-avatar">
            <img src="/assets/diana-avatar.png" alt="Диана" />
          </div>
          
          <div className="notification-message">
            <p className="main-message">{recommendations.message}</p>
            
            <div className="recommendations-section">
              <h3>Тренировки</h3>
              <p>{recommendations.exercises}</p>
            </div>
            
            <div className="recommendations-section">
              <h3>Питание</h3>
              <p>{recommendations.meals}</p>
            </div>
            
            <div className="recommendations-section">
              <h3>Активность</h3>
              <p>{recommendations.steps}</p>
            </div>
            
            <div className="motivation-section">
              <h3>От Дианы</h3>
              <p>{recommendations.motivation}</p>
            </div>
          </div>
        </div>
        
        <div className="weekly-notification-footer">
          <button className="action-button" onClick={handleClose}>Спасибо за анализ!</button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyNotification;
