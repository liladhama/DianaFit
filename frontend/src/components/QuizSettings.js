import React, { useState, useEffect } from 'react';

const QuizSettings = ({ quizAnswers = {}, onSettingChange }) => {
    const [userAnswers, setUserAnswers] = useState(quizAnswers);
    const [nutritionInfo, setNutritionInfo] = useState(null);
    const [savingStates, setSavingStates] = useState({});
    const [openPicker, setOpenPicker] = useState(null);
    const [selectedValue, setSelectedValue] = useState(null);

    // Правильные вопросы из story quiz
    const quizQuestions = [
        {
            id: 'name',
            label: 'Имя',
            type: 'text'
        },
        {
            id: 'age',
            label: 'Возраст',
            type: 'wheel',
            options: Array.from({length: 50}, (_, i) => ({
                value: i + 18,
                text: `${i + 18} лет`
            }))
        },
        {
            id: 'birth_year',
            label: 'Год рождения',
            type: 'wheel',
            options: Array.from({length: 70}, (_, i) => {
                const year = new Date().getFullYear() - i - 18;
                return {
                    value: year,
                    text: `${year} г.р.`
                };
            })
        },
        {
            id: 'weight',
            label: 'Вес (кг)',
            type: 'wheel',
            options: Array.from({length: 81}, (_, i) => ({
                value: i + 40,
                text: `${i + 40} кг`
            }))
        },
        {
            id: 'height',
            label: 'Рост (см)',
            type: 'wheel',
            options: Array.from({length: 71}, (_, i) => ({
                value: i + 140,
                text: `${i + 140} см`
            }))
        },
        {
            id: 'diet_flags',
            label: 'Тип питания',
            type: 'wheel',
            options: [
                { value: 'meat', text: 'Мясная' },
                { value: 'fish', text: 'Рыбная' },
                { value: 'vegetarian_egg', text: 'Вегетарианская с яйцом' },
                { value: 'vegetarian', text: 'Вегетарианская' },
                { value: 'vegan', text: 'Веганская' }
            ]
        },
        {
            id: 'activity_coef',
            label: 'Уровень активности',
            type: 'wheel',
            options: [
                { value: 'sedentary', text: 'Малоподвижный образ жизни' },
                { value: 'light', text: 'Легкая активность (1-3 раза в неделю)' },
                { value: 'moderate', text: 'Умеренная активность (3-5 раз в неделю)' },
                { value: 'high', text: 'Высокая активность (6-7 раз в неделю)' }
            ]
        },
        {
            id: 'goal_weight_loss',
            label: 'Цель похудения',
            type: 'wheel',
            options: [
                { value: 'slow', text: 'Медленное похудение (0.25 кг/нед)' },
                { value: 'moderate', text: 'Умеренное похудение (0.5 кг/нед)' },
                { value: 'fast', text: 'Быстрое похудение (0.75 кг/нед)' }
            ]
        },
        {
            id: 'training_place',
            label: 'Место тренировок',
            type: 'wheel',
            options: [
                { value: 'home', text: 'Дома' },
                { value: 'gym', text: 'В спортзале' },
                { value: 'mixed', text: 'Комбинированно' }
            ]
        }
    ];

    useEffect(() => {
        if (Object.keys(quizAnswers).length > 0) {
            // Если есть возраст, но нет года рождения, вычисляем его
            const updatedAnswers = { ...quizAnswers };
            
            if (updatedAnswers.age && updatedAnswers.age > 1900) {
                // Если в поле возраста записан год рождения
                updatedAnswers.birth_year = updatedAnswers.age;
                const currentYear = new Date().getFullYear();
                updatedAnswers.age = currentYear - updatedAnswers.birth_year;
            } else if (updatedAnswers.age && !updatedAnswers.birth_year) {
                // Если есть возраст, но нет года рождения
                const currentYear = new Date().getFullYear();
                updatedAnswers.birth_year = currentYear - updatedAnswers.age;
            } else if (!updatedAnswers.age && updatedAnswers.birth_year) {
                // Если есть год рождения, но нет возраста
                const currentYear = new Date().getFullYear();
                updatedAnswers.age = currentYear - updatedAnswers.birth_year;
            }
            
            setUserAnswers(updatedAnswers);
        } else {
            fetchUserAnswers();
        }
    }, [quizAnswers]); // Добавляем зависимость от quizAnswers

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
                // Расчет БЖУ на основе данных пользователя
                const bmr = calculateBMR();
                const macros = calculateMacros(bmr);
                setNutritionInfo(macros);
            }
            
            if (onSettingChange) {
                onSettingChange(userAnswers);
            }
        } catch (error) {
            console.error('Error calculating nutrition:', error);
        }
    };

    const calculateBMR = () => {
        const { weight, height, age } = userAnswers;
        if (!weight || !height || !age) return 1800;
        
        // Формула Миффлина-Сан Жеора (используем женский вариант по умолчанию для безопасности)
        // Для женщин: BMR = (10 * вес в кг) + (6.25 * рост в см) - (5 * возраст) - 161
        const bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        
        // Умножаем на коэффициент активности
        const activityCoefs = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            high: 1.725
        };
        
        return bmr * (activityCoefs[userAnswers.activity_coef] || 1.2);
    };

    const calculateMacros = (calories) => {
        // Расчет БЖУ в зависимости от цели
        const goalCoefs = {
            slow: 0.9,
            moderate: 0.8,
            fast: 0.75
        };
        
        const targetCalories = calories * (goalCoefs[userAnswers.goal_weight_loss] || 0.8);
        
        return {
            calories: Math.round(targetCalories),
            protein: Math.round(targetCalories * 0.25 / 4), // 25% калорий
            fats: Math.round(targetCalories * 0.25 / 9),    // 25% калорий  
            carbs: Math.round(targetCalories * 0.5 / 4)     // 50% калорий
        };
    };

    const handleAnswerSelect = (questionId, value) => {
        const updatedAnswers = {
            ...userAnswers,
            [questionId]: value
        };
        
        // Если изменился год рождения, автоматически обновляем возраст
        if (questionId === 'birth_year') {
            const currentYear = new Date().getFullYear();
            updatedAnswers.age = currentYear - value;
        }
        
        // Если изменился возраст, автоматически обновляем год рождения
        if (questionId === 'age') {
            const currentYear = new Date().getFullYear();
            updatedAnswers.birth_year = currentYear - value;
        }
        
        setUserAnswers(updatedAnswers);
    };

    const handleSaveAnswer = async (questionId) => {
        setSavingStates(prev => ({ ...prev, [questionId]: true }));
        
        try {
            const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'default';
            
            // Если сохраняем возраст или год рождения, сохраняем оба значения
            let dataToSave = {};
            if (questionId === 'age' || questionId === 'birth_year') {
                dataToSave = {
                    age: userAnswers.age,
                    birth_year: userAnswers.birth_year
                };
            } else {
                dataToSave = {
                    [questionId]: userAnswers[questionId]
                };
            }
            
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/quiz-answers/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave)
            });

            if (response.ok) {
                setSavingStates(prev => ({ ...prev, [questionId]: 'success' }));
                setTimeout(() => {
                    setSavingStates(prev => ({ ...prev, [questionId]: false }));
                }, 1500);
            }
        } catch (error) {
            console.error('Error saving answer:', error);
            setSavingStates(prev => ({ ...prev, [questionId]: 'error' }));
            setTimeout(() => {
                setSavingStates(prev => ({ ...prev, [questionId]: false }));
            }, 2000);
        }
    };

    const renderWheelPicker = (question) => {
        const currentValue = userAnswers[question.id] || question.options[0]?.value;
        
        return (
            <div
                onClick={() => {
                    setSelectedValue(currentValue);
                    setOpenPicker(question.id);
                }}
                style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 14,
                    fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                    color: '#333',
                    transition: 'all 0.2s'
                }}
            >
                <span>
                    {question.options.find(opt => opt.value === currentValue)?.text || 'Выберите...'}
                </span>
                <span style={{ fontSize: 12, color: '#666' }}>🎯</span>
            </div>
        );
    };

    // Компонент модального колеса прокрутки
    const WheelPickerModal = ({ question, isOpen, onClose, onSave }) => {
        const currentValue = userAnswers[question.id] || question.options[0]?.value;
        const [selectedIndex, setSelectedIndex] = useState(
            question.options.findIndex(opt => opt.value === currentValue) || 0
        );

        // Обновление индекса при изменении userAnswers
        useEffect(() => {
            const newIndex = question.options.findIndex(opt => opt.value === currentValue) || 0;
            setSelectedIndex(newIndex);
        }, [currentValue, question.options]);

        const handleScroll = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 1 : -1;
            const newIndex = Math.max(0, Math.min(question.options.length - 1, selectedIndex + delta));
            setSelectedIndex(newIndex);
        };

        const handleSave = () => {
            const selectedOption = question.options[selectedIndex];
            handleAnswerSelect(question.id, selectedOption.value);
            setTimeout(() => {
                handleSaveAnswer(question.id);
            }, 100); // Небольшая задержка для обновления userAnswers
            onClose();
        };

        if (!isOpen) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}>
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '16px',
                    width: '90%',
                    maxWidth: 280,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                }}>
                    <h3 style={{
                        fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                        fontSize: 16,
                        margin: '0 0 16px 0',
                        textAlign: 'center',
                        color: '#333'
                    }}>
                        Выберите {question.label.toLowerCase()}
                    </h3>

                    {/* Колесо прокрутки */}
                    <div style={{
                        height: 200,
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid #eee',
                        borderRadius: 8
                    }}>
                        <div
                            onWheel={handleScroll}
                            style={{
                                transform: `translateY(-${selectedIndex * 40}px)`,
                                transition: 'transform 0.3s ease',
                                padding: '80px 0'
                            }}
                        >
                            {question.options.map((option, index) => (
                                <div
                                    key={option.value}
                                    onClick={() => setSelectedIndex(index)}
                                    style={{
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: index === selectedIndex ? 16 : 14,
                                        fontWeight: index === selectedIndex ? 600 : 400,
                                        color: index === selectedIndex ? '#667eea' : '#666',
                                        background: index === selectedIndex ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif"
                                    }}
                                >
                                    {option.text}
                                </div>
                            ))}
                        </div>

                        {/* Индикатор выбранного элемента */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: 40,
                            marginTop: -20,
                            border: '2px solid #667eea',
                            borderRadius: 8,
                            pointerEvents: 'none',
                            background: 'rgba(102, 126, 234, 0.05)'
                        }} />
                    </div>

                    {/* Кнопки */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '16px'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                background: '#fff',
                                color: '#666',
                                fontSize: 14,
                                fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                cursor: 'pointer'
                            }}
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                borderRadius: 8,
                                background: '#667eea',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 600,
                                fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                cursor: 'pointer'
                            }}
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            </div>
        );
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
                gap: 10,
                marginBottom: 16,
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '4px',
                width: '100%'
            }}>
                {quizQuestions.map(question => (
                    <div key={question.id} style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        padding: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        width: '100%',
                        boxSizing: 'border-box'
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
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {question.type === 'text' ? (
                                <input
                                    type="text"
                                    value={userAnswers[question.id] || ''}
                                    onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                                    style={{
                                        flex: 1,
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
                                />
                            ) : question.type === 'wheel' ? (
                                <div style={{ flex: 1 }}>
                                    {renderWheelPicker(question)}
                                </div>
                            ) : (
                                <select 
                                    value={userAnswers[question.id] || ''}
                                    onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                                    style={{
                                        flex: 1,
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
                            
                            <button
                                onClick={() => handleSaveAnswer(question.id)}
                                disabled={!userAnswers[question.id] || savingStates[question.id] === true}
                                style={{
                                    padding: '8px 12px',
                                    border: 'none',
                                    borderRadius: 8,
                                    background: savingStates[question.id] === 'success' ? '#4CAF50' :
                                               savingStates[question.id] === 'error' ? '#f44336' :
                                               userAnswers[question.id] ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                                    color: savingStates[question.id] === 'success' || savingStates[question.id] === 'error' ? '#fff' : '#333',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: userAnswers[question.id] && !savingStates[question.id] ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s',
                                    minWidth: '60px',
                                    textAlign: 'center'
                                }}
                            >
                                {savingStates[question.id] === true ? '...' :
                                 savingStates[question.id] === 'success' ? '✓' :
                                 savingStates[question.id] === 'error' ? '✗' : 
                                 'Сохр'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Информационное сообщение */}
            <div style={{
                background: 'rgba(255, 193, 7, 0.2)',
                borderRadius: 12,
                padding: '10px',
                border: '1px solid rgba(255, 193, 7, 0.4)',
                marginBottom: '14px',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                    lineHeight: 1.4
                }}>
                    ⚡ Изменения настроек повлияют на расчет питания с новой недели
                </div>
            </div>

            {nutritionInfo && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    width: '100%',
                    boxSizing: 'border-box'
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
                        Мои показатели БЖУ
                    </h4>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8
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

            {/* Модальное окно колеса прокрутки */}
            {openPicker && (
                <WheelPickerModal
                    question={quizQuestions.find(q => q.id === openPicker)}
                    isOpen={true}
                    onClose={() => setOpenPicker(null)}
                    onSave={() => setOpenPicker(null)}
                />
            )}
        </div>
    );
};

export default QuizSettings;
