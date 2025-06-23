import React, { useRef, useEffect } from 'react';

export default function WheelPicker({ value, onChange, min = 1950, max = 2025 }) {
  const listRef = useRef();
  const years = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useEffect(() => {
    const idx = years.indexOf(value);
    if (listRef.current && idx >= 0) {
      listRef.current.scrollTo({ top: idx * 44, behavior: 'smooth' });
    }
  }, [value]);

  function handleScroll(e) {
    const idx = Math.round(e.target.scrollTop / 44);
    const newValue = years[idx];
    if (newValue !== value) onChange(newValue);
  }

  return (
    <div style={{ height: 220, overflow: 'hidden', width: 120, margin: '0 auto', position: 'relative' }}>
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          height: 220,
          overflowY: 'scroll',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {years.map((y, i) => (
          <div
            key={y}
            style={{
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: y === value ? 28 : 20,
              color: y === value ? '#222' : '#bbb',
              fontWeight: y === value ? 700 : 400,
              transition: 'all 0.2s',
              opacity: Math.abs(years.indexOf(value) - i) > 2 ? 0.3 : 1
            }}
          >
            {y}
          </div>
        ))}
      </div>
      <div style={{
        position: 'absolute',
        top: 88,
        left: 0,
        right: 0,
        height: 44,
        borderTop: '2px solid #e0e7ff',
        borderBottom: '2px solid #e0e7ff',
        pointerEvents: 'none'
      }} />
    </div>
  );
}
