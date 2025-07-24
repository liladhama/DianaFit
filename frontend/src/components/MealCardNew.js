import React, { useState } from 'react';
import SwipeSlider from './SwipeSlider';


const MealCard = ({ 
  meal, 
  aiOptions = null,
  index,
  isCompleted, 
  onStatusChange,
  style = {},
  selectedIdx = 0,
  setSelectedIdx = () => {},
  reason,
  onRefreshMeal = null,
  isRefreshing = false
}) => {
  // Если есть варианты из aiMeals — используем их, иначе только meal
  const isAI = Array.isArray(aiOptions) && aiOptions.length > 0;
  // Безопасно получаем meal.options
  const mealOptions = Array.isArray(meal?.options) ? meal.options : [];
  const safeAiOptions = Array.isArray(aiOptions) ? aiOptions : [];
  const safeSelectedIdx = typeof selectedIdx === 'number' && selectedIdx >= 0 ? selectedIdx : 0;
  const mealInfo = isAI && safeAiOptions[safeSelectedIdx] ? safeAiOptions[safeSelectedIdx] : (meal.meal || { name: meal.menu || 'Не указано', ingredients: [] });
  const mealName = typeof mealInfo === 'string' ? mealInfo : mealInfo.name;
  const ingredients = typeof mealInfo === 'object' && mealInfo.ingredients ? mealInfo.ingredients : [];
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
  const handlePrev = () => setSelectedIdx(i => mealOptions.length > 0 ? (i - 1 + mealOptions.length) % mealOptions.length : 0);
  const handleNext = () => setSelectedIdx(i => mealOptions.length > 0 ? (i + 1) % mealOptions.length : 0);

  // Для AI-режима всегда показываем целевую калорийность для всех вариантов
  const aiCalories = isAI && mealOptions[0] ? mealOptions[0].calories : undefined;

  // Обработка смены статуса
  const handleStatusChange = (completedVal) => {
    onStatusChange(index, completedVal);
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
  console.log('[MealCardNew] isCompleted prop:', isCompleted, 'type:', typeof isCompleted);
  console.log('[MealCardNew] completed (internal):', completed, 'type:', typeof completed);

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
      {/* Заголовок приема пищи + стрелки */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flex: 1,
          paddingRight: 8 // чтобы правая граница совпадала с остальными блоками
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            minWidth: 0
          }}>
            <span style={{ fontSize: 22, marginRight: 2 }}>
              {getMealIcon(meal.type)}
            </span>
            <h3 style={{ fontSize: 20, color: '#1e293b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {meal.type}
            </h3>
          </div>
          {/* Кнопка обновления отдельного приема пищи */}
          {onRefreshMeal && (
            <button
              onClick={() => onRefreshMeal(index)}
              disabled={isRefreshing}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: isRefreshing 
                  ? 'linear-gradient(90deg, #666 0%, #888 100%)' 
                  : 'linear-gradient(90deg, #2196f3 0%, #00c6ff 100%)',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                boxShadow: isRefreshing 
                  ? '0 2px 8px rgba(102,102,102,0.2)' 
                  : '0 2px 8px rgba(33,150,243,0.25)',
                transition: 'all 0.2s ease',
                opacity: isRefreshing ? 0.7 : 1,
                minWidth: 80,
                marginLeft: 12,
                marginRight: 0
              }}
              onMouseEnter={e => {
                if (!isRefreshing) {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(33,150,243,0.35)';
                }
              }}
              onMouseLeave={e => {
                if (!isRefreshing) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(33,150,243,0.25)';
                }
              }}
              title={isRefreshing ? "Обновляется..." : "Обновить варианты для этого приема пищи"}
            >
              {isRefreshing ? 'Обновляется...' : 'Обновить'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 180, marginLeft: -10 }}>
          {isAI && mealOptions.length > 1 && (
            <>
              <button 
                onClick={handlePrev} 
                style={{ 
                  fontSize: 20, 
                  cursor: 'pointer', 
                  background: '#ede9fe', 
                  border: 'none', 
                  color: '#7c3aed', 
                  padding: '2px 8px', 
                  borderRadius: 8, 
                  boxShadow: '0 2px 8px #a78bfa33',
                  transition: 'background 0.2s, color 0.2s',
                  marginRight: 1,
                  maxHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={e => { e.target.style.background = '#c7d2fe'; e.target.style.color = '#4f46e5'; }}
                onMouseLeave={e => { e.target.style.background = '#ede9fe'; e.target.style.color = '#7c3aed'; }}
              >←</button>
              <span style={{ 
                fontSize: 15, 
                color: '#4f46e5', 
                minWidth: 30, 
                textAlign: 'center', 
                fontWeight: 700, 
                letterSpacing: '0.5px',
                background: '#f3f4f6',
                borderRadius: 8,
                padding: '2px 6px',
                margin: '0 1px',
                maxHeight: 28,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap'
              }}>{selectedIdx + 1} / {meal.options.length}</span>
              <button 
                onClick={handleNext} 
                style={{ 
                  fontSize: 20, 
                  cursor: 'pointer', 
                  background: '#ede9fe', 
                  border: 'none', 
                  color: '#7c3aed', 
                  padding: '2px 8px', 
                  borderRadius: 8, 
                  boxShadow: '0 2px 8px #a78bfa33',
                  transition: 'background 0.2s, color 0.2s',
                  marginLeft: 1,
                  maxHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
          lineHeight: 1.4,
          letterSpacing: '0.02em',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          wordSpacing: 'normal',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          🍽️ {mealName}
        </div>
      </div>

      {/* Кнопки для разворачивания ингредиентов и рецепта */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 12,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={handleShowIngredients}
          style={{
            flex: '1 1 0',
            minWidth: 0,
            maxWidth: 'calc(50% - 4px)',
            padding: '8px 12px',
            backgroundColor: showIngredients ? '#ddd6fe' : '#e2e8f0',
            color: showIngredients ? '#5b21b6' : '#64748b',
            border: showIngredients ? '2px solid #a855f7' : '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            transition: 'all 0.2s ease',
            boxShadow: showIngredients ? '0 2px 8px rgba(168, 85, 247, 0.2)' : 'none',
            boxSizing: 'border-box',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            📊 {showIngredients ? 'Скрыть' : 'Граммовки'}
          </span>
          <span style={{ 
            transform: showIngredients ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s',
            fontSize: 12,
            flexShrink: 0
          }}>
            ▼
          </span>
        </button>
        <button
          onClick={handleShowInstructions}
          style={{
            flex: '1 1 0',
            minWidth: 0,
            maxWidth: 'calc(50% - 4px)',
            padding: '8px 12px',
            backgroundColor: showInstructions ? '#dbeafe' : '#e2e8f0',
            color: showInstructions ? '#2563eb' : '#64748b',
            border: showInstructions ? '2px solid #2563eb' : '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            transition: 'all 0.2s ease',
            boxShadow: showInstructions ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
            boxSizing: 'border-box',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            📝 {showInstructions ? 'Скрыть' : 'Рецепт'}
          </span>
          <span style={{ 
            transform: showInstructions ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s',
            fontSize: 12,
            flexShrink: 0
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
          borderLeft: '4px solid #8b5cf6',
          width: '100%',
          boxSizing: 'border-box'
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
              marginBottom: idx < ingredients.length - 1 ? 4 : 0,
              minHeight: 28,
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <span style={{
                fontWeight: 500,
                maxWidth: '70%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.5,
                minHeight: 18,
                display: 'block',
                letterSpacing: '0.06em',
                fontFamily: 'Segoe UI, Arial, Tahoma, Geneva, Verdana, sans-serif',
              }}>{ingredient.name}</span>
              <span style={{
                fontWeight: 700,
                color: '#581c87',
                backgroundColor: '#f3e8ff',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 13,
                flexShrink: 0,
                minWidth: 40,
                textAlign: 'right',
                marginLeft: 8,
              }}>
                      {typeof ingredient.amount === 'number'
                        ? (
                            // Округляем все виды яиц до целого
                            (ingredient.unit === 'шт' && /яйцо|egg/i.test(ingredient.name))
                              ? Math.round(ingredient.amount)
                              : (['г', 'мл'].includes(ingredient.unit)
                                  ? Math.round(ingredient.amount / 5) * 5
                                  : (['щепотка', 'ч.л.', 'ст.л.', 'кусочек', 'ломтик', 'стебель', 'зубчик', 'шт'].includes(ingredient.unit)
                                      ? (Math.round(ingredient.amount * 10) / 10).toString().replace('.0', '')
                                      : ingredient.amount)
                                )
                          )
                        : ingredient.amount} {ingredient.unit}
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
          <ol style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, paddingLeft: 18, margin: 0 }}>
            {(Array.isArray(mealInfo.instructions)
              ? mealInfo.instructions
              : (typeof mealInfo.instructions === 'string'
                  ? mealInfo.instructions.split('\n').map(s => s.trim()).filter(Boolean)
                  : [])
              )
              .map((step, idx) => {
                // Убираем только номера в начале строки
                const cleanStep = step.replace(/^\d+\.?\s*/, '');
                return <li key={idx} style={{ marginBottom: 6 }}>{cleanStep}</li>;
              })}
          </ol>
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
          {!completed && reason && (
            <div style={{ marginTop: 6, color: '#991b1b', fontSize: 12, fontStyle: 'italic' }}>
              Причина: {typeof reason === 'object' ? (reason.text || JSON.stringify(reason)) : reason}
            </div>
          )}
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
