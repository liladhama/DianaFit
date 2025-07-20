import React, { useState, useEffect, useRef } from 'react';





// Новый компонент: разбивает текст на визуальные блоки по 5 строк с учётом реального рендера
const TypewriterPagedText = ({ text, speed = 28, linesPerPage = 4 }) => {
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const measureRef = useRef();

  // Разбиваем текст на страницы по предложениям
  useEffect(() => {
    if (!text) {
      setPages([]);
      return;
    }
    // Разбиваем по предложениям (точка, восклицательный, вопросительный знак, с пробелом или концом строки)
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    const blocks = sentences.map(s => s.trim()).filter(Boolean);
    setPages(blocks);
    setPage(0);
  }, [text]);

  const pageText = pages[page] || '';
  const totalChars = pageText.length;

  useEffect(() => {
    setVisibleChars(0);
    if (!totalChars) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleChars(i);
      if (i >= totalChars) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [page, pageText, totalChars, speed]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Hidden div для измерения количества строк */}
      <div ref={measureRef} style={{
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
        width: '90vw',
        maxWidth: 340,
        minWidth: 220,
        fontSize: 20,
        fontFamily: "'Montserrat Alternates', 'Montserrat', Arial, sans-serif",
        lineHeight: '24px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        padding: 0,
      }} />
      <div style={{ width: '100%' }}>
        <div style={{ minHeight: 120, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '24px' }}>
          {pageText.split('').map((ch, i) => (
            <span key={i} style={{ opacity: i < visibleChars ? 1 : 0, transition: 'opacity 0.1s' }}>{ch}</span>
          ))}
        </div>
        {/* Кнопки всегда ниже текста */}
        <div style={{
          marginTop: 16,
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          {page < pages.length - 1 && visibleChars >= totalChars && (
            <button
              onClick={e => { e.stopPropagation(); setPage(page + 1); }}
              style={{ fontSize: 18, padding: '8px 24px', borderRadius: 8, background: '#b3d8ff', border: 'none', color: '#222', cursor: 'pointer' }}
            >
              Далее
            </button>
          )}
          {page === pages.length - 1 && visibleChars >= totalChars && (
            <button
              onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('goToTodayBlock')); }}
              style={{ fontSize: 18, padding: '8px 24px', borderRadius: 8, background: '#4caf50', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 12 }}
            >
              Благодарю!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypewriterPagedText;
