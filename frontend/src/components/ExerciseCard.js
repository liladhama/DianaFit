import React from 'react';
import SwipeSlider from './SwipeSlider';
import VideoPlayer from './VideoPlayer';

const ExerciseCard = ({ 
  exercise, 
  index,
  isCompleted, 
  onStatusChange, 
  videoComponent,
  style = {}
}) => {
  const handleStatusChange = (completed) => {
    onStatusChange(index, completed);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f1f5f9',
      ...style
    }}>
      {/* Заголовок упражнения */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1e293b',
            margin: 0,
            marginBottom: 4,
            lineHeight: 1.4
          }}>
            {exercise.name}
          </h3>
          
          {/* Детали упражнения */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 14,
            color: '#64748b',
            marginBottom: 12
          }}>
            {exercise.reps && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <span>�</span>
                {exercise.reps} повторений
              </span>
            )}
            
            {exercise.duration && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <span>⏱️</span>
                {exercise.duration}
              </span>
            )}
            
            {exercise.sets && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <span>�</span>
                {exercise.sets} подходов
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Видео компонент (если передан) */}
      {videoComponent && (
        <div style={{ marginBottom: 16 }}>
          {videoComponent}
        </div>
      )}

      {/* Swipe Slider для статуса */}
      <SwipeSlider
        isCompleted={isCompleted}
        onStatusChange={handleStatusChange}
        leftText="Выполнил"
        rightText="Не выполнил"
        leftIcon="✅"
        rightIcon="❌"
      />

      {/* Статус выполнения */}
      {isCompleted !== null && (
        <div style={{
          marginTop: 16,
          padding: 8,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          textAlign: 'center',
          backgroundColor: isCompleted ? '#dcfce7' : '#fef2f2',
          color: isCompleted ? '#166534' : '#991b1b',
          border: `1px solid ${isCompleted ? '#bbf7d0' : '#fecaca'}`
        }}>
          {isCompleted ? '✅ Упражнение выполнено' : '❌ Упражнение пропущено'}
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
