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

// Единый стиль для кнопок "Следующий" согласно референсу
const getButtonStyle = (isEnabled = true, customStyles = {}) => ({
  fontSize: 18,
  fontWeight: 700,
  fontFamily: 'Roboto, sans-serif',
  padding: '16px 32px',
  borderRadius: 12,
  background: isEnabled ? '#2196f3' : '#ccc',
  color: '#fff',
  border: 'none',
  boxShadow: isEnabled ? '0 4px 16px 0 #2196f366' : 'none',
  cursor: isEnabled ? 'pointer' : 'not-allowed',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  letterSpacing: '0.5px',
  textTransform: 'none',
  ...customStyles
});

// Стиль для кнопок выбора
const getChoiceButtonStyle = (customStyles = {}) => ({
  fontSize: 18,
  fontWeight: 700,
  fontFamily: 'Roboto, sans-serif',
  padding: '16px 28px',
  borderRadius: 12,
  background: '#2196f3',
  color: '#fff',
  border: 'none',
  boxShadow: '0 4px 16px 0 #2196f366',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  letterSpacing: '0.5px',
  textTransform: 'none',
  ...customStyles
});

// Униврсальный стиль для кнопок выбора по референсу GoalSlide
const getChoiceOptionStyle = (isSelected = false, customStyles = {}) => ({
  background: '#fff',
  color: isSelected ? '#2196f3' : '#bdbdbd',
  border: isSelected ? '2.5px solid #2196f3' : '2.5px solid #eaf4ff',
  boxShadow: '0 0 24px 8px #2196f3cc',
  borderRadius: 32,
  fontSize: 22,
  fontWeight: 700,
  cursor: 'pointer',
  outline: 'none',
  transition: 'all 0.18s',
  ...customStyles
});

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

  useEffect(() => {
    if (slide?.type === 'finish') {
      const timer = setTimeout(() => {
        handleNext();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [slide]);

  function handleNext() {
    if (!quizConfig) return;
    console.log('handleNext', { step, total, nextStep: step + 1 });
    if (step < total - 1) setStep(step + 1);
    else if (onFinish) {
      console.log('StoryQuiz onFinish', answers);
      onFinish(answers);
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
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

  // Показываем стрелочку возврата начиная со слайда "Твой возраст" (step > 1, так как 0 - welcome, 1 - пол)
  // Но не показываем для GoalSlide, так как у него своя стрелочка
  const showBackButton = step > 1 && slide?.type !== 'welcome' && slide?.type !== 'finish' && slide?.key !== 'goal_weight_loss';

  function renderBackButton() {
    if (!showBackButton) return null;
    
    return (
      <button
        onClick={handleBack}
        style={{
          position: 'absolute',
          top: 24,
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
          boxSizing: 'border-box',
          padding: '60px 16px 16px 16px'
        }}>
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 26, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0.2, color: '#181818', alignSelf: 'center', lineHeight: 1.05 }}>
              ГДЕ БУДЕШЬ<br />ТРЕНИРОВАТЬСЯ
            </div>
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              border: '2px solid rgb(34, 34, 34)',
              borderRadius: 24,
              background: 'rgb(255, 255, 255)',
              boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
              padding: '8px 15px',
              minHeight: 80,
              position: 'relative',
              gap: 18,
              maxWidth: 320,
            }}>
              <img src={require('../assets/quiz/dumbbell.png')} alt="dumbbell" style={{ width: 88, height: 88, borderRadius: 16, objectFit: 'cover', marginRight: 4 }} />
              <div style={{ fontSize: 14, color: '#222', lineHeight: 1.3, fontWeight: 500, marginLeft: -6 }}>
                Я подберу эффективный комплекс под твои условия, чтобы тренировки приносили результат и удовольствие.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', width: '100%', marginTop: 32 }}>
              {options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    style={getChoiceOptionStyle(isSelected, {
                      padding: '18px 32px',
                      minWidth: 120,
                      margin: '0 8px',
                      letterSpacing: '0.5px',
                      display: 'block',
                    })}
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
          boxSizing: 'border-box',
          padding: '32px 16px 16px 16px'
        }}>
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 26, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0.2, color: '#181818', alignSelf: 'center', lineHeight: 1.05 }}>
              ТВОЙ ОПЫТ<br />ТРЕНИРОВОК
            </div>
            <div style={{
              border: '2px solid #222',
              borderRadius: 24,
              background: '#fff',
              boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
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
                Опыт в тренировках помогает избежать травм и упростить адаптацию к нагрузкам.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', marginTop: 0 }}>
              {options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    style={getChoiceOptionStyle(isSelected, {
                      padding: '18px 0',
                      width: 200,
                      margin: '0 auto',
                      letterSpacing: '0.5px',
                      textTransform: 'none',
                    })}
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
          boxSizing: 'border-box',
          padding: '32px 16px 16px 16px'
        }}>
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 26, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0.2, color: '#181818', alignSelf: 'center', lineHeight: 1.05 }}>
              ТВОЯ БЫТОВАЯ<br />АКТИВНОСТЬ
            </div>
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              border: '2px solid rgb(34, 34, 34)',
              borderRadius: 24,
              background: 'rgb(255, 255, 255)',
              boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
              padding: '12px 15px',
              minHeight: 80,
              position: 'relative',
              gap: 18,
              maxWidth: 340,
            }}>
              <img
                src={require('../assets/quiz/heart.png')}
                alt="heart"
                style={{
                  width: 78,
                  height: 61,
                  borderRadius: 22,
                  objectFit: 'cover',
                  background: 'transparent',
                  marginRight: -11,
                }}
              />
              <div style={{
                fontSize: 14,
                color: '#222',
                fontWeight: 500,
                flex: 1,
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                lineHeight: 1.2,
              }}>
                Уровень твоей бытовой активности важен для понимания, сколько энергии ты тратишь в течение дня. Это поможет мне точнее программу тренировок.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%', marginTop: 0 }}>
              {options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    style={getChoiceOptionStyle(isSelected, {
                      padding: '18px 0',
                      width: 200,
                      margin: '0 auto',
                      letterSpacing: '0.5px',
                      textTransform: 'none',
                      whiteSpace: 'pre-line',
                    })}
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
            <button className="quiz-btn age-btn" style={getButtonStyle(true, { marginTop: 0, width: 320, maxWidth: '90vw' })} onClick={handleNext}>Следующий</button>
          </div>
        </div>
      );
    }
    if ((slide.type === 'choice' || slide.type === 'radio' || slide.type === 'toggle') && slide.key === 'sex') {
      return (
        <div style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: 'transparent',
          boxSizing: 'border-box',
          padding: '32px 16px 16px 16px'
        }}>
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 26, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0.2, color: '#181818' }}>
              ТВОЙ ПОЛ
            </div>
            <div style={{
              border: '2px solid #222',
              borderRadius: 18,
              background: '#fff',
              boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
              padding: '16px 8px 16px 18px',
              marginBottom: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              width: '100%',
              maxWidth: 318,
              minHeight: 80,
              position: 'relative',
              overflow: 'visible',
              zIndex: 2
            }}>
              <img src={require('../assets/welcome/cupcake.png')} alt="cupcake" style={{
                width: 80,
                height: 80,
                objectFit: 'cover',
                borderRadius: 16,
                overflow: 'visible',
                zIndex: 3,
                marginLeft: -10
              }} />
              <div style={{
                fontSize: 14,
                color: '#222',
                lineHeight: 1.15,
                fontWeight: 500,
                marginLeft: -2,
                marginRight: -6,
                padding: 0,
                marginTop: 0,
                marginBottom: 0,
                flex: 1,
                textAlign: 'left'
              }}>
                Это поможет мне подобрать нагрузку и упражнения, которые наилучшим образом учитывают физиологические особенности твоего организма.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', width: '100%', marginTop: 32 }}>
              {slide.options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    style={getChoiceOptionStyle(isSelected, {
                      padding: '18px 32px',
                      minWidth: 120,
                    })}
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
    // Специальный слайд для выбора количества тренировок
    if (slide.key === 'workouts_per_week') {
      return (
        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', padding: '32px 16px 16px 16px', textAlign: 'center', minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 340 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#181818', marginBottom: 24, lineHeight: 1.2, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.2 }}>
              СКОЛЬКО ТРЕНИРОВОК В НЕДЕЛЮ БУДЕМ ВЫПОЛНЯТЬ?
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 32,
              border: '2px solid rgb(34, 34, 34)',
              borderRadius: 24,
              background: 'rgb(255, 255, 255)',
              boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
              padding: '8px 15px',
              minHeight: 65,
              position: 'relative',
              gap: 18,
              maxWidth: 360,
            }}>
              <img src={require('../assets/quiz/dumbbell.png')} alt="dumbbell" style={{ width: 88, height: 88, borderRadius: 16, objectFit: 'cover', marginLeft: -8 }} />
              <div style={{ fontSize: 13, color: '#222', lineHeight: 1.3, fontWeight: 500, textAlign: 'left', marginLeft: -10 }}>
                Лучше делать меньше, но регулярно. На основе этого мы подберём сбалансированную программу. тренировок
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%', marginTop: 0 }}>
              {slide.options.map(opt => {
                const isSelected = answers[slide.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    style={getChoiceOptionStyle(isSelected, {
                      padding: '18px 0',
                      width: 200,
                      margin: '0 auto',
                      letterSpacing: '0.5px',
                      textTransform: 'none',
                    })}
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
              <button className="quiz-btn age-btn" style={getChoiceButtonStyle()} key={opt.value} onClick={() => handleAnswer(slide.key, opt.value)}>{opt.label}</button>
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
        <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)', boxSizing: 'border-box', padding: '32px 16px 16px 16px', position: 'relative' }}>
          <div style={{ fontWeight: 700, fontSize: 26, margin: '8px 0 12px 0', textAlign: 'center', letterSpacing: 0.2, color: '#181818', textTransform: 'uppercase' }}>{slide.title}</div>
          <div style={{
            width: '100%',
            minHeight: 80,
            boxSizing: 'border-box',
            padding: 0,
            display: 'flex',
            justifyContent: 'center',
            marginTop: 0
          }}>
            <div style={{
              border: '2px solid #222',
              borderRadius: 18,
              background: '#fff',
              boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
              padding: '12px 18px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              width: '100%',
              maxWidth: 340,
              minHeight: 80,
              position: 'relative',
              overflow: 'visible',
              zIndex: 2
            }}>
              <img src={require('../assets/welcome/cupcake2.png')} alt="cupcake"
                style={{
                  width: 70,
                  height: 70,
                  objectFit: 'cover',
                  borderRadius: 16,
                  overflow: 'visible',
                  zIndex: 3,
                  marginLeft: 6
                }}
              />
              <div style={{ fontSize: 14, color: '#222', lineHeight: 1.15, fontWeight: 500, marginLeft: 8, marginRight: 0, padding: 0, marginTop: 0, marginBottom: 0 }}>
                Это поможет мне подготовить тренировку, наиболее соответствующую твоей возрастной группе.
              </div>
            </div>
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 32, background: 'none', boxShadow: 'none', border: 'none', marginTop: 48 }}>
            <WheelPicker value={value} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} min={minYear} max={maxYear} />
          </div>
          <button className="quiz-btn age-btn" style={getButtonStyle(true, { marginTop: 48, width: 320, maxWidth: '90vw' })} onClick={handleNext}>Следующий</button>
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
          <div style={{ fontWeight: 700, fontSize: 26, margin: '48px 0 24px 0', textAlign: 'center', letterSpacing: 0.2, color: '#181818', textTransform: 'uppercase' }}>{slide.title}</div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8, minHeight: 120 }}>
            <HorizontalWeightSlider value={value} min={slide.min} max={slide.max} unit={slide.unit} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} />
          </div>
          <button className="quiz-btn age-btn" style={getButtonStyle(true, { marginTop: 0, width: 320, maxWidth: '90vw' })} onClick={handleNext}>Следующий</button>
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
          <div style={{ fontWeight: 700, fontSize: 26, margin: '32px 0 24px 0', textAlign: 'center', letterSpacing: 0.2, color: '#181818', textTransform: 'uppercase' }}>{slide.title}</div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8, minHeight: 420 }}>
            <CustomSlider value={value} min={slide.min} max={slide.max} unit={slide.unit} onChange={v => setAnswers(a => ({ ...a, [slide.key]: v }))} height={380} />
          </div>
          <button className="quiz-btn age-btn" style={getButtonStyle(true, { marginTop: 0, width: 320, maxWidth: '90vw' })} onClick={handleNext}>Следующий</button>
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
            <button className="quiz-btn age-btn" style={getButtonStyle(true, { marginTop: 18 })} onClick={handleNext}>Дальше</button>
          </div>
        </>
      );
    }
    if (slide.type === 'input') {
      return (
        <div style={{
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: '100vh',
          background: 'transparent',
          boxSizing: 'border-box',
          padding: '32px 16px 16px 16px'
        }}>
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
            <button className="quiz-btn age-btn" style={getButtonStyle(!!answers[slide.key], { marginTop: 24, width: 320, maxWidth: '90vw' })} onClick={handleNext} disabled={!answers[slide.key]}>Следующий</button>
          </div>
        </div>
      );
    }
    if (slide.type === 'finish') {
      return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff' }}>
          <video
            src={require('../assets/quiz/diana-calc.webm')}
            autoPlay
            loop
            muted
            playsInline
            style={{ position: 'fixed', top: '-60px', left: 0, width: '100vw', height: 'calc(100vh + 60px)', objectFit: 'cover', zIndex: 1 }}
          />
        </div>
      );
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
            years={options.map(o => o.value)}
            labels={options.map(o => o.label)}
          />
          <button className="quiz-btn" style={getButtonStyle(true, { marginTop: 32, width: 320, maxWidth: '90vw' })} onClick={handleNext}>Рассчитать программу</button>
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
      // Для GoalSlide показываем стрелочку, если step > 1
      const goalShowBackButton = step > 1;
      return (
        <GoalSlide
          options={options}
          selected={value}
          onSelect={v => setAnswers(a => ({ ...a, [slide.key]: v }))}
          onNext={handleNext}
          onBack={handleBack}
          showBackButton={goalShowBackButton}
        />
      );
    }
    if (slide.key === 'diet_flags') {
      // Кастомный слайд выбора типа питания
      const options = [
        { label: 'вегетарианство 🥚', value: 'vegetarian_eggs' },
        { label: 'вегетарианство', value: 'vegetarian_no_eggs' },
        { label: 'мясной', value: 'meat' },
        { label: 'рыбный', value: 'fish' },
        { label: 'веганство', value: 'vegan' }
      ];
      const value = answers[slide.key] || '';
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)',
            boxSizing: 'border-box',
            padding: '32px 16px 16px 16px',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 26, margin: '8px 0 16px 0', textAlign: 'center', letterSpacing: 0.2, color: '#181818', textTransform: 'uppercase' }}>
            ТВОЙ ТИП ПИТАНИЯ
          </div>
          <div style={{
            width: '100%',
            maxWidth: 340,
            display: 'flex',
            alignItems: 'center',
            marginBottom: 16,
            border: '2px solid rgb(34, 34, 34)',
            borderRadius: 24,
            background: 'rgb(255, 255, 255)',
            boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
            padding: '7px 7px',
            minHeight: 80,
            position: 'relative',
            gap: 18,
          }}>
            <img
              src={require('../assets/quiz/cupcake.png')}
              alt="cupcake"
              style={{
                width: 80,
                height: 66,
                borderRadius: 23,
                objectFit: 'cover',
                background: 'transparent',
                marginRight: -20,
                marginLeft: -2,
              }}
            />
            <div style={{
              fontSize: 13,
              color: '#222',
              fontWeight: 500,
              flex: 1,
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              lineHeight: 1.2,
            }}>
              Тип питания показывает твои привычки и поможет создать удобную и эффективную программу.
            </div>
          </div>
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', marginBottom: 24 }}>
            {options.map(opt => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(slide.key, opt.value)}
                  style={getChoiceOptionStyle(isSelected, {
                    width: 210,
                    height: 70,
                    borderRadius: 35,
                    fontWeight: 700,
                    fontSize: 20,
                    fontFamily: 'Roboto, sans-serif',
                    textTransform: 'none',
                    letterSpacing: '0.5px',
                    padding: '18px 0',
                  })}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  }

  if (!quizConfig) return <div>Загрузка...</div>;

  return (
    <div style={{ width: '100vw', minWidth: '100vw', maxWidth: '100vw', minHeight: '100dvh', height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg, #fff 0%, #e3f0ff 100%)', boxSizing: 'border-box', padding: '8px 16px 0 16px', margin: 0, overflowX: 'hidden', position: 'relative' }}>
      {renderBackButton()}
      <ProgressBar current={step + 1} total={total} />
      {renderDots()}
      {renderControl({ inputRef })}
    </div>
  );
}
