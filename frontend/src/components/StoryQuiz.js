import React, { useState, useEffect, useRef } from 'react';
// import quizConfig from '../quizConfig.json';
import WheelPicker from './WheelPicker';
import CustomSlider from './CustomSlider';
import IconSelector from './IconSelector';
import HorizontalWeightSlider from './HorizontalWeightSlider';
import GoalSlide from './GoalSlide'; // Импортируем новый компонент
import "../fonts/fonts.css";
import "./StoryQuiz.css";

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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedGender, setSelectedGender] = useState(null);
  const [quizConfig, setQuizConfig] = useState(null);
  const inputRef = useRef(null);
  const slide = quizConfig ? quizConfig[step] : null;
  const total = quizConfig ? quizConfig.length : 0;

  useEffect(() => {
    fetch('/quizConfig.json')
      .then(res => res.json())
      .then(setQuizConfig);
  }, []);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [step]);

  function handleNext() {
    if (!quizConfig) return;
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

  function handleGenderSelect(gender) {
    setSelectedGender(gender);
    handleAnswer('sex', gender);
  }

  // Индексы слайдов для точек: только вопросы (без welcome и finish)
  const questionSlides = quizConfig ? quizConfig.filter(s => !['welcome', 'finish', 'daily_steps'].includes(s.type) && s.key !== 'daily_steps') : [];
  const questionIndex = slide ? questionSlides.findIndex(s => String(s.id) === String(slide.id)) : -1;
  const showDots = questionIndex !== -1;

  function renderDots() {
    return (
      <div style={{ display: showDots ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '0 0 24px 0', position: 'absolute', top: 12, left: 0, right: 0, width: '100vw', zIndex: 10 }}>
        {questionSlides.map((_, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === questionIndex ? '#2563eb' : '#d1d5db', transition: 'background 0.2s' }} />
        ))}
      </div>
    );
  }

  // UI-контролы по типу слайда
  function renderControl({ inputRef }) {
    console.log('DEBUG slide', slide); // <--- debug вывод для диагностики шага
    console.log('DEBUG step', step);
    // Кастомный слайд "Где будешь тренироваться?" — СТАВИМ ПЕРВЫМ!
    if (slide && slide.key === 'gym_or_home') {
      const options = [
        { label: 'Зал', value: 'gym' },
        { label: 'Дом', value: 'home' }
      ];
      return (
        <div style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
        }}>
          <div style={{ marginTop: 48, width: 340, maxWidth: '96vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 28, textAlign: 'left', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0, color: '#181818', alignSelf: 'flex-start', lineHeight: 1.05 }}>
              ГДЕ БУДЕШЬ<br />ТРЕНИРОВАТЬСЯ
            </div>
            <div style={{
              border: '2px solid #b3c6e0',
              borderRadius: 24,
              background: '#fff',
              boxShadow: '0 4px 32px 0 #b6d6ff44',
              padding: '16px 20px',
              marginBottom: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              width: '100%',
              maxWidth: 300,
              minHeight: 80,
              height: 80
            }}>
              <img src={require('../assets/quiz/dumbbell.png')} alt="dumbbell" style={{ width: 88, height: 88, borderRadius: 16, objectFit: 'cover', marginRight: 4 }} />
              <div style={{ fontSize: 13, color: '#7a7a7a', lineHeight: 1.3, fontWeight: 500 }}>
                Я подберу эффективный комплекс под твои условия, чтобы тренировки приносили результат и удовольствие.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', width: '100%', marginTop: 32 }}>
              {options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    className={isSelected ? 'selected-gender' : 'gender-btn'}
                    style={{
                      fontSize: 20,
                      padding: '18px 32px',
                      borderRadius: 24,
                      minWidth: 120,
                      fontWeight: 700,
                      transition: 'all 0.18s',
                      cursor: 'pointer',
                      outline: 'none',
                      margin: '0 8px',
                      background: 'transparent',
                    }}
                    onClick={() => handleAnswer(slide.key, opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    // Кастомный слайд "Твой опыт тренировок" по референсу — СТАВИМ ПЕРВЫМ!
    if (slide && slide.key === 'training_level') {
      const options = [
        { label: 'новичок', value: 'beginner' },
        { label: '1-2 года', value: 'intermediate' },
        { label: '3+ лет', value: 'advanced' },
      ];
      return (
        <div style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
        }}>
          <div style={{ marginTop: 48, width: 340, maxWidth: '96vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 28, textAlign: 'left', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0, color: '#181818', alignSelf: 'flex-start', lineHeight: 1.05 }}>
              ТВОЙ ОПЫТ<br />ТРЕНИРОВОК
            </div>
            <div style={{
              border: '1.5px solid #222',
              borderRadius: 24,
              background: '#fff',
              boxShadow: 'none',
              padding: '6px 10px',
              marginBottom: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              maxWidth: 340,
              minHeight: 0,
              position: 'relative'
            }}>
              <img src={require('../assets/welcome/yoga-mat.png')} alt="yoga-mat" style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 16, marginRight: 2, marginLeft: -8 }} />
              <div style={{ fontSize: 14, color: '#222', lineHeight: 1.18, fontWeight: 500, marginLeft: 0, marginRight: 0, padding: '4px 0', marginTop: 0, marginBottom: 0 }}>
                Опыт в тренировках помогает избегать перегрузок и травм. Постепенное увеличение нагрузки делает занятия безопасными и приятными, а тело быстрее привыкает к новому ритму.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', marginTop: 0 }}>
              {options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    className={isSelected ? 'selected-gender' : 'gender-btn'}
                    style={{
                      fontSize: 20,
                      padding: '18px 0',
                      borderRadius: 32,
                      width: 200,
                      fontWeight: 700,
                      background: 'transparent',
                      margin: '0 auto',
                      letterSpacing: 0.2,
                      textTransform: 'none',
                    }}
                    onClick={() => handleAnswer(slide.key, opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    // Кастомный слайд "Твоя бытовая активность" по референсу — СТАВИМ ВТОРЫМ!
    if (slide && slide.key === 'activity_coef') {
      const options = [
        { label: 'Нет\nактивности', value: 1.2 },
        { label: 'Лёгкая', value: 1.375 },
        { label: 'Средняя', value: 1.55 },
        { label: 'Интенсив', value: 1.725 },
      ];
      return (
        <div style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
        }}>
          <div style={{ marginTop: 48, width: 340, maxWidth: '96vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 28, textAlign: 'left', marginBottom: 48, textTransform: 'uppercase', letterSpacing: 0, color: '#181818', alignSelf: 'flex-start', lineHeight: 1.05 }}>
              ТВОЯ БЫТОВАЯ<br />АКТИВНОСТЬ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%', marginTop: 0 }}>
              {options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    className={isSelected ? 'selected-gender' : 'gender-btn'}
                    style={{
                      fontSize: 20,
                      padding: '18px 0',
                      borderRadius: 32,
                      width: 200,
                      fontWeight: 700,
                      background: 'transparent',
                      margin: '0 auto',
                      letterSpacing: 0.2,
                      textTransform: 'none',
                      whiteSpace: 'pre-line',
                    }}
                    onClick={() => handleAnswer(slide.key, opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
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
    if ((slide.type === 'choice' || slide.type === 'radio' || slide.type === 'toggle') && slide.key === 'sex') {
      return (
        <div style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: 'transparent',
        }}>
          <div style={{ marginTop: 64, width: 340, maxWidth: '96vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 28, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0, color: '#181818' }}>
              ТВОЙ ПОЛ
            </div>
            <div style={{
              border: '2px solid #222',
              borderRadius: 18,
              background: '#fff',
              boxShadow: 'none',
              padding: '16px 18px',
              marginBottom: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              width: '100%',
              maxWidth: 340,
              minHeight: 80,
              position: 'relative',
              overflow: 'visible', // Исправлено: чтобы свечение не обрезалось
              zIndex: 2 // Исправлено: чтобы свечение было поверх
            }}>
              <img src={require('../assets/welcome/cupcake.png')} alt="cupcake" style={{ width: 80, height: 80, objectFit: 'cover', filter: 'drop-shadow(0 0 0px #ff6a6a) drop-shadow(0 0 8px #ff6a6a) drop-shadow(0 0 18px #ff6a6a) drop-shadow(0 0 32px #ffb3b3) drop-shadow(0 0 56px #ffe0e0)', borderRadius: 16, overflow: 'visible', zIndex: 3 }} />
              <div style={{ fontSize: 14, color: '#222', lineHeight: 1.15, fontWeight: 500, marginLeft: 8, marginRight: 0, padding: 0, marginTop: 0, marginBottom: 0 }}>
                это поможет мне подобрать нагрузку и упражнения, которые наилучшим образом учитывают физиологические особенности твоего организма.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', width: '100%', marginTop: 32 }}>
              {slide.options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    className={isSelected ? 'selected-gender' : 'gender-btn'}
                    style={{
                      fontSize: 20,
                      padding: '18px 32px',
                      borderRadius: 24,
                      minWidth: 120,
                      fontWeight: 700,
                      transition: 'all 0.18s',
                      cursor: 'pointer',
                      outline: 'none',
                      // Только для НЕвыбранной кнопки задаём цвет, бордер и фон
                      ...(isSelected ? {} : {
                        background: '#fff',
                        border: '2.5px solid #eaf4ff',
                        color: '#222',
                      })
                    }}
                    onClick={() => handleAnswer(slide.key, opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
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
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
          boxSizing: 'border-box',
          padding: '32px 16px 16px 16px',
          position: 'relative'
        }}>
          <div style={{ fontWeight: 700, fontSize: 28, margin: '24px 0 12px 0', textAlign: 'center', letterSpacing: 0, color: '#181818' }}>{slide.title}</div>
          <div style={{
            border: '2px solid #222',
            borderRadius: 18,
            background: '#fff',
            boxShadow: 'none',
            padding: '16px 18px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            width: '100%',
            maxWidth: 340,
            minHeight: 80,
            position: 'relative',
            marginTop: 0,
            overflow: 'visible', // Исправлено: чтобы свечение не обрезалось
            zIndex: 2 // Исправлено: чтобы свечение было поверх
          }}>
            <img src={require('../assets/welcome/cupcake2.png')} alt="cupcake" style={{ width: 80, height: 80, borderRadius: 16, filter: 'drop-shadow(0 0 0px #ffb86a) drop-shadow(0 0 8px #ffb86a) drop-shadow(0 0 18px #ffb86a) drop-shadow(0 0 32px #ffe0b3) drop-shadow(0 0 56px #fff0e0)', objectFit: 'cover', overflow: 'visible', zIndex: 3 }} />
            <div style={{ fontSize: 14, color: '#222', lineHeight: 1.15, fontWeight: 500, marginLeft: 8, marginRight: 0, padding: 0, marginTop: 0, marginBottom: 0 }}>
              Это поможет мне подготовить тренировку, наиболее соответствующую твоей возрастной группе.
            </div>
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 32, background: 'none', boxShadow: 'none', border: 'none' }}>
            <WheelPicker value={value} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} min={minYear} max={maxYear} />
          </div>
          <button className="quiz-btn age-btn" style={{ marginTop: 16, fontSize: 20, padding: '16px 0', borderRadius: 12, width: 320, maxWidth: '90vw', background: '#2196f3', color: '#fff', fontWeight: 700, boxShadow: '0 4px 16px 0 #2196f366', border: 'none' }} onClick={handleNext}>Следующий</button>
        </div>
      );
    }
    // Горизонтальный слайдер для веса
    if (slide.type === 'slider' && slide.key === 'weight_kg') {
      const value = answers[slide.key] ?? slide.min;
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
          boxSizing: 'border-box',
          padding: '32px 16px 16px 16px'
        }}>
          <div style={{ fontWeight: 700, fontSize: 28, margin: '48px 0 24px 0', textAlign: 'center', letterSpacing: 0, color: '#181818' }}>{slide.title}</div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8, minHeight: 120 }}>
            <HorizontalWeightSlider value={value} min={slide.min} max={slide.max} unit={slide.unit} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} />
          </div>
          <button className="quiz-btn age-btn" style={{ marginTop: 0, fontSize: 20, padding: '16px 0', borderRadius: 12, width: 320, maxWidth: '90vw', background: '#2196f3', color: '#fff', fontWeight: 700, boxShadow: '0 4px 16px 0 #2196f366', border: 'none' }} onClick={handleNext}>Следующий</button>
        </div>
      );
    }
    // Универсальный слайдер для всех остальных слайдов типа slider
    if (slide.type === 'slider') {
      const value = answers[slide.key] ?? slide.min;
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
          boxSizing: 'border-box',
          padding: '32px 16px 16px 16px'
        }}>
          <div style={{ fontWeight: 700, fontSize: 28, margin: '48px 0 24px 0', textAlign: 'center', letterSpacing: 0, color: '#181818' }}>{slide.title}</div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8, minHeight: 420 }}>
            <CustomSlider value={value} min={slide.min} max={slide.max} unit={slide.unit} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} height={380} />
          </div>
          <button className="quiz-btn age-btn" style={{ marginTop: 0, fontSize: 20, padding: '16px 0', borderRadius: 12, width: 320, maxWidth: '90vw', background: '#2196f3', color: '#fff', fontWeight: 700, boxShadow: '0 4px 16px 0 #2196f366', border: 'none' }} onClick={handleNext}>Следующий</button>
        </div>
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
              ref={inputRef}
              type="text"
              placeholder={slide.placeholder || ''}
              value={answers[slide.key] || ''}
              onChange={e => setAnswers(a => ({ ...a, [slide.key]: e.target.value }))}
              style={{
                fontSize: 22,
                padding: '18px 20px',
                borderRadius: 24,
                border: 'none',
                width: 280,
                marginBottom: 24,
                outline: 'none',
                background: '#f6fafd',
                boxShadow: '0 0 32px 8px #2196f3cc',
                textAlign: 'center',
                color: '#222',
                fontWeight: 600
              }}
            />
            <button onClick={handleNext} style={{ background: 'none', border: 'none', padding: 0, cursor: answers[slide.key] ? 'pointer' : 'not-allowed', width: 320, display: 'flex', justifyContent: 'center' }} disabled={!answers[slide.key]}>
              <img src={require('../assets/quiz/next-btn.png')} alt="Следующий" style={{ width: 320, height: 64, display: 'block', objectFit: 'cover', borderRadius: 16 }} />
            </button>
          </div>
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
    // Слайд "Твоя цель" (пример с кастомным оформлением)
    if (slide.key === 'goal_weight_loss') {
      const options = [
        { label: '-3 кг за месяц', value: 3 },
        { label: '-4 кг за месяц', value: 4 },
        { label: '-5 кг за месяц', value: 5 },
      ];
      const value = answers[slide.key];
      return (
        <GoalSlide
          options={options}
          selected={value}
          onSelect={v => setAnswers(a => ({ ...a, [slide.key]: v }))}
          onNext={handleNext}
        />
      );
    }
    return null;
  }

  if (!quizConfig) return <div>Загрузка...</div>;

  return (
    <div style={{ width: '100vw', minWidth: '100vw', maxWidth: '100vw', minHeight: '100dvh', height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)', boxSizing: 'border-box', padding: '32px 16px 0 16px', margin: 0, overflowX: 'hidden' }}>
      <ProgressBar current={step + 1} total={total} />
      {renderDots()}
      {renderControl({ inputRef })}
    </div>
  );
}
