import React, { useState } from 'react';
import SwipeSlider from './SwipeSlider';

const MealCard = ({ 
  meal, 
  isCompleted, 
  onStatusChange,
  style = {}
}) => {
  const [showIngredients, setShowIngredients] = useState(false);

  const handleStatusChange = (completed) => {
    onStatusChange(meal.id, completed, 'meal');
  };

  // Получаем информацию о блюде (название + граммовки) 
  const mealInfo = meal.meal || { name: meal.menu || 'Не указано', ingredients: [] };
  const mealName = typeof mealInfo === 'string' ? mealInfo : mealInfo.name;
  const ingredients = typeof mealInfo === 'object' && mealInfo.ingredients ? mealInfo.ingredients : [];

  // Иконки для типов приемов пищи
  const getMealIcon = (type) => {
    const normalizedType = type?.toLowerCase() || '';
    const icons = {
      завтрак: '🌅',
      обед: '☀️', 
      ужин: '🌙',
      перекус: '🍎',
      полдник: '🍪'
    };
    return icons[normalizedType] || '🍽️';
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
      {/* Заголовок приема пищи */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 20 }}>
            {getMealIcon(meal.type)}
          </span>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1e293b',
            margin: 0
          }}>
            {meal.type}
          </h3>
        </div>
        <div style={{ fontSize: 14, color: '#666' }}>
          {meal.calories || 0} ккал
        </div>
      </div>

      {/* Название блюда - более выразительное */}
      <div style={{
        marginBottom: 12,
        padding: '10px 14px',
        backgroundColor: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: 12,
        borderLeft: '4px solid #3b82f6'
      }}>
        <div style={{
          fontSize: 17,
          fontWeight: 700,
          color: '#1e293b',
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          🍽️ {mealName}
        </div>
      </div>

      {/* Кнопка для разворачивания ингредиентов - улучшенная */}
      {ingredients.length > 0 && (
        <button
          onClick={() => setShowIngredients(!showIngredients)}
          style={{
            padding: '8px 14px',
            backgroundColor: showIngredients ? '#ddd6fe' : '#e2e8f0',
            color: showIngredients ? '#5b21b6' : '#64748b',
            border: showIngredients ? '2px solid #a855f7' : '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
            boxShadow: showIngredients ? '0 2px 8px rgba(168, 85, 247, 0.2)' : 'none'
          }}
        >
          📊 {showIngredients ? 'Скрыть граммовки' : 'Показать граммовки'}
          <span style={{ 
            transform: showIngredients ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s',
            fontSize: 12
          }}>
            ▼
          </span>
        </button>
      )}

      {/* Список ингредиентов с граммовками - улучшенный стиль */}
      {showIngredients && ingredients.length > 0 && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
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
          {ingredients.map((ingredient, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderBottom: idx < ingredients.length - 1 ? '1px solid #e2e8f0' : 'none',
              fontSize: 12,
              color: '#64748b',
              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
              borderRadius: 6,
              marginBottom: idx < ingredients.length - 1 ? 4 : 0
            }}>
              <span style={{ fontWeight: 500 }}>{ingredient.name}</span>
              <span style={{ 
                fontWeight: 700, 
                color: '#581c87',
                backgroundColor: '#f3e8ff',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11
              }}>
                {ingredient.amount} {ingredient.unit}
              </span>
            </div>
          ))}
        </div>
      )}

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
