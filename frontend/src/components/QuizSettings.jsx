import React, { useState, useEffect } from 'react';

const QuizSettings = ({ quizAnswers = {}, onSettingChange }) => {
    const [userAnswers, setUserAnswers] = useState(quizAnswers);
    const [nutritionInfo, setNutritionInfo] = useState(null);

    // Все вопросы квиза
    const quizQuestions = [
        {
            id: 'name',
            label: 'Имя',
            type: 'text'
        },
        {
            id: 'age',
            label: 'Возраст',
            type: 'select',
            options: Array.from({length: 50}, (_, i) => ({
                value: i + 18,
                text: `${i + 18} лет`
            }))
        },
        {
            id: 'weight',
            label: 'Вес (кг)',
            type: 'select',
            options: Array.from({length: 81}, (_, i) => ({
                value: i + 40,
                text: `${i + 40} кг`
            }))
        },
        {
            id: 'height',
            label: 'Рост (см)',
            type: 'select',
            options: Array.from({length: 71}, (_, i) => ({
                value: i + 140,
                text: `${i + 140} см`
            }))
        },
        {
            id: 'gender',
            label: 'Пол',
            type: 'select',
            options: [
                { value: 'female', text: 'Женский' },
                { value: 'male', text: 'Мужской' }
            ]
        },
        {
            id: 'goal_weight_loss',
            label: 'Цель похудения',
            type: 'select',
            options: [
                { value: 'slow', text: 'Медленное похудение (0.25 кг/нед)' },
                { value: 'moderate', text: 'Умеренное похудение (0.5 кг/нед)' },
                { value: 'fast', text: 'Быстрое похудение (0.75 кг/нед)' },
                { value: 'very_fast', text: 'Очень быстрое похудение (1 кг/нед)' }
            ]
        },
        {
            id: 'activity_coef',
            label: 'Уровень активности',
            type: 'select',
            options: [
                { value: 'sedentary', text: 'Малоподвижный образ жизни' },
                { value: 'light', text: 'Легкая активность (1-3 раза в неделю)' },
                { value: 'moderate', text: 'Умеренная активность (3-5 раз в неделю)' },
                { value: 'high', text: 'Высокая активность (6-7 раз в неделю)' },
                { value: 'very_high', text: 'Очень высокая активность (2 раза в день)' }
            ]
        },
        {
            id: 'diet_flags',
            label: 'Тип питания',
            type: 'select',
            options: [
                { value: 'regular', text: 'Обычное питание' },
                { value: 'vegetarian', text: 'Вегетарианское' },
                { value: 'vegan', text: 'Веганское' },
                { value: 'pescatarian', text: 'Пескетарианское' },
                { value: 'keto', text: 'Кето-диета' },
                { value: 'paleo', text: 'Палео-диета' },
                { value: 'mediterranean', text: 'Средиземноморская диета' }
            ]
        },
        {
            id: 'allergies',
            label: 'Аллергии и непереносимости',
            type: 'select',
            options: [
                { value: 'none', text: 'Нет аллергий' },
                { value: 'lactose', text: 'Непереносимость лактозы' },
                { value: 'gluten', text: 'Непереносимость глютена' },
                { value: 'nuts', text: 'Аллергия на орехи' },
                { value: 'shellfish', text: 'Аллергия на морепродукты' },
                { value: 'eggs', text: 'Аллергия на яйца' },
                { value: 'soy', text: 'Аллергия на сою' }
            ]
        },
        {
            id: 'cooking_experience',
            label: 'Опыт приготовления пищи',
            type: 'select',
            options: [
                { value: 'beginner', text: 'Новичок' },
                { value: 'intermediate', text: 'Средний уровень' },
                { value: 'advanced', text: 'Продвинутый' },
                { value: 'expert', text: 'Эксперт' }
            ]
        },
        {
            id: 'budget_per_day',
            label: 'Бюджет на питание в день',
            type: 'select',
            options: [
                { value: 'low', text: 'До 500 руб' },
                { value: 'medium', text: '500-1000 руб' },
                { value: 'high', text: '1000-1500 руб' },
                { value: 'premium', text: 'Более 1500 руб' }
            ]
        },
        {
            id: 'meal_prep_time',
            label: 'Время на приготовление еды',
            type: 'select',
            options: [
                { value: 'minimal', text: 'Минимальное (до 15 мин)' },
                { value: 'short', text: 'Короткое (15-30 мин)' },
                { value: 'medium', text: 'Среднее (30-60 мин)' },
                { value: 'long', text: 'Длительное (более 60 мин)' }
            ]
        },
        {
            id: 'training_place',
            label: 'Место тренировок',
            type: 'select',
            options: [
                { value: 'home', text: 'Дома' },
                { value: 'gym', text: 'В спортзале' },
                { value: 'outdoor', text: 'На улице' },
                { value: 'mixed', text: 'Комбинированно' }
            ]
        },
        {
            id: 'available_equipment',
            label: 'Доступное оборудование',
            type: 'select',
            options: [
                { value: 'none', text: 'Нет оборудования' },
                { value: 'basic', text: 'Базовое (гантели, коврик)' },
                { value: 'intermediate', text: 'Среднее (штанга, тренажеры)' },
                { value: 'full', text: 'Полный зал' }
            ]
        },
        {
            id: 'workout_duration',
            label: 'Продолжительность тренировки',
            type: 'select',
            options: [
                { value: 'short', text: '15-30 минут' },
                { value: 'medium', text: '30-45 минут' },
                { value: 'long', text: '45-60 минут' },
                { value: 'very_long', text: 'Более 60 минут' }
            ]
        },
        {
            id: 'workout_frequency',
            label: 'Частота тренировок',
            type: 'select',
            options: [
                { value: '1-2', text: '1-2 раза в неделю' },
                { value: '3-4', text: '3-4 раза в неделю' },
                { value: '5-6', text: '5-6 раз в неделю' },
                { value: 'daily', text: 'Каждый день' }
            ]
        },
        {
            id: 'fitness_level',
            label: 'Уровень физической подготовки',
            type: 'select',
            options: [
                { value: 'beginner', text: 'Новичок' },
                { value: 'intermediate', text: 'Средний' },
                { value: 'advanced', text: 'Продвинутый' },
                { value: 'expert', text: 'Эксперт' }
            ]
        },
        {
            id: 'motivation_level',
            label: 'Уровень мотивации',
            type: 'select',
            options: [
                { value: 'low', text: 'Низкий' },
                { value: 'medium', text: 'Средний' },
                { value: 'high', text: 'Высокий' },
                { value: 'very_high', text: 'Очень высокий' }
            ]
        },
        {
            id: 'preferred_workout_time',
            label: 'Предпочитаемое время тренировок',
            type: 'select',
            options: [
                { value: 'morning', text: 'Утром (6:00-10:00)' },
                { value: 'midday', text: 'Днем (10:00-14:00)' },
                { value: 'afternoon', text: 'После обеда (14:00-18:00)' },
                { value: 'evening', text: 'Вечером (18:00-22:00)' }
            ]
        },
        {
            id: 'start_date',
            label: 'Дата начала программы',
            type: 'date'
        }
    ];

    useEffect(() => {
        // Обновляем локальное состояние при изменении пропсов
        if (Object.keys(quizAnswers).length > 0) {
            setUserAnswers(quizAnswers);
        } else {
            // Загружаем сохраненные ответы пользователя, если пропсы пустые
            fetchUserAnswers();
        }
    }, [quizAnswers]);

    useEffect(() => {
        if (Object.keys(userAnswers).length > 0) {
            updateNutritionInfo();
        }
    }, [userAnswers]);

    const fetchUserAnswers = async () => {
        try {
            const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'default';
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/quiz-answers/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserAnswers(data);
            }
        } catch (error) {
            console.error('Error fetching user answers:', error);
        }
    };

    const updateNutritionInfo = () => {
        try {
            if (Object.keys(userAnswers).length > 4) {
                // TODO: Раскомментировать когда будут готовы функции расчета
                // const bmr = calculateBMR(userAnswers);
                // const macros = calculateMacros(bmr, userAnswers.goal_weight_loss, userAnswers.activity_coef);
                // setNutritionInfo(macros);
                
                // Временная заглушка для демонстрации
                setNutritionInfo({
                    protein: 120,
                    fats: 60,
                    carbs: 200,
                    calories: 1800
                });
            }
            
            if (onSettingChange) {
                onSettingChange(userAnswers);
            }
        } catch (error) {
            console.error('Error calculating nutrition:', error);
        }
    };

    const handleAnswerSelect = async (questionId, value) => {
        const updatedAnswers = {
            ...userAnswers,
            [questionId]: value
        };
        setUserAnswers(updatedAnswers);

        try {
            const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'default';
            await fetch(`${process.env.REACT_APP_API_URL}/api/user/quiz-answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    answers: { [questionId]: value }
                })
            });
            
            if (onSettingChange) {
                onSettingChange(updatedAnswers);
            }
        } catch (error) {
            console.error('Error saving answer:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    return (
        <div style={{
            color: '#fff',
            fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif"
        }}>
            <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 16px 0',
                textAlign: 'center',
                color: '#fff'
            }}>
                Мои настройки
            </h3>
            
            <div style={{
                display: 'grid',
                gap: 12,
                marginBottom: 20,
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '8px'
            }}>
                {quizQuestions.map(question => (
                    <div key={question.id} style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        padding: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <label style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.8)',
                            marginBottom: 6,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {question.label}
                        </label>
                        
                        {question.type === 'text' ? (
                            <input
                                type="text"
                                value={userAnswers[question.id] || ''}
                                onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: 8,
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: 14,
                                    fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                    color: '#333',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.background = '#fff'}
                                onBlur={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.9)'}
                            />
                        ) : question.type === 'date' ? (
                            <input
                                type="date"
                                value={formatDate(userAnswers[question.id])}
                                onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: 8,
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: 14,
                                    fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                    color: '#333',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.background = '#fff'}
                                onBlur={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.9)'}
                            />
                        ) : (
                            <select 
                                value={userAnswers[question.id] || ''}
                                onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: 8,
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: 14,
                                    fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                    color: '#333',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.background = '#fff'}
                                onBlur={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.9)'}
                            >
                                <option value="">Выберите...</option>
                                {question.options?.map(option => (
                                    <option 
                                        key={option.value} 
                                        value={option.value}
                                    >
                                        {option.text}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                ))}
            </div>

            {nutritionInfo && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <h4 style={{
                        fontSize: 14,
                        fontWeight: 700,
                        margin: '0 0 12px 0',
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Мои показатели
                    </h4>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            padding: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: 2
                            }}>
                                {nutritionInfo.protein}г
                            </div>
                            <div style={{
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.7)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Белки
                            </div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            padding: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: 2
                            }}>
                                {nutritionInfo.fats}г
                            </div>
                            <div style={{
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.7)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Жиры
                            </div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            padding: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: 2
                            }}>
                                {nutritionInfo.carbs}г
                            </div>
                            <div style={{
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.7)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Углеводы
                            </div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            padding: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: 2
                            }}>
                                {nutritionInfo.calories}
                            </div>
                            <div style={{
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.7)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Ккал
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizSettings;
