import React, { useRef, useEffect } from 'react';

export default function WheelPicker({ value, onChange, min = 1950, max = 2025, years: customYears, labels }) {
  const ITEM_HEIGHT = 44; // Вернули стандартную высоту
  const VISIBLE_ITEMS = 5; // нечетное число для симметрии
  const listRef = useRef();
  // Если передан массив years (например, даты), используем его, иначе стандартный диапазон
  const years = customYears || Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useEffect(() => {
    const idx = years.indexOf(value);
    if (listRef.current && idx >= 0) {
      const offset = idx * ITEM_HEIGHT;
      listRef.current.scrollTop = offset;
    }
  }, [value, years]);

  function handleScroll(e) {
    const idx = Math.round(e.target.scrollTop / ITEM_HEIGHT);
    const newValue = years[idx];
    if (newValue !== value && newValue !== undefined) onChange(newValue);
    // Вибрация при каждом скролле (Android/Chrome)
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  }

  // Добавляем пустые элементы сверху и снизу для центрирования
  const paddingItems = Array(Math.floor(VISIBLE_ITEMS / 2)).fill(null);

  return (
    <div style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, overflow: 'hidden', width: 180, margin: '0 auto', position: 'relative', background: 'transparent' }}>
      <div
        ref={listRef}
        onScroll={handleScroll}
        onTouchEnd={() => {
          // Snap к ближайшему году после окончания скролла
          if (listRef.current) {
            const idx = Math.round(listRef.current.scrollTop / ITEM_HEIGHT);
            listRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'auto' });
          }
        }}
        style={{
          height: ITEM_HEIGHT * VISIBLE_ITEMS,
          overflowY: 'scroll',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
        }}
        className="wheelpicker-scroll"
      >
        {paddingItems.map((_, i) => <div key={'pad-top-' + i} style={{ height: ITEM_HEIGHT }} />)}
        {years.map((y, i) => (
          <div
            key={y}
            style={{
              height: ITEM_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: y === value ? 32 : 22,
              color: y === value ? '#2196f3' : '#888',
              fontWeight: y === value ? 700 : 500,
              background: y === value ? 'rgba(33,150,243,0.08)' : 'transparent',
              borderRadius: y === value ? 18 : 0,
              transition: 'all 0.2s',
              opacity: Math.abs(years.indexOf(value) - i) > 2 ? 0.3 : 1,
              scrollSnapAlign: 'center',
            }}
          >
            {labels ? labels[i] : y}
          </div>
        ))}
        {paddingItems.map((_, i) => <div key={'pad-bot-' + i} style={{ height: ITEM_HEIGHT }} />)}
      </div>
      {/* Overlay с двумя линиями и фоном для центральной области */}
      <div style={{
        position: 'absolute',
        top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        borderTop: '2px solid #e0e7ff',
        borderBottom: '2px solid #e0e7ff',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        background: 'rgba(33,150,243,0.08)',
        borderRadius: 18,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }} />
      <style>{`
        .wheelpicker-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
