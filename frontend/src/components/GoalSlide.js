import React from "react";

export default function GoalSlide({ onSelect, selected, options, onNext }) {
  // При выборе варианта сразу вызываем onNext
  function handleSelect(value) {
    onSelect(value);
    setTimeout(onNext, 200);
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
      boxSizing: 'border-box',
      padding: '0 0 32px 0',
    }}>
      <div style={{ fontWeight: 700, fontSize: 28, margin: '48px 0 16px 0', textAlign: 'left', letterSpacing: 0, color: '#181818', width: 320, maxWidth: '96vw' }}>
        ТВОЯ ЦЕЛЬ
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        background: '#fff',
        border: '2px solid #222',
        borderRadius: 18,
        boxShadow: 'none',
        padding: '16px 18px',
        marginBottom: 48,
        width: '100%',
        maxWidth: 340,
        minHeight: 80,
        position: 'relative',
        gap: 18
      }}>
        <img src={require('../assets/welcome/cupcake3.png')} alt="cake" style={{ width: 80, height: 80, borderRadius: 16, filter: 'drop-shadow(0 0 0px #a86a3d) drop-shadow(0 0 8px #a86a3d) drop-shadow(0 0 18px #a86a3d) drop-shadow(0 0 32px #ffe0b3) drop-shadow(0 0 56px #fff0e0)', objectFit: 'cover' }} />
        <div style={{ fontSize: 14, color: '#222', lineHeight: 1.15, fontWeight: 500, marginLeft: 8, marginRight: 0, padding: 0, marginTop: 0, marginBottom: 0 }}>
          Плавное снижение веса — это безопасный путь и лучшая форма: улучшается самочувствие, снижается давление и риск диабета, уходит жир.
        </div>
      </div>
      <div style={{ width: 320, maxWidth: '96vw', display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 32 }}>
        {options.map((opt, i) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={i}
              onClick={() => handleSelect(opt.value)}
              style={{
                width: 220,
                padding: '18px 0',
                borderRadius: 32,
                fontSize: 22,
                fontWeight: 700,
                background: '#fff',
                color: isSelected ? '#2196f3' : '#bdbdbd',
                border: isSelected ? '2.5px solid #2196f3' : '2.5px solid #eaf4ff',
                boxShadow: '0 0 24px 8px #2196f3cc',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s',
                alignSelf: 'center',
                display: 'block',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
