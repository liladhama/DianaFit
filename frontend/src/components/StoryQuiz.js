import React, { useState, useEffect } from 'react';
import quizConfig from '../quizConfig.json';
import WheelPicker from './WheelPicker';
import CustomSlider from './CustomSlider';
import IconSelector from './IconSelector';

function ProgressBar({ current, total }) {
  return (
    <div style={{ height: 6, background: '#e0e7ff', borderRadius: 3, margin: '16px 0' }}>
      <div style={{ width: `${(current / total) * 100}%`, height: '100%', background: '#6366f1', borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );
}

export default function StoryQuiz({ onFinish }) {
  useEffect(() => {
    console.log('StoryQuiz mounted');
  }, []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const slide = quizConfig[step];
  const total = quizConfig.length;

  function handleNext() {
    console.log('handleNext', { step, total });
    if (step < total - 1) setStep(step + 1);
    else if (onFinish) {
      console.log('StoryQuiz onFinish', answers);
      onFinish(answers);
    }
  }

  function handleAnswer(key, value) {
    console.log('handleAnswer', { key, value });
    setAnswers(a => ({ ...a, [key]: value }));
    setTimeout(handleNext, 200);
  }

  // UI-контролы по типу слайда
  function renderControl() {
    console.log('renderControl', slide.type);
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
    if (slide.type === 'slider' && slide.key === 'age') {
      // wheel-picker для возраста (год рождения)
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 65;
      const maxYear = currentYear - 14;
      const value = answers[slide.key] ?? (currentYear - 25);
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          width: '100%',
        }}>
          <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 32, textAlign: 'center' }}>{slide.title}</div>
          <WheelPicker value={value} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} min={minYear} max={maxYear} />
          <button className="quiz-btn" style={{ marginTop: 32, fontSize: 20, padding: '14px 32px', borderRadius: 12 }} onClick={handleNext}>Дальше</button>
        </div>
      );
    }
    if (slide.type === 'slider' && slide.key !== 'age') {
      const value = answers[slide.key] ?? slide.min;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0', width: '100%' }}>
          <CustomSlider value={value} min={slide.min} max={slide.max} unit={slide.unit} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} />
          <button className="quiz-btn" style={{ marginTop: 28, fontSize: 20, padding: '14px 32px', borderRadius: 12, width: '100%' }} onClick={handleNext}>Дальше</button>
        </div>
      );
    }
    if (slide.type === 'icons' || (slide.type === 'choice' && slide.options && slide.options.length > 2)) {
      const value = answers[slide.key];
      return (
        <div style={{ width: '100%' }}>
          <IconSelector options={slide.options} value={value} onChange={v => handleAnswer(slide.key, v)} />
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
    if (slide.type === 'input') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0', width: '100%' }}>
          <input
            type="text"
            placeholder={slide.placeholder || ''}
            value={answers[slide.key] || ''}
            onChange={e => setAnswers(a => ({ ...a, [slide.key]: e.target.value }))}
            style={{ fontSize: 22, padding: '16px 20px', borderRadius: 12, border: '1px solid #e0e7ff', width: '80%', marginBottom: 24, outline: 'none' }}
            autoFocus
          />
          <button className="quiz-btn" style={{ fontSize: 20, padding: '14px 32px', borderRadius: 12 }} onClick={handleNext} disabled={!answers[slide.key]}>Дальше</button>
        </div>
      );
    }
    if (slide.type === 'finish') {
      setTimeout(handleNext, 500); // авто-завершение через 0.5 сек
      return <div style={{textAlign: 'center', fontSize: 22, margin: 32}}>{slide.title}</div>;
    }
    if (slide.type === 'date-wheel') {
      // Колесо с вариантами: завтра, послезавтра, ближайшие 5 дней
      const today = new Date();
      const options = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        return {
          label: i === 0 ? 'Завтра' : i === 1 ? 'Послезавтра' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
          value: d.toISOString().slice(0, 10)
        };
      });
      const value = answers[slide.key] ?? options[0].value;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60vh', justifyContent: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 32, textAlign: 'center' }}>{slide.title}</div>
          <WheelPicker
            value={value}
            onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))}
            min={0}
            max={options.length - 1}
            // Переопределяем years на массив дат
            years={options.map(o => o.value)}
            labels={options.map(o => o.label)}
          />
          <button className="quiz-btn" style={{ marginTop: 32, fontSize: 20, padding: '14px 32px', borderRadius: 12 }} onClick={handleNext}>Дальше</button>
        </div>
      );
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
      padding: '32px 16px 0 16px', // добавлен горизонтальный padding
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
