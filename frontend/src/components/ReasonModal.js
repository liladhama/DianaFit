import React, { useState } from 'react';

// Компонент модала для выбора причины невыполнения
export default function ReasonModal({ isVisible, onClose, onReasonSelected, type, itemName }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Причины для тренировок
  const workoutReasons = [
    { id: 'time', text: '⏰ Не хватило времени', category: 'time' },
    { id: 'tired', text: '😴 Слишком устал(а)', category: 'energy' },
    { id: 'sick', text: '🤒 Плохо себя чувствую', category: 'health' },
    { id: 'work', text: '💼 Много работы', category: 'schedule' },
    { id: 'motivation', text: '😞 Нет мотивации', category: 'mental' },
    { id: 'injury', text: '🤕 Травма/боль', category: 'health' },
    { id: 'equipment', text: '🏋️ Нет оборудования', category: 'resources' },
    { id: 'weather', text: '🌧️ Плохая погода', category: 'environment' },
    { id: 'family', text: '👨‍👩‍👧‍👦 Семейные дела', category: 'schedule' },
    { id: 'forgot', text: '🤦 Забыл(а)', category: 'organization' },
    { id: 'other', text: '📝 Другая причина...', category: 'other' }
  ];

  // Причины для питания
  const mealReasons = [
    { id: 'not_hungry', text: '🚫 Не было голода', category: 'appetite' },
    { id: 'no_products', text: '🛒 Не было продуктов', category: 'resources' },
    { id: 'no_time', text: '⏰ Не было времени готовить', category: 'time' },
    { id: 'expensive', text: '💰 Слишком дорого', category: 'budget' },
    { id: 'dont_like', text: '😖 Не нравится вкус', category: 'preference' },
    { id: 'ate_other', text: '🍕 Съел(а) что-то другое', category: 'choice' },
    { id: 'restaurant', text: '🍽️ Ел(а) в ресторане', category: 'social' },
    { id: 'work_lunch', text: '🏢 Рабочий обед', category: 'schedule' },
    { id: 'celebration', text: '🎉 Праздник/мероприятие', category: 'social' },
    { id: 'stress', text: '😰 Стресс/переживания', category: 'mental' },
    { id: 'forgot', text: '🤦 Забыл(а) поесть', category: 'organization' },
    { id: 'other', text: '📝 Другая причина...', category: 'other' }
  ];

  const reasons = type === 'workout' ? workoutReasons : mealReasons;

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
    if (reasonId === 'other') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomReason('');
    }
  };

  const handleSubmit = () => {
    const finalReason = selectedReason === 'other' ? customReason : selectedReason;
    if (finalReason) {
      const reasonData = {
        id: selectedReason,
        text: selectedReason === 'other' ? customReason : reasons.find(r => r.id === selectedReason)?.text,
        category: reasons.find(r => r.id === selectedReason)?.category || 'other',
        timestamp: new Date().toISOString()
      };
      onReasonSelected(reasonData);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setShowCustomInput(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#1a1a1a'
          }}>
            {type === 'workout' ? '🏋️ Почему не выполнили?' : '🍽️ Почему не съели?'}
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666',
              padding: 0,
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Название элемента */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
            {type === 'workout' ? 'Упражнение:' : 'Прием пищи:'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
            {itemName}
          </div>
        </div>

        {/* Список причин */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 14,
            color: '#666',
            marginBottom: 12,
            fontWeight: 500
          }}>
            Выберите причину:
          </div>
          
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: 8
          }}>
            {reasons.map((reason, index) => (
              <button
                key={reason.id}
                onClick={() => handleReasonSelect(reason.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: selectedReason === reason.id ? '#e0e7ff' : '#fff',
                  color: selectedReason === reason.id ? '#2196f3' : '#1a1a1a',
                  fontSize: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: index < reasons.length - 1 ? '1px solid #f0f0f0' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  if (selectedReason !== reason.id) {
                    e.target.style.backgroundColor = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedReason !== reason.id) {
                    e.target.style.backgroundColor = '#fff';
                  }
                }}
              >
                <span style={{ marginRight: 8 }}>
                  {selectedReason === reason.id ? '●' : '○'}
                </span>
                {reason.text}
              </button>
            ))}
          </div>
        </div>

        {/* Поле для ввода своей причины */}
        {showCustomInput && (
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              color: '#666',
              marginBottom: 8,
              fontWeight: 500
            }}>
              Укажите свою причину:
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Опишите причину..."
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: 80,
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Кнопки */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              backgroundColor: '#fff',
              color: '#666',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim())}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 8,
              backgroundColor: selectedReason && (selectedReason !== 'other' || customReason.trim()) 
                ? '#2196f3' : '#e2e8f0',
              color: selectedReason && (selectedReason !== 'other' || customReason.trim()) 
                ? '#fff' : '#999',
              fontSize: 14,
              fontWeight: 600,
              cursor: selectedReason && (selectedReason !== 'other' || customReason.trim()) 
                ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
