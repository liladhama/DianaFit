import React from 'react';
import SwipeSlider from './SwipeSlider';

const MealCard = ({ 
  meal, 
  isCompleted, 
  onStatusChange,
  style = {}
}) => {
  const handleStatusChange = (completed) => {
    onStatusChange(meal.id, completed, 'meal');
  };

  // Иконки для типов приемов пищи
  const getMealIcon = (type) => {
    const normalizedType = type?.toLowerCase() || '';
    const icons = {
      завтрак: '🌅',
      обед: '☀️', 
      ужин: '🌙',
      перекус: '🍎',
      полдник: '🍎'
    };
    return icons[normalizedType] || '🍽️';
  };

  // Получаем информацию о блюде (название + ингредиенты)
  const mealInfo = meal.meal || { name: meal.menu || meal.name || 'Не указано', ingredients: [] };
  const mealName = typeof mealInfo === 'string' ? mealInfo : mealInfo.name;
  const ingredients = typeof mealInfo === 'object' && mealInfo.ingredients ? mealInfo.ingredients : [];

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
      {/* Заголовок приема пищи */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4
          }}>
            <span style={{ fontSize: 20 }}>
              {getMealIcon(meal.type)}
            </span>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#1e293b',
              margin: 0,
              lineHeight: 1.4
            }}>
              {meal.type}
            </h3>
            {meal.time && (
              <span style={{
                fontSize: 12,
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: 12,
                fontWeight: 500
              }}>
                {meal.time}
              </span>
            )}
          </div>
          
          {/* Название блюда - более выразительное */}
          {mealName && (
            <div style={{
              marginTop: 8,
              marginBottom: 12,
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              borderLeft: '4px solid #3b82f6'
            }}>
              <h4 style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1e293b',
                margin: 0,
                lineHeight: 1.3,
                letterSpacing: '-0.02em'
              }}>
                🍽️ {mealName}
              </h4>
            </div>
          )}
          
          {/* Описание блюда - улучшенное */}
          {meal.description && (
            <div style={{
              marginBottom: 12,
              padding: '6px 10px',
              backgroundColor: '#fffef7',
              border: '1px solid #fbbf24',
              borderRadius: 8,
              borderLeft: '3px solid #f59e0b'
            }}>
              <p style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#92400e',
                margin: 0,
                lineHeight: 1.5,
                fontStyle: 'italic'
              }}>
                💭 {meal.description}
              </p>
            </div>
          )}
          
          {/* Питательная информация - более яркая */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8
          }}>
            {typeof meal.calories === 'number' && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid #fed7aa'
              }}>
                <span>🔥</span>
                {Math.round(meal.calories / 5) * 5} ккал
              </span>
            )}
            
            {meal.protein && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid #fecaca'
              }}>
                <span>🥩</span>
                {meal.protein}г белка
              </span>
            )}
            
            {meal.carbs && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#fffbeb',
                color: '#d97706',
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid #fde68a'
              }}>
                <span>🍞</span>
                {meal.carbs}г углеводов
              </span>
            )}
            
            {meal.fats && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid #bbf7d0'
              }}>
                <span>🥑</span>
                {meal.fats}г жиров
              </span>
            )}
            
            {meal.portion && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#f8fafc',
                color: '#475569',
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid #cbd5e1'
              }}>
                <span>📏</span>
                {meal.portion}
              </span>
            )}
          </div>

          {/* Ингредиенты - улучшенный стиль */}
          {ingredients && ingredients.length > 0 && (
            <div style={{
              marginTop: 8,
              padding: 12,
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              borderLeft: '4px solid #8b5cf6'
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#4c1d95',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                🥘 Состав блюда:
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6
              }}>
                {ingredients.map((ingredient, idx) => (
                  <span key={idx} style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#581c87',
                    backgroundColor: '#f3e8ff',
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #d8b4fe',
                    whiteSpace: 'nowrap'
                  }}>
                    {typeof ingredient === 'string' ? ingredient : `${ingredient.name}: ${Math.round(ingredient.amount / 5) * 5}${ingredient.unit || ''}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Swipe Slider для статуса */}
      <SwipeSlider
        isCompleted={isCompleted}
        onStatusChange={handleStatusChange}
        leftText="Съел"
        rightText="Не съел"
        leftIcon="🍽️"
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
          {isCompleted ? '✅ Прием пищи выполнен' : '❌ Прием пищи пропущен'}
        </div>
      )}
    </div>
  );
};

export default MealCard;
