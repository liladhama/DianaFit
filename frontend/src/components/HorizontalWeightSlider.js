import React, { useRef } from 'react';

export default function HorizontalWeightSlider({ value, min, max, step = 1, unit = '', onChange }) {
  // Позиция бегунка
  const percent = ((Number(value) - Number(min)) / (Number(max) - Number(min))) * 100;
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
          {Array.from({ length: 21 }, (_, i) => (
            <div key={i} style={{ width: 2, height: i % 5 === 0 ? 32 : 16, background: '#b6c6e6', borderRadius: 1 }} />
          ))}
        </div>
        {/* Кастомный бегунок — только один! */}
        <div style={{
          position: 'absolute',
          left: `calc(${percent}% - 20px)`,
          top: 12,
          width: 40,
          height: 40,
          zIndex: 3,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2196f3 60%, #90caf9 100%)',
            boxShadow: '0 4px 16px #2196f399',
            border: '3px solid #fff',
            transition: 'box-shadow 0.2s',
          }} />
        </div>
        {/* Input range — скрытый, только для drag! */}
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
            cursor: 'pointer',
            touchAction: 'none',
            pointerEvents: 'auto',
            opacity: 0, // скрываем стандартный бегунок
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
