import React, { useRef } from 'react';

export default function CustomSlider({ value, min, max, step = 1, unit = '', onChange, height = 260 }) {
  const marks = 21;
  const markStep = Math.max(1, Math.round((max - min) / (marks - 1)));
  const marksArr = Array.from({ length: marks }, (_, i) => min + i * markStep);

  // Размеры для бегунка и палочки
  const knobSize = 28; // чуть больше для удобства
  const stickLength = 48;
  const grabSize = 56; // невидимая область для drag

  // Позиция бегунка (от 0 до height)
  const percent = ((value - min) / (max - min));
  const y = height - percent * height;

  const sliderRef = useRef();

  // Drag/touch обработчики для кастомного бегунка
  function handleDrag(e) {
    let clientY;
    if (e.touches) {
      clientY = e.touches[0].clientY;
    } else {
      clientY = e.clientY;
    }
    const rect = sliderRef.current.getBoundingClientRect();
    let pos = clientY - rect.top;
    pos = Math.max(0, Math.min(height, pos));
    const newValue = Math.round((max - min) * (1 - pos / height) + min);
    onChange(newValue);
  }

  function startDrag(e) {
    e.preventDefault();
    handleDrag(e);
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('touchmove', handleDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
  }
  function stopDrag() {
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
        {/* Деления */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginRight: 0 }}>
          {marksArr.map((m, i) => (
            <div key={i} style={{ width: i % 5 === 0 ? 16 : 8, height: 2, background: '#e0e7ff', borderRadius: 1 }} />
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
            transition: 'top 0.2s',
            cursor: 'grab',
            pointerEvents: 'auto',
          }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          {/* Палочка влево от линейки */}
          <div style={{ width: stickLength, height: 4, background: '#22c55e', borderRadius: 2, marginRight: 0 }} />
          {/* Круг */}
          <div style={{ width: knobSize, height: knobSize, borderRadius: '50%', background: '#fff', border: '3px solid #22c55e', boxShadow: '0 2px 8px #22c55e33', marginLeft: -knobSize/2, zIndex: 2 }} />
          {/* Невидимая область для drag */}
          <div style={{ position: 'absolute', left: stickLength, top: 0, width: grabSize, height: grabSize, borderRadius: '50%', background: 'rgba(0,0,0,0)', zIndex: 1 }} />
        </div>
        {/* Скрытый input для совместимости с клавиатурой и accessibility */}
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
            accentColor: '#22c55e',
            position: 'absolute',
            left: -15,
            top: 0,
            opacity: 0,
            zIndex: 4,
            cursor: 'pointer',
            touchAction: 'none',
          }}
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
