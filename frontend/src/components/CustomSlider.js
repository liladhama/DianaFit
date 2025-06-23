import React from 'react';

export default function CustomSlider({ value, min, max, step = 1, unit = '', onChange }) {
  const range = [];
  for (let i = min; i <= max; i += step) {
    range.push(i);
  }
  // Для шкалы делаем не больше 21 деления
  const marks = 21;
  const markStep = Math.max(1, Math.round((max - min) / (marks - 1)));
  const marksArr = Array.from({ length: marks }, (_, i) => min + i * markStep);

  return (
    <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: '#222' }}>{value} <span style={{ fontSize: 22, fontWeight: 400 }}>{unit}</span></div>
      <div style={{ width: '100%', position: 'relative', margin: '24px 0 8px 0' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#22c55e', height: 8 }}
        />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 18, display: 'flex', justifyContent: 'space-between' }}>
          {marksArr.map((m, i) => (
            <div key={i} style={{ width: 2, height: i % 5 === 0 ? 16 : 8, background: '#e0e7ff', borderRadius: 1 }} />
          ))}
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 16, color: '#888' }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
