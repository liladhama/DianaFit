import React, { useState } from 'react';

// Компонент для одного приёма пищи с выбором варианта блюда
export default function MealBlock({ meal, isCompleted, onStatusChange }) {
  // meal: { type, options: [ { name, calories, protein, fat, carbs, ingredients, instructions, ... } ] }
  const [selectedIdx, setSelectedIdx] = useState(0);
  const option = meal.options?.[selectedIdx] || {};
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handlePrev = () => setSelectedIdx(i => (i - 1 + meal.options.length) % meal.options.length);
  const handleNext = () => setSelectedIdx(i => (i + 1) % meal.options.length);

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, boxShadow: '0 2px 8px #0001', border: '1px solid #f1f5f9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={handlePrev} style={{ fontSize: 18, marginRight: 8, cursor: 'pointer', background: 'none', border: 'none' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{meal.type}</div>
        <button onClick={handleNext} style={{ fontSize: 18, marginLeft: 8, cursor: 'pointer', background: 'none', border: 'none' }}>→</button>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{option.name || '—'}</div>
      <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
        Ккал: {typeof option.calories === 'number' ? Math.round(option.calories / 5) * 5 : '-'} | Б: {option.protein || '-'} | Ж: {option.fat || '-'} | У: {option.carbs || '-'}
      </div>
      <button onClick={() => setShowIngredients(v => !v)} style={{ fontSize: 13, marginBottom: 6, borderRadius: 8, border: '1px solid #cbd5e1', background: showIngredients ? '#ddd6fe' : '#e2e8f0', color: showIngredients ? '#5b21b6' : '#64748b', padding: '6px 12px', cursor: 'pointer' }}>
        {showIngredients ? 'Скрыть граммовки' : 'Показать граммовки'}
      </button>
      {showIngredients && option.ingredients && (
        <ul style={{ fontSize: 13, margin: 0, padding: '0 0 0 16px', marginBottom: 8 }}>
          {option.ingredients.map((ing, i) => {
            // Для специй, ложек, щепоток, шт и т.п. — не округлять до 5
            const specialUnits = ["щепотка", "ч.л.", "ст.л.", "кусочек", "ломтик", "стебель", "зубчик", "шт"];
            let displayAmount = ing.amount;
            if (["г", "мл"].includes(ing.unit)) {
              displayAmount = Math.round(ing.amount / 5) * 5;
            } else if (specialUnits.includes(ing.unit)) {
              displayAmount = (Math.round(ing.amount * 10) / 10).toString().replace(".0", "");
            }
            return (
              <li key={i}>{ing.name}: {displayAmount} {ing.unit}</li>
            );
          })}
        </ul>
      )}
      <button onClick={() => setShowInstructions(v => !v)} style={{ fontSize: 13, marginBottom: 6, borderRadius: 8, border: '1px solid #cbd5e1', background: showInstructions ? '#fef08a' : '#f1f5f9', color: '#b45309', padding: '6px 12px', cursor: 'pointer' }}>
        {showInstructions ? 'Скрыть инструкцию' : 'Показать инструкцию'}
      </button>
      {showInstructions && option.instructions && (
        <div style={{ fontSize: 13, background: '#fefce8', borderRadius: 8, padding: 8, marginBottom: 8, whiteSpace: 'pre-line', color: '#92400e' }}>
          {option.instructions}
        </div>
      )}
      {/* Слайдер "съел/не съел" не трогаем, просто отображаем статус */}
      {typeof isCompleted === 'boolean' && (
        <div style={{ marginTop: 10, fontSize: 13, color: isCompleted ? '#166534' : '#991b1b', background: isCompleted ? '#dcfce7' : '#fef2f2', border: `1px solid ${isCompleted ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: 6, textAlign: 'center' }}>
          {isCompleted ? '✅ Прием пищи выполнен' : '❌ Прием пищи пропущен'}
        </div>
      )}
    </div>
  );
}
