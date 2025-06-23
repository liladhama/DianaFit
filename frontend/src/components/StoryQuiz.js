import React, { useState } from 'react';
import quizConfig from '../quizConfig.json';

function ProgressBar({ current, total }) {
  return (
    <div style={{ height: 6, background: '#e0e7ff', borderRadius: 3, margin: '16px 0' }}>
      <div style={{ width: `${(current / total) * 100}%`, height: '100%', background: '#6366f1', borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );
}

export default function StoryQuiz({ onFinish }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const slide = quizConfig[step];
  const total = quizConfig.length;

  function handleNext() {
    if (step < total - 1) setStep(step + 1);
    else if (onFinish) onFinish(answers);
  }

  function handleAnswer(key, value) {
    setAnswers(a => ({ ...a, [key]: value }));
    setTimeout(handleNext, 200);
  }

  // UI-контролы по типу слайда
  function renderControl() {
    if (slide.type === 'welcome') {
      return <button className="quiz-btn" onClick={handleNext}>Начать</button>;
    }
    if (slide.type === 'choice' || slide.type === 'radio' || slide.type === 'toggle') {
      return (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '24px 0' }}>
          {slide.options.map(opt => (
            <button className="quiz-btn" key={opt.value} onClick={() => handleAnswer(slide.key, opt.value)}>{opt.label}</button>
          ))}
        </div>
      );
    }
    if (slide.type === 'slider') {
      const value = answers[slide.key] ?? slide.min;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
          <input type="range" min={slide.min} max={slide.max} value={value} onChange={e => handleAnswer(slide.key, Number(e.target.value))} style={{ width: 220 }} />
          <div style={{ marginTop: 8 }}>{value} {slide.unit}</div>
        </div>
      );
    }
    if (slide.type === 'icons') {
      return (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0' }}>
          {slide.options.map(opt => (
            <button className="quiz-btn" key={opt.value} onClick={() => handleAnswer(slide.key, opt.value)}>{opt.label}</button>
          ))}
        </div>
      );
    }
    if (slide.type === 'checkbox') {
      const value = answers[slide.key] ?? [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
          {slide.options.map(opt => (
            <label key={opt.value} style={{ margin: 4 }}>
              <input type="checkbox" checked={value.includes(opt.value)} onChange={e => {
                const newArr = e.target.checked ? [...value, opt.value] : value.filter(v => v !== opt.value);
                setAnswers(a => ({ ...a, [slide.key]: newArr }));
              }} /> {opt.label}
            </label>
          ))}
          <button className="quiz-btn" style={{ marginTop: 12 }} onClick={handleNext}>Дальше</button>
        </div>
      );
    }
    if (slide.type === 'finish') {
      return <div style={{ margin: '32px 0', textAlign: 'center' }}>Считаю твою программу…<br /><span className="loader" /></div>;
    }
    return null;
  }

  return (
    <div style={{ maxWidth: 340, margin: '0 auto', background: 'rgba(255,255,255,0.95)', borderRadius: 16, boxShadow: '0 2px 16px #e0e7ff', padding: 24, minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ProgressBar current={step + 1} total={total} />
      <div style={{ fontWeight: 600, fontSize: 22, margin: '16px 0 8px' }}>{slide.title}</div>
      {slide.text && <div style={{ color: '#555', marginBottom: 12 }}>{slide.text}</div>}
      {renderControl()}
    </div>
  );
}
