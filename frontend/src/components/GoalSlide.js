import React from "react";

export default function GoalSlide({ onSelect, selected, options, onNext, onBack, showBackButton }) {
  // При выборе варианта сразу вызываем onNext
  function handleSelect(value) {
    onSelect(value);
    setTimeout(onNext, 200);
  }

  function renderBackButton() {
    if (!showBackButton || !onBack) return null;
    
    return (
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: -22,
          left: 16,
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: '8px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 600,
          color: '#333',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          minWidth: 36,
          minHeight: 36,
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#f5f5f5';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.9)';
          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }}
      >
        ←
      </button>
    );
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
      padding: '16px 0 32px 0', // уменьшил верхний паддинг, чтобы элементы были выше
      overflow: 'visible', // На всякий случай
      position: 'relative',
    }}>
      {renderBackButton()}
      <div style={{ fontWeight: 700, fontSize: 28, margin: '48px 0 16px 0', textAlign: 'left', letterSpacing: 0, color: '#181818', width: 320, maxWidth: '96vw' }}>
        ТВОЯ ЦЕЛЬ
      </div>
      <div style={{
        maxWidth: 340,
        width: '100%',
        margin: '24px auto 48px auto',
        minHeight: 100,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'visible',
        zIndex: 2
      }}>
        <img
          src={require('../assets/welcome/cupcake3.png')}
          alt="cake"
          style={{
            width: 65,
            height: 65,
            objectFit: 'cover',
            borderRadius: 16,
            overflow: 'visible',
            zIndex: 3,
            margin: 0,
            pointerEvents: 'none',
            position: 'absolute',
            left: 18,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
          }}
        />
        <div style={{
          border: '2px solid #222',
          borderRadius: 18,
          background: '#fff',
          boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
          padding: '12px 18px 12px 95px', // padding-left для текста справа от кекса
          marginBottom: 0,
          display: 'block',
          minHeight: 65,
          position: 'relative',
          overflow: 'visible',
          zIndex: 2,
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: 14, color: '#222', lineHeight: 1.15, fontWeight: 500, margin: 0, padding: 0, textAlign: 'left' }}>
            Плавное снижение веса — это безопасный путь и лучшая форма: улучшается самочувствие, снижается давление и риск диабета, уходит жир.
          </div>
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
