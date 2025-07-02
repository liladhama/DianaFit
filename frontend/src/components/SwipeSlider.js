import React, { useState, useRef, useEffect } from 'react';

const SwipeSlider = ({ 
  isCompleted, 
  onStatusChange, 
  leftText = "Выполнил", 
  rightText = "Не выполнил",
  leftIcon = "✅",
  rightIcon = "❌",
  disabled = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    console.log('🎛️ SwipeSlider ИНИЦИАЛИЗАЦИЯ: изначально устанавливаем position = 50 (центр)');
    return 50;
  }); // ВСЕГДА начинаем с центра
  const [startX, setStartX] = useState(0);
  const [startPosition, setStartPosition] = useState(50);
  const sliderRef = useRef(null);
  const knobRef = useRef(null);

  // Устанавливаем позицию на основе текущего статуса только если статус уже выбран
  useEffect(() => {
    console.log('🎛️ SwipeSlider useEffect: isCompleted =', isCompleted, 'type:', typeof isCompleted, 'isCompleted === null:', isCompleted === null, 'isCompleted === undefined:', isCompleted === undefined);
    
    if (isCompleted === true) {
      console.log('🎛️ Устанавливаем позицию слева (выполнено)');
      setPosition(15); // Левая сторона (выполнено)
    } else if (isCompleted === false) {
      console.log('🎛️ Устанавливаем позицию справа (не выполнено)');
      setPosition(85); // Правая сторона (не выполнено)
    } else {
      console.log('🎛️ Устанавливаем позицию в центре (не выбрано) - isCompleted не true и не false');
      setPosition(50); // Центр (не выбрано) - ПО УМОЛЧАНИЮ для null, undefined
    }
  }, [isCompleted]);

  const handleStart = (clientX) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(clientX);
    setStartPosition(position);
  };

  const handleMove = (clientX) => {
    if (!isDragging || !sliderRef.current || disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const sliderWidth = rect.width;
    const deltaX = clientX - startX;
    const deltaPercent = (deltaX / sliderWidth) * 100;
    
    let newPosition = startPosition + deltaPercent;
    newPosition = Math.max(10, Math.min(90, newPosition)); // Ограничиваем от 10% до 90%
    
    setPosition(newPosition);
  };

  const handleEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    // Определяем зону и статус
    if (position < 30) {
      // Левая зона - выполнено
      setPosition(15);
      if (isCompleted !== true) {
        onStatusChange(true);
      }
    } else if (position > 70) {
      // Правая зона - не выполнено
      setPosition(85);
      if (isCompleted !== false) {
        onStatusChange(false);
      }
    } else {
      // Центральная зона - возвращаем к текущему статусу или центру
      if (isCompleted === true) {
        setPosition(15);
      } else if (isCompleted === false) {
        setPosition(85);
      } else {
        setPosition(50); // Возвращаем в центр если ничего не выбрано
      }
    }
  };

  // Обработчик клика по полосе для быстрого выбора
  const handleTrackClick = (e) => {
    if (disabled || isDragging) return;

    // Проверяем, что клик не по ручке
    if (e.target === knobRef.current || knobRef.current?.contains(e.target)) {
      return;
    }

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = (clickX / rect.width) * 100;

    // Определяем, в какую зону кликнули
    if (clickPercent < 50) {
      // Клик в левую половину - выполнено
      setPosition(15);
      if (isCompleted !== true) {
        onStatusChange(true);
      }
    } else {
      // Клик в правую половину - не выполнено
      setPosition(85);
      if (isCompleted !== false) {
        onStatusChange(false);
      }
    }
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Предотвращаем всплытие к обработчику клика полосы
    handleStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Предотвращаем всплытие к обработчику клика полосы
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleEnd();
  };

  // Глобальные обработчики для завершения перетаскивания
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, position, startX, startPosition]);

  // Получаем цвет фона - теперь просто нейтральная полоса
  const getBackgroundGradient = () => {
    return '#f1f5f9'; // Простой серый цвет для всей полосы
  };

  // Получаем цвет ручки - теперь цвет меняется в зависимости от позиции
  const getKnobColor = () => {
    if (position < 30) return '#22c55e'; // Зеленый при выборе "выполнено"
    if (position > 70) return '#ef4444'; // Красный при выборе "не выполнено"
    return '#94a3b8'; // Серый в центральной позиции
  };

  // Получаем размер и тень ручки
  const getKnobStyle = () => {
    const baseSize = 32; // Увеличили размер ручки на 4px (~2мм)
    const scale = isDragging ? 1.1 : 1;
    const size = baseSize * scale;
    
    return {
      width: size,
      height: size,
      backgroundColor: getKnobColor(),
      boxShadow: isDragging 
        ? '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)' 
        : '0 4px 15px rgba(0, 0, 0, 0.1), 0 2px 5px rgba(0, 0, 0, 0.05)',
      transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      scale: scale // Используем scale напрямую для анимации
    };
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 70, // Увеличили общую высоту, чтобы поместить подписи и больший ползунок
      marginTop: 12,
      userSelect: 'none',
      opacity: disabled ? 0.6 : 1
    }}>
      {/* Подписи выше полосы - тонким шрифтом */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8
      }}>
        {/* Левая подпись */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 300, // Тонкий шрифт
          color: '#64748b',
          opacity: 0.8
        }}>
          <span style={{ fontSize: 12 }}>{leftIcon}</span>
          <span>{leftText}</span>
        </div>

        {/* Правая подпись */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 300, // Тонкий шрифт
          color: '#64748b',
          opacity: 0.8
        }}>
          <span>{rightText}</span>
          <span style={{ fontSize: 12 }}>{rightIcon}</span>
        </div>
      </div>

      {/* Фоновый трек - более узкая серая полоса */}
      <div
        ref={sliderRef}
        onClick={handleTrackClick}
        style={{
          position: 'absolute',
          top: 30, // Сдвинули положение полосы
          left: 0,
          right: 0,
          height: 24, // Сделали полосу уже (было 50)
          background: getBackgroundGradient(),
          borderRadius: 12, // Пропорционально уменьшили
          border: '1px solid #e2e8f0', // Тоньше рамка
          cursor: disabled ? 'not-allowed' : 'pointer',
          overflow: 'hidden'
        }}
      >
        {/* Простые направляющие линии без цветов */}
        {/* Центральная линия - 50% */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '20%',
          bottom: '20%',
          width: '2px',
          background: '#94a3b8',
          borderRadius: '1px',
          transform: 'translateX(-50%)',
          opacity: 0.8
        }} />

        {/* Невидимые зоны для кликов - для лучшего UX */}
        {/* Левая зона клика */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '50%',
          height: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: 0, // Невидимая
          zIndex: 5
        }} />
        
        {/* Правая зона клика */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '50%',
          height: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: 0, // Невидимая
          zIndex: 5
        }} />
      </div>

      {/* Перетаскиваемая ручка - вынесена поверх полосы */}
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'absolute',
          top: 42, // Выровняли точно по центру полосы (30 + 24/2 = 42)
          left: `${position}%`,
          borderRadius: '50%',
          cursor: disabled ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14, // Чуть меньше шрифт в ручке
          fontWeight: 600,
          color: '#ffffff', // Белый текст на цветном фоне
          backgroundColor: getKnobColor(), // Цвет фона ручки меняется
          transform: 'translate(-50%, -50%)', // Центрируем ползунок
          zIndex: 20, // Выше всех элементов
          ...getKnobStyle()
        }}
      >
        {position < 35 ? leftIcon : position > 65 ? rightIcon : '○'}
      </div>
    </div>
  );
};

export default SwipeSlider;
