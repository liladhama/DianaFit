import React, { useRef } from 'react';

export default function CustomSlider({ value, min, max, step = 1, unit = '', onChange, height = 260 }) {
  const marks = 21;
  const markStep = Math.max(1, Math.round((max - min) / (marks - 1)));
  const marksArr = Array.from({ length: marks }, (_, i) => min + i * markStep);

  // Размеры для бегунка и палочки
  const knobSize = 32; // увеличиваем для лучшего захвата
  const stickLength = 52;
  const grabSize = 64; // увеличиваем область захвата

  // Позиция бегунка (от 0 до height)
  const percent = ((value - min) / (max - min));
  const y = height - percent * height;

  const sliderRef = useRef();

  // Улучшенные drag/touch обработчики для более плавного движения
  function handleDrag(e) {
    e.preventDefault(); // предотвращаем скролл на мобильных
    let clientY;
    if (e.touches && e.touches.length > 0) {
      clientY = e.touches[0].clientY;
    } else {
      clientY = e.clientY;
    }
    
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    let pos = clientY - rect.top;
    
    // Ограничиваем позицию в пределах слайдера
    pos = Math.max(0, Math.min(height, pos));
    
    // Более точное вычисление значения с учетом step
    const rawValue = (max - min) * (1 - pos / height) + min;
    const steppedValue = Math.round(rawValue / step) * step;
    const newValue = Math.max(min, Math.min(max, steppedValue));
    
    onChange(newValue);
  }

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Устанавливаем курсор захвата
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    
    handleDrag(e);
    
    // Используем passive: false для предотвращения скролла
    const options = { passive: false };
    window.addEventListener('mousemove', handleDrag, options);
    window.addEventListener('touchmove', handleDrag, options);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
  }
  
  function stopDrag() {
    // Восстанавливаем курсор
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('touchmove', handleDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchend', stopDrag);
  }

  return (
    <div style={{ height, maxHeight: 420, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {/* Значение и единицы */}
      <div style={{ fontSize: 40, fontWeight: 700, marginRight: 24, color: '#222', minWidth: 80, textAlign: 'right' }}>
        {value} <span style={{ fontSize: 22, fontWeight: 400 }}>{unit}</span>
      </div>
      {/* Вертикальный слайдер */}
      <div ref={sliderRef} style={{ height, position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center', touchAction: 'none' }}>
        {/* Линейка (вертикальная линия) */}
        <div style={{ position: 'absolute', left: 18, top: 0, width: 2, height: '100%', background: '#222', borderRadius: 1, zIndex: 1, opacity: 1 }} />
        {/* Деления */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginRight: 0, position: 'relative', zIndex: 2 }}>
          {marksArr.map((m, i) => (
            <div key={i} style={{ width: i % 5 === 0 ? 16 : 8, height: 2, background: '#222', borderRadius: 1, opacity: 1, marginLeft: 0 }} />
          ))}
        </div>
        {/* Кастомный бегунок: палочка + круг + невидимая область */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: y - grabSize / 2,
            width: stickLength + grabSize,
            height: grabSize,
            display: 'flex',
            alignItems: 'center',
            zIndex: 3,
            cursor: 'grab',
            pointerEvents: 'auto',
            transition: 'none', // убираем transition для более отзывчивого движения
          }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          {/* Палочка влево от линейки */}
          <div style={{ 
            width: stickLength, 
            height: 5, // увеличиваем высоту для лучшей видимости
            background: '#2196f3', 
            borderRadius: 3, 
            marginRight: 0,
            boxShadow: '0 1px 3px rgba(33, 150, 243, 0.3)'
          }} />
          {/* Круг */}
          <div style={{ 
            width: knobSize, 
            height: knobSize, 
            borderRadius: '50%', 
            background: '#fff', 
            border: '4px solid #2196f3', 
            boxShadow: '0 3px 12px rgba(33, 150, 243, 0.4)', 
            marginLeft: -knobSize/2, 
            zIndex: 2,
            transition: 'box-shadow 0.2s ease'
          }} />
          {/* Увеличенная невидимая область для drag */}
          <div style={{ 
            position: 'absolute', 
            left: stickLength - grabSize/2, 
            top: 0, 
            width: grabSize, 
            height: grabSize, 
            borderRadius: '50%', 
            background: 'rgba(0,0,0,0)', 
            zIndex: 1 
          }} />
        </div>
        {/* Улучшенный скрытый input для клавиатуры и accessibility */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            writingMode: 'bt-lr',
            WebkitAppearance: 'slider-vertical',
            width: stickLength + grabSize + 30,
            height,
            accentColor: '#2196f3',
            position: 'absolute',
            left: -15,
            top: 0,
            opacity: 0,
            zIndex: 4,
            cursor: 'pointer',
            touchAction: 'manipulation', // улучшаем touch поведение
          }}
          aria-label={`Выберите значение от ${min} до ${max} ${unit}`}
        />
      </div>
      {/* Подписи min/max */}
      <div style={{ height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginLeft: 12, fontSize: 16, color: '#888', alignItems: 'flex-start' }}>
        <span>{max}</span>
        <span>{min}</span>
      </div>
    </div>
  );
}
