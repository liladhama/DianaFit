import React, { useState, useEffect, useRef } from 'react';
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const slide = quizConfig[step];
  const total = quizConfig.length;

  function handleNext() {
    console.log('handleNext', { step, total, nextStep: step + 1 });
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

  // Индексы слайдов для точек: только вопросы (без welcome и finish)
  const questionSlides = quizConfig.filter(s => !['welcome', 'finish'].includes(s.type));
  const questionIndex = questionSlides.findIndex(s => String(s.id) === String(slide.id));
  const showDots = questionIndex !== -1;

  function renderDots() {
    return (
      <div style={{ display: showDots ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '0 0 24px 0' }}>
        {questionSlides.map((_, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === questionIndex ? '#2563eb' : '#d1d5db', transition: 'background 0.2s' }} />
        ))}
      </div>
    );
  }

  // UI-контролы по типу слайда
  function renderControl() {
    console.log('renderControl', { step, slide });
    if (slide.type === 'welcome') {
      return (
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: '100vh',
          background: 'transparent',
        }}>
          <div style={{ position: 'relative', marginTop: 32, marginBottom: 24, width: 320, height: 320, overflow: 'visible' }}>
            <img src={require('../assets/quiz/circle-bg.png')} alt="Круглый фон" style={{ width: 320, height: 320, display: 'block', position: 'relative', zIndex: 1 }} />
            <img src={require('../assets/quiz/diana-sit.png')} alt="Диана" style={{ position: 'absolute', left: -60, top: -10, width: 440, height: 480, objectFit: 'contain', zIndex: 2 }} />
          </div>
          <div style={{ marginTop: 64, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 24, textAlign: 'center', marginBottom: 8, textTransform: 'uppercase' }}>
              ПРИВЕТ! Я ДИАНА <span role="img" aria-label="cupcake">🧁</span>
            </div>
            <div style={{ color: '#222', fontSize: 16, textAlign: 'center', marginBottom: 24, maxWidth: 320, minHeight: 44, lineHeight: 1.2, whiteSpace: 'pre-line' }}>
              {`Давай найдём твою стартовую\nточку А и подберём персональную программу!`}
            </div>
            <button onClick={handleNext} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: 320, display: 'flex', justifyContent: 'center' }}>
              <img src={require('../assets/quiz/next-btn.png')} alt="Следующий" style={{ width: 320, height: 64, display: 'block', objectFit: 'cover', borderRadius: 16 }} />
            </button>
          </div>
        </div>
      );
    }
    if (slide.type === 'choice' || slide.type === 'radio' || slide.type === 'toggle') {
      return (
        <>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '32px 0' }}>
            {slide.options.map(opt => (
              <button className="quiz-btn" style={{fontSize: 20, padding: '14px 28px', borderRadius: 12}} key={opt.value} onClick={() => handleAnswer(slide.key, opt.value)}>{opt.label}</button>
            ))}
          </div>
        </>
      );
    }
    if (slide.type === 'slider' && slide.key === 'age') {
      // wheel-picker для возраста (год рождения)
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 65;
      const maxYear = currentYear - 14;
      const value = answers[slide.key] ?? (currentYear - 25);
      return (
        <>
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
        </>
      );
    }
    if (slide.type === 'slider' && slide.key !== 'age') {
      const value = answers[slide.key] ?? slide.min;
      return (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0', width: '100%' }}>
            <CustomSlider value={value} min={slide.min} max={slide.max} unit={slide.unit} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} />
            <button className="quiz-btn" style={{ marginTop: 28, fontSize: 20, padding: '14px 32px', borderRadius: 12, width: '100%' }} onClick={handleNext}>Дальше</button>
          </div>
        </>
      );
    }
    if (slide.type === 'icons' || (slide.type === 'choice' && slide.options && slide.options.length > 2)) {
      const value = answers[slide.key];
      return (
        <>
          <div style={{ width: '100%' }}>
            <IconSelector options={slide.options} value={value} onChange={v => handleAnswer(slide.key, v)} />
          </div>
        </>
      );
    }
    if (slide.type === 'checkbox') {
      const value = answers[slide.key] ?? [];
      return (
        <>
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
        </>
      );
    }
    if (slide.type === 'input') {
      return (
        <>
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            background: 'transparent',
          }}>
            <div style={{ marginTop: 120, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0.2 }}>
                <span>{slide.title}</span>
                <img src={require('../assets/quiz/heart2.png')} alt="heart" style={{ width: 38, height: 38, marginLeft: 12, marginBottom: 0 }} />
              </div>
              <input
                type="text"
                placeholder={slide.placeholder || ''}
                value={answers[slide.key] || ''}
                onChange={e => setAnswers(a => ({ ...a, [slide.key]: e.target.value }))}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                style={{
                  fontSize: 22,
                  padding: '18px 20px',
                  borderRadius: 24,
                  border: 'none',
                  width: 280,
                  marginBottom: 32,
                  outline: 'none',
                  background: '#f6fafd',
                  boxShadow: '0 0 32px 8px #2196f3cc',
                  textAlign: 'center',
                  color: '#222',
                  fontWeight: 600
                }}
                autoFocus
              />
            </div>
          </div>
          {isInputFocused ? (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button onClick={handleNext} style={{ background: 'none', border: 'none', padding: 0, cursor: answers[slide.key] ? 'pointer' : 'not-allowed', width: 320, display: 'flex', justifyContent: 'center' }} disabled={!answers[slide.key]}>
                <img src={require('../assets/quiz/next-btn.png')} alt="Следующий" style={{ width: 320, height: 64, display: 'block', objectFit: 'cover', borderRadius: 16 }} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'fixed', left: 0, bottom: 140, width: '100vw', display: 'flex', justifyContent: 'center', zIndex: 1000 }}>
              <button onClick={handleNext} style={{ background: 'none', border: 'none', padding: 0, cursor: answers[slide.key] ? 'pointer' : 'not-allowed', width: 320, display: 'flex', justifyContent: 'center' }} disabled={!answers[slide.key]}>
                <img src={require('../assets/quiz/next-btn.png')} alt="Следующий" style={{ width: 320, height: 64, display: 'block', objectFit: 'cover', borderRadius: 16 }} />
              </button>
            </div>
          )}
        </>
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
    <div style={{ width: '100vw', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent', boxSizing: 'border-box', padding: '32px 16px 0 16px' }}>
      <ProgressBar current={step + 1} total={total} />
      {renderDots()}
      {renderControl()}
    </div>
  );
}
