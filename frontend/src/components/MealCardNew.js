import React, { useState } from 'react';
import SwipeSlider from './SwipeSlider';

const MealCard = ({ 
  meal, 
  isCompleted, 
  onStatusChange,
  style = {},
  selectedIdx = 0,
  setSelectedIdx = () => {}
}) => {
  // AI-режим: если есть несколько вариантов (options)
  const isAI = Array.isArray(meal.options) && meal.options.length > 0;
  // Если AI — берем выбранный вариант, иначе обычный режим
  const mealInfo = isAI ? meal.options[selectedIdx] : (meal.meal || { name: meal.menu || 'Не указано', ingredients: [] });
  const mealName = typeof mealInfo === 'string' ? mealInfo : mealInfo.name;
  const ingredients = typeof mealInfo === 'object' && mealInfo.ingredients ? mealInfo.ingredients : [];
  // Статус теперь всегда общий для всего приема пищи
  const completed = isCompleted;

  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

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

  // Стрелки выбора варианта (AI)
  const handlePrev = () => setSelectedIdx(i => (i - 1 + meal.options.length) % meal.options.length);
  const handleNext = () => setSelectedIdx(i => (i + 1) % meal.options.length);

  // Для AI-режима всегда показываем целевую калорийность для всех вариантов
  const aiCalories = isAI ? meal.options[0]?.calories : undefined;

  // Обработка смены статуса
  const handleStatusChange = (completedVal) => {
    onStatusChange(meal.id, completedVal, 'meal');
  };

  // Обработка открытия секций
  const handleShowIngredients = () => {
    setShowIngredients(v => !v);
    if (!showIngredients) setShowInstructions(false);
  };
  const handleShowInstructions = () => {
    setShowInstructions(v => !v);
    if (!showInstructions) setShowIngredients(false);
  };

  // --- ОТЛАДКА: выводим структуру данных ---
  console.log('[MealCardNew] meal:', meal);
  console.log('[MealCardNew] mealInfo:', mealInfo);

  // --- Улучшенное определение калорий и макроэлементов ---
  let calories = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  if (isAI) {
    // Для AI-режима пробуем взять из выбранного варианта, иначе из первого варианта
    calories = typeof mealInfo.calories === 'number' ? mealInfo.calories : (typeof meal.options[0]?.calories === 'number' ? meal.options[0].calories : 0);
    protein = typeof mealInfo.protein === 'number' ? mealInfo.protein : (typeof meal.options[0]?.protein === 'number' ? meal.options[0].protein : 0);
    fat = typeof mealInfo.fat === 'number' ? mealInfo.fat : (typeof meal.options[0]?.fat === 'number' ? meal.options[0].fat : 0);
    carbs = typeof mealInfo.carbs === 'number' ? mealInfo.carbs : (typeof meal.options[0]?.carbs === 'number' ? meal.options[0].carbs : 0);
  } else {
    calories = typeof mealInfo.calories === 'number' ? mealInfo.calories : (typeof meal.calories === 'number' ? meal.calories : 0);
    protein = typeof mealInfo.protein === 'number' ? mealInfo.protein : (typeof meal.protein === 'number' ? meal.protein : 0);
    fat = typeof mealInfo.fat === 'number' ? mealInfo.fat : (typeof meal.fat === 'number' ? meal.fat : 0);
    carbs = typeof mealInfo.carbs === 'number' ? mealInfo.carbs : (typeof meal.carbs === 'number' ? meal.carbs : 0);
  }

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
      {/* Заголовок приема пищи + AI + стрелки */}
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
          <span style={{ fontSize: 22, marginRight: 6 }}>
            {getMealIcon(meal.type)}
          </span>
          <h3 style={{ fontSize: 20, color: '#1e293b', margin: 0 }}>
            {meal.type}
          </h3>
          {isAI && (
            <span style={{
              fontSize: 11,
              color: '#a21caf',
              background: '#f3e8ff',
              borderRadius: 6,
              padding: '2px 7px',
              fontWeight: 700,
              marginLeft: 8
            }}>AI</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isAI && meal.options.length > 1 && (
            <>
              <button 
                onClick={handlePrev} 
                style={{ 
                  fontSize: 22, 
                  cursor: 'pointer', 
                  background: '#ede9fe', 
                  border: 'none', 
                  color: '#7c3aed', 
                  padding: '4px 10px', 
                  borderRadius: 10, 
                  boxShadow: '0 2px 8px #a78bfa33',
                  transition: 'background 0.2s, color 0.2s',
                  marginRight: 2
                }}
                onMouseEnter={e => { e.target.style.background = '#c7d2fe'; e.target.style.color = '#4f46e5'; }}
                onMouseLeave={e => { e.target.style.background = '#ede9fe'; e.target.style.color = '#7c3aed'; }}
              >←</button>
              <span style={{ 
                fontSize: 15, 
                color: '#4f46e5', 
                minWidth: 34, 
                textAlign: 'center', 
                fontWeight: 700, 
                letterSpacing: '0.5px',
                background: '#f3f4f6',
                borderRadius: 6,
                padding: '2px 8px',
                margin: '0 2px'
              }}>{selectedIdx + 1} / {meal.options.length}</span>
              <button 
                onClick={handleNext} 
                style={{ 
                  fontSize: 22, 
                  cursor: 'pointer', 
                  background: '#ede9fe', 
                  border: 'none', 
                  color: '#7c3aed', 
                  padding: '4px 10px', 
                  borderRadius: 10, 
                  boxShadow: '0 2px 8px #a78bfa33',
                  transition: 'background 0.2s, color 0.2s',
                  marginLeft: 2
                }}
                onMouseEnter={e => { e.target.style.background = '#c7d2fe'; e.target.style.color = '#4f46e5'; }}
                onMouseLeave={e => { e.target.style.background = '#ede9fe'; e.target.style.color = '#7c3aed'; }}
              >→</button>
            </>
          )}
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

      {/* Кнопки для разворачивания ингредиентов и рецепта */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={handleShowIngredients}
          style={{
            flex: 1,
            padding: '8px 14px',
            backgroundColor: showIngredients ? '#ddd6fe' : '#e2e8f0',
            color: showIngredients ? '#5b21b6' : '#64748b',
            border: showIngredients ? '2px solid #a855f7' : '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
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
        <button
          onClick={handleShowInstructions}
          style={{
            flex: 1,
            padding: '8px 14px',
            backgroundColor: showInstructions ? '#dbeafe' : '#e2e8f0',
            color: showInstructions ? '#2563eb' : '#64748b',
            border: showInstructions ? '2px solid #2563eb' : '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
            boxShadow: showInstructions ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
          }}
        >
          📝 {showInstructions ? 'Скрыть рецепт' : 'Рецепт приготовления'}
          <span style={{ 
            transform: showInstructions ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s',
            fontSize: 12
          }}>
            ▼
          </span>
        </button>
      </div>
      {/* Ккал под кнопками */}
      <div style={{
        width: '100%',
        textAlign: 'center',
        fontSize: 15,
        color: '#4f46e5',
        fontWeight: 700,
        marginBottom: 10
      }}>
        {Math.round(calories / 5) * 5} ккал
      </div>

      {/* Список ингредиентов с граммовками */}
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
                {typeof ingredient.amount === 'number' ? Math.round(ingredient.amount / 5) * 5 : ingredient.amount} {ingredient.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Рецепт приготовления */}
      {showInstructions && mealInfo.instructions && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          borderLeft: '4px solid #2563eb'
        }}>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 700, 
            color: '#1e40af', 
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            📝 Рецепт приготовления:
          </div>
          {Array.isArray(mealInfo.instructions) ? (
            <ol style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, paddingLeft: 18, margin: 0 }}>
              {mealInfo.instructions.map((step, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>{step}</li>
              ))}
            </ol>
          ) : (
            <div style={{ fontSize: 13, color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
              {mealInfo.instructions}
            </div>
          )}
        </div>
      )}

      {/* Swipe Slider для статуса */}
      <SwipeSlider
        isCompleted={completed}
        onStatusChange={handleStatusChange}
        leftText="Съел"
        rightText="Не съел"
        leftIcon="🍽️"
        rightIcon="❌"
      />

      {/* Статус выполнения */}
      {completed !== null && (
        <div style={{
          marginTop: 16,
          padding: 8,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          textAlign: 'center',
          backgroundColor: completed ? '#dcfce7' : '#fef2f2',
          color: completed ? '#166534' : '#991b1b',
          border: `1px solid ${completed ? '#bbf7d0' : '#fecaca'}`
        }}>
          {completed ? '✅ Прием пищи выполнен' : '❌ Прием пищи пропущен'}
        </div>
      )}
    </div>
  );
};

export default MealCard;

// Очистка localStorage при загрузке страницы (только для разработки)
if (window && window.localStorage) {
  try {
    localStorage.clear();
    // Можно также удалить только крупные ключи, если нужно:
    // localStorage.removeItem('program_demo-ad-1751809317122');
  } catch (e) {
    console.warn('Ошибка очистки localStorage:', e);
  }
}
