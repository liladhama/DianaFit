import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const QuizSettings = ({ quizAnswers = {}, onSettingChange }) => {
    const [userAnswers, setUserAnswers] = useState(quizAnswers || {});
    const [savingStates, setSavingStates] = useState({});
    const [openPicker, setOpenPicker] = useState(null);
    const [selectedValue, setSelectedValue] = useState(null);
    const [debugUserId, setDebugUserId] = useState('');
    const [debugStatus, setDebugStatus] = useState('');
    const [debugError, setDebugError] = useState('');

    // Синхронизируем userAnswers с quizAnswers из пропсов
    useEffect(() => {
        setUserAnswers(quizAnswers || {});
    }, [quizAnswers]);

    // Вопросы и ключи строго соответствуют backup-файлу
    const quizQuestions = [
        { id: 'name', label: 'Имя', type: 'text' },
        { id: 'age', label: 'Возраст', type: 'wheel', options: Array.from({length: 67}, (_, i) => ({ value: i + 14, text: `${i + 14} лет` })) },
        { id: 'sex', label: 'Пол', type: 'wheel', options: [
            { value: 'male', text: 'Мужской' },
            { value: 'female', text: 'Женский' }
        ] },
        { id: 'height_cm', label: 'Рост (см)', type: 'wheel', options: Array.from({length: 101}, (_, i) => ({ value: i + 100, text: `${i + 100} см` })) },
        { id: 'weight_kg', label: 'Вес (кг)', type: 'wheel', options: Array.from({length: 151}, (_, i) => ({ value: i + 30, text: `${i + 30} кг` })) },
        { id: 'gym_or_home', label: 'Место тренировок', type: 'wheel', options: [
            { value: 'home', text: 'Дома' },
            { value: 'gym', text: 'В спортзале' }
        ] },
        { id: 'training_level', label: 'Уровень подготовки', type: 'wheel', options: [
            { value: 'beginner', text: 'Новичок' },
            { value: 'intermediate', text: 'Средний' },
            { value: 'advanced', text: 'Продвинутый' }
        ] },
        { id: 'activity_coef', label: 'Твоя бытовая активность', type: 'wheel', options: [
            { value: 1.2, text: 'Нет активности' },
            { value: 1.375, text: 'Лёгкая' },
            { value: 1.55, text: 'Средняя' },
            { value: 1.725, text: 'Интенсив' }
        ] },
        { id: 'workouts_per_week', label: 'Тренировок в неделю', type: 'wheel', options: Array.from({length: 14}, (_, i) => ({ value: i + 1, text: `${i + 1}` })) },
        { id: 'diet_flags', label: 'Тип питания', type: 'wheel', options: [
            { value: 'vegetarian_eggs', text: 'Вегетарианство с яйцом 🥚' },
            { value: 'vegetarian_no_eggs', text: 'Вегетарианство (без яиц)' },
            { value: 'meat', text: 'Мясной' },
            { value: 'fish', text: 'Рыбный' },
            { value: 'vegan', text: 'Веганство' }
        ] },
        { id: 'goal', label: 'Цель', type: 'wheel', options: [
            { value: 3, text: '-3 кг за месяц' },
            { value: 4, text: '-4 кг за месяц' },
            { value: 5, text: '-5 кг за месяц' }
        ] },
        // ...существующие вопросы...
        { id: 'timezone', label: 'Часовой пояс для уведомлений', type: 'wheel', options: [
            { value: 'Europe/Moscow', text: 'Москва (Europe/Moscow)' },
            { value: 'Asia/Tbilisi', text: 'Тбилиси (Asia/Tbilisi)' },
            { value: 'Europe/Kiev', text: 'Киев (Europe/Kiev)' },
            { value: 'Europe/Minsk', text: 'Минск (Europe/Minsk)' },
            { value: 'Asia/Almaty', text: 'Алматы (Asia/Almaty)' },
            { value: 'Asia/Yekaterinburg', text: 'Екатеринбург (Asia/Yekaterinburg)' },
            { value: 'Asia/Baku', text: 'Баку (Asia/Baku)' },
            { value: 'Asia/Tashkent', text: 'Ташкент (Asia/Tashkent)' },
            { value: 'Asia/Bishkek', text: 'Бишкек (Asia/Bishkek)' },
            { value: 'Asia/Ashgabat', text: 'Ашхабад (Asia/Ashgabat)' },
            { value: 'Asia/Yerevan', text: 'Ереван (Asia/Yerevan)' },
            { value: 'Asia/Vladivostok', text: 'Владивосток (Asia/Vladivostok)' },
            { value: 'Asia/Novosibirsk', text: 'Новосибирск (Asia/Novosibirsk)' },
            { value: 'Asia/Sakhalin', text: 'Сахалин (Asia/Sakhalin)' },
            { value: 'Asia/Krasnoyarsk', text: 'Красноярск (Asia/Krasnoyarsk)' },
            { value: 'Asia/Irkutsk', text: 'Иркутск (Asia/Irkutsk)' },
            { value: 'Asia/Magadan', text: 'Магадан (Asia/Magadan)' },
            { value: 'Asia/Kamchatka', text: 'Камчатка (Asia/Kamchatka)' }
        ] },
        { id: 'notifyHour', label: 'Время рассылки (час)', type: 'wheel', options: Array.from({length: 7}, (_, i) => ({ value: 6 + i, text: `${6 + i}:00` })) },
    ];

    const handleAnswerSelect = (questionId, value) => {
        setUserAnswers(prev => {
            const updated = { ...prev, [questionId]: value };
            if (onSettingChange) onSettingChange({ [questionId]: value });
            return updated;
        });
    };

    const handleSaveAnswer = async (questionId, valueToSave = null) => {
        setSavingStates(prev => ({ ...prev, [questionId]: true }));
        try {
            const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user_local_test';
            // Используем переданное значение или берём из состояния
            const finalValue = valueToSave !== null ? valueToSave : userAnswers[questionId];
            let dataToSave = { [questionId]: finalValue };
            let apiUrl = `${API_URL}/api/user/quiz-answers/${userId}`;
            let method = 'PATCH';
            // Для timezone и notifyHour используем отдельный API
            if (questionId === 'timezone' || questionId === 'notifyHour') {
                dataToSave = {
                    userId,
                    timezone: userAnswers.timezone || 'Europe/Moscow',
                    notifyHour: Number(userAnswers.notifyHour) || 9
                };
                apiUrl = `${API_URL}/api/user/notification-settings`;
                method = 'POST';
            }
            const response = await fetch(apiUrl, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
            if (response.ok) {
                setSavingStates(prev => ({ ...prev, [questionId]: 'success' }));
                setTimeout(() => {
                    setSavingStates(prev => ({ ...prev, [questionId]: false }));
                }, 1500);
                // fetchUserAnswers удалён: теперь обновление quizAnswers идёт через пропсы из ProfilePage
            }
        } catch (error) {
            setSavingStates(prev => ({ ...prev, [questionId]: 'error' }));
            setTimeout(() => {
                setSavingStates(prev => ({ ...prev, [questionId]: false }));
            }, 2000);
        }
    };

    const renderWheelPicker = (question) => {
        // Приводим к строке для сравнения
        const currentValue = userAnswers.hasOwnProperty(question.id) ? String(userAnswers[question.id]) : '';
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
                    {question.options.find(opt => String(opt.value) === currentValue)?.text || 'Выберите...'}
                </span>
                <span style={{ fontSize: 12, color: '#666' }}>🎯</span>
            </div>
        );
    };

    const SimplePickerModal = ({ question, isOpen, onClose, handleAnswerSelect, handleSaveAnswer }) => {
        const currentValue = userAnswers.hasOwnProperty(question.id) ? String(userAnswers[question.id]) : '';
        const [localValue, setLocalValue] = useState(currentValue);
        useEffect(() => { setLocalValue(currentValue); }, [currentValue]);
        const handleSave = () => {
            if (handleAnswerSelect) handleAnswerSelect(question.id, localValue);
            if (handleSaveAnswer) handleSaveAnswer(question.id, localValue);
            onClose();
        };
        if (!isOpen) return null;
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'auto' }} onClick={onClose}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '16px', width: '90%', maxWidth: 320, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
                    <h3 style={{ fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif", fontSize: 16, margin: '0 0 16px 0', textAlign: 'center', color: '#333' }}>
                        Выберите {question.label.toLowerCase()}
                    </h3>
                    <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
                        {question.options.map((option) => (
                            <label key={option.value} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', cursor: 'pointer', fontWeight: localValue === String(option.value) ? 700 : 400, color: localValue === String(option.value) ? '#667eea' : '#333', fontSize: 15 }}>
                                <input type="radio" name="picker" value={option.value} checked={localValue === String(option.value)} onChange={() => setLocalValue(String(option.value))} style={{ marginRight: 10 }} />
                                {option.text}
                            </label>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', color: '#666', fontSize: 14, fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif", cursor: 'pointer' }}>Отмена</button>
                        <button onClick={handleSave} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#667eea', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif", cursor: 'pointer' }}>Сохранить</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ color: '#222', fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', textAlign: 'center', color: '#222' }}>Мои настройки</h3>
            <div style={{ display: 'grid', gap: 10, marginBottom: 16, maxHeight: '400px', overflowY: 'auto', paddingRight: '4px', width: '100%' }}>
                {quizQuestions.map(question => (
                    <div key={question.id} style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: '10px', border: '1px solid rgba(255, 255, 255, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{question.label}</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {question.type === 'text' ? (
                                <input type="text" value={userAnswers[question.id] || ''} onChange={(e) => handleAnswerSelect(question.id, e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 8, background: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif", color: '#333', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} />
                            ) : question.type === 'wheel' ? (
                                <div style={{ flex: 1 }}>{renderWheelPicker(question)}</div>
                            ) : null}
                            <button onClick={() => handleSaveAnswer(question.id)} disabled={!userAnswers[question.id] || savingStates[question.id] === true} style={{ padding: '8px 12px', border: 'none', borderRadius: 8, background: savingStates[question.id] === 'success' ? '#4CAF50' : savingStates[question.id] === 'error' ? '#f44336' : userAnswers[question.id] ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)', color: savingStates[question.id] === 'success' || savingStates[question.id] === 'error' ? '#fff' : '#333', fontSize: 12, fontWeight: 600, cursor: userAnswers[question.id] && !savingStates[question.id] ? 'pointer' : 'not-allowed', transition: 'all 0.2s', minWidth: '60px', textAlign: 'center' }}>
                                {savingStates[question.id] === true ? '...' : savingStates[question.id] === 'success' ? '✓' : savingStates[question.id] === 'error' ? '✗' : 'Сохр'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ background: 'rgba(255, 193, 7, 0.2)', borderRadius: 12, padding: '10px', border: '1px solid rgba(255, 193, 7, 0.4)', marginBottom: '14px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, lineHeight: 1.4 }}>
                    ⚡ Изменения настроек повлияют на расчет питания с новой недели
                </div>
            </div>
            {openPicker && (
                <SimplePickerModal question={quizQuestions.find(q => q.id === openPicker)} isOpen={true} onClose={() => setOpenPicker(null)} handleAnswerSelect={handleAnswerSelect} handleSaveAnswer={handleSaveAnswer} />
            )}
        </div>
    );
};

export default QuizSettings;
