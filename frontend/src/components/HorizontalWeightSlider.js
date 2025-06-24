import React, { useRef } from 'react';

export default function HorizontalWeightSlider({ value, min, max, step = 1, unit = '', onChange }) {
  // Генерируем деления
  const marks = 21;
  const markStep = Math.max(1, Math.round((max - min) / (marks - 1)));
  const marksArr = Array.from({ length: marks }, (_, i) => min + i * markStep);

  // Позиция бегунка
  const percent = ((value - min) / (max - min));
  const sliderRef = useRef();
  const grabHeight = 64;
  const grabWidth = 64;

  // Drag/touch обработчики для кастомного бегунка
  function handleDrag(e) {
    let clientX;
    if (e.touches) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    const rect = sliderRef.current.getBoundingClientRect();
    let pos = clientX - rect.left;
    pos = Math.max(0, Math.min(rect.width, pos));
    const newValue = Math.round((max - min) * (pos / rect.width) + min);
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
    <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
      <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 8, color: '#222', letterSpacing: -2 }}>
        {value} <span style={{ fontSize: 24, fontWeight: 400 }}>{unit}</span>
      </div>
      <div ref={sliderRef} style={{ width: '100%', position: 'relative', height: 64, margin: '32px 0 8px 0', display: 'flex', alignItems: 'center', touchAction: 'none' }}>
        {/* Линейка */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 32, height: 2, background: '#e0e7ff', zIndex: 1 }} />
        {/* Деления */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 32, display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
          {marksArr.map((m, i) => (
            <div key={i} style={{ width: 2, height: i % 5 === 0 ? 32 : 16, background: '#b6c6e6', borderRadius: 1 }} />
          ))}
        </div>
        {/* Бегунок */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${percent}% - 32px)`,
            top: 0,
            width: grabWidth,
            height: grabHeight,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 3,
            pointerEvents: 'auto',
            cursor: 'grab',
            background: 'rgba(0,0,0,0)',
          }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <div style={{ width: 4, height: 48, background: '#2196f3', borderRadius: 2, marginTop: 8, boxShadow: '0 2px 8px #2196f366', zIndex: 2 }} />
        </div>
        {/* Input range */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: 64,
            background: 'transparent',
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 4,
            accentColor: '#2196f3',
            opacity: 0,
            cursor: 'pointer',
            touchAction: 'none',
          }}
        />
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 18, color: '#888' }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
