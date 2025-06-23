import React from 'react';

export default function IconSelector({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 18, justifyContent: 'center', margin: '32px 0', flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            background: value === opt.value ? '#e0e7ff' : '#f8fafc',
            border: value === opt.value ? '2px solid #6366f1' : '2px solid #e0e7ff',
            borderRadius: 16,
            padding: '18px 20px',
            minWidth: 80,
            minHeight: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: 18,
            fontWeight: value === opt.value ? 700 : 500,
            color: value === opt.value ? '#222' : '#888',
            boxShadow: value === opt.value ? '0 2px 8px #e0e7ff' : 'none',
            transition: 'all 0.2s',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {/* Можно добавить сюда <img src={opt.icon} ... /> если потребуется */}
          {opt.icon && <span style={{ fontSize: 32, marginBottom: 8 }}>{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
