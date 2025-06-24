import React from 'react';

export default function CustomSlider({ value, min, max, step = 1, unit = '', onChange, height = 260 }) {
  const marks = 21;
  const markStep = Math.max(1, Math.round((max - min) / (marks - 1)));
  const marksArr = Array.from({ length: marks }, (_, i) => min + i * markStep);

  // Размеры для бегунка и палочки
  const knobSize = 20;
  const stickLength = 48;

  // Позиция бегунка (от 0 до height)
  const percent = ((value - min) / (max - min));
  const y = height - percent * height;

  return (
    <div style={{ height, maxHeight: 420, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {/* Значение и единицы */}
      <div style={{ fontSize: 40, fontWeight: 700, marginRight: 24, color: '#222', minWidth: 80, textAlign: 'right' }}>
        {value} <span style={{ fontSize: 22, fontWeight: 400 }}>{unit}</span>
      </div>
      {/* Вертикальный слайдер */}
      <div style={{ height, position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center', touchAction: 'none' }}>
        {/* Деления */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginRight: 0 }}>
          {marksArr.map((m, i) => (
            <div key={i} style={{ width: i % 5 === 0 ? 16 : 8, height: 2, background: '#e0e7ff', borderRadius: 1 }} />
          ))}
        </div>
        {/* Слайдер и кастомный бегунок */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: stickLength + knobSize, pointerEvents: 'none' }}>
          {/* Кастомный бегунок: палочка + круг */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: y - knobSize / 2,
              width: stickLength + knobSize,
              height: knobSize,
              display: 'flex',
              alignItems: 'center',
              zIndex: 3,
              transition: 'top 0.2s',
              pointerEvents: 'none',
            }}
          >
            {/* Палочка влево от линейки */}
            <div style={{ width: stickLength, height: 4, background: '#22c55e', borderRadius: 2, marginRight: 0 }} />
            {/* Круг */}
            <div style={{ width: knobSize, height: knobSize, borderRadius: '50%', background: '#fff', border: '3px solid #22c55e', boxShadow: '0 2px 8px #22c55e33', marginLeft: -knobSize/2 }} />
          </div>
        </div>
        {/* Скрытый input с увеличенной областью захвата */}
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
            width: stickLength + knobSize + 30, // увеличить область захвата
            height,
            accentColor: '#22c55e',
            position: 'absolute',
            left: -15, // чтобы захват был и левее
            top: 0,
            opacity: 0, // скрываем стандартный бегунок
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
