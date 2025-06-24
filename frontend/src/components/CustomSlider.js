import React from 'react';

export default function CustomSlider({ value, min, max, step = 1, unit = '', onChange, height = 260 }) {
  const marks = 21;
  const markStep = Math.max(1, Math.round((max - min) / (marks - 1)));
  const marksArr = Array.from({ length: marks }, (_, i) => min + i * markStep);

  // Вычисляем позицию палочки (индикатора) в процентах
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ height, maxHeight: 420, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {/* Значение и единицы */}
      <div style={{ fontSize: 40, fontWeight: 700, marginRight: 24, color: '#222', minWidth: 80, textAlign: 'right' }}>
        {value} <span style={{ fontSize: 22, fontWeight: 400 }}>{unit}</span>
      </div>
      {/* Вертикальный слайдер */}
      <div style={{ height, position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {/* Деления */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginRight: 12 }}>
          {marksArr.map((m, i) => (
            <div key={i} style={{ width: i % 5 === 0 ? 16 : 8, height: 2, background: '#e0e7ff', borderRadius: 1 }} />
          ))}
        </div>
        {/* Слайдер */}
        <div style={{ position: 'relative', height: '100%', width: 36, display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            style={{
              writingMode: 'bt-lr', // вертикальный режим
              WebkitAppearance: 'slider-vertical',
              width: 36,
              height,
              accentColor: '#22c55e',
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          />
          {/* Только палочка-индикатор */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: 36,
              height: 4,
              background: '#22c55e',
              borderRadius: 2,
              top: `calc(${100 - percent}% - 2px)`, // движется вверх-вниз
              transition: 'top 0.2s',
              zIndex: 2,
            }}
          />
        </div>
      </div>
      {/* Подписи min/max */}
      <div style={{ height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginLeft: 12, fontSize: 16, color: '#888', alignItems: 'flex-start' }}>
        <span>{max}</span>
        <span>{min}</span>
      </div>
    </div>
  );
}
