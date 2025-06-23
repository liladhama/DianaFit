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
      return <button className="quiz-btn" style={{fontSize: 20, padding: '16px 32px', borderRadius: 12}} onClick={handleNext}>Начать</button>;
    }
    if (slide.type === 'choice' || slide.type === 'radio' || slide.type === 'toggle') {
      return (
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '32px 0' }}>
          {slide.options.map(opt => (
            <button className="quiz-btn" style={{fontSize: 20, padding: '14px 28px', borderRadius: 12}} key={opt.value} onClick={() => handleAnswer(slide.key, opt.value)}>{opt.label}</button>
          ))}
        </div>
      );
    }
    if (slide.type === 'slider') {
      const value = answers[slide.key] ?? slide.min;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0' }}>
          <input type="range" min={slide.min} max={slide.max} value={value} onChange={e => setAnswers(a => ({ ...a, [slide.key]: Number(e.target.value) }))} style={{ width: 260, height: 32, accentColor: '#6366f1' }} />
          <div style={{ marginTop: 12, fontSize: 22, fontWeight: 600 }}>{value} {slide.unit}</div>
          <button className="quiz-btn" style={{marginTop: 20, fontSize: 20, padding: '14px 32px', borderRadius: 12}} onClick={handleNext}>Дальше</button>
        </div>
      );
    }
    if (slide.type === 'icons') {
      return (
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '32px 0' }}>
          {slide.options.map(opt => (
            <button className="quiz-btn" style={{fontSize: 20, padding: '14px 28px', borderRadius: 12}} key={opt.value} onClick={() => handleAnswer(slide.key, opt.value)}>{opt.label}</button>
          ))}
        </div>
      );
    }
    if (slide.type === 'checkbox') {
      const value = answers[slide.key] ?? [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0' }}>
          {slide.options.map(opt => (
            <label key={opt.value} style={{ margin: 8, fontSize: 20 }}>
              <input type="checkbox" style={{width: 22, height: 22, marginRight: 8}} checked={value.includes(opt.value)} onChange={e => {
                const newArr = e.target.checked ? [...value, opt.value] : value.filter(v => v !== opt.value);
                setAnswers(a => ({ ...a, [slide.key]: newArr }));
              }} /> {opt.label}
            </label>
          ))}
          <button className="quiz-btn" style={{ marginTop: 18, fontSize: 20, padding: '14px 32px', borderRadius: 12 }} onClick={handleNext}>Дальше</button>
        </div>
      );
    }
    if (slide.type === 'finish') {
      return <div style={{ margin: '40px 0', textAlign: 'center', fontSize: 22 }}>Считаю твою программу…<br /><span className="loader" /></div>;
    }
    return null;
  }

  return (
    <div style={{
      width: '100%',
      minHeight: 320,
      background: 'transparent',
      borderRadius: 0,
      boxShadow: 'none',
      padding: '32px 0 0 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      boxSizing: 'border-box',
    }}>
      <ProgressBar current={step + 1} total={total} />
      <div style={{ fontWeight: 700, fontSize: 24, margin: '24px 0 12px', textAlign: 'center' }}>{slide.title}</div>
      {slide.text && <div style={{ color: '#555', marginBottom: 16, textAlign: 'center' }}>{slide.text}</div>}
      {renderControl()}
    </div>
  );
}
