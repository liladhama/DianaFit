import React from 'react';

const DianaNotification = ({ isVisible, onClose, progressData = {}, userAnswers = {} }) => {
    if (!isVisible) return null;

    const isEndOfWeek = () => {
        const today = new Date();
        return today.getDay() === 0; // Воскресенье
    };

    const generateMessage = () => {
        const { workouts = 0, nutrition = 0 } = progressData;
        
        if (workouts >= 80 && nutrition >= 80) {
            return `Великолепная неделя! 🌟 Все ожидания превзойдены!`;
        } else if (workouts >= 60 || nutrition >= 60) {
            return `Отличная работа! 💪 Продолжайте в том же духе!`;
        } else {
            return `Помните — каждый шаг важен! 💖 Завтра новый день!`;
        }
    };

    if (!isEndOfWeek()) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16,
                padding: '20px',
                maxWidth: 320,
                width: '100%',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
            }}>
                {/* Кнопка закрытия */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                    ×
                </button>

                {/* Аватар Дианы */}
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)',
                    margin: '0 auto 12px auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}>
                    👩‍⚕️
                </div>

                {/* Заголовок */}
                <h3 style={{
                    fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#fff',
                    textAlign: 'center',
                    margin: '0 0 8px 0'
                }}>
                    Сообщение от Дианы
                </h3>

                {/* Основное сообщение */}
                <p style={{
                    fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.95)',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    margin: '0 0 16px 0'
                }}>
                    {generateMessage()}
                </p>

                {/* Статистика недели */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '12px',
                    marginBottom: 16
                }}>
                    <div style={{
                        fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.8)',
                        textAlign: 'center',
                        marginBottom: 8
                    }}>
                        Итоги недели:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{
                                fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#fff'
                            }}>
                                {progressData.workouts || 0}%
                            </div>
                            <div style={{
                                fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.7)'
                            }}>
                                Тренировки
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{
                                fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#fff'
                            }}>
                                {progressData.nutrition || 0}%
                            </div>
                            <div style={{
                                fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.7)'
                            }}>
                                Питание
                            </div>
                        </div>
                    </div>
                </div>

                {/* Кнопка "Понятно" */}
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px',
                        fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#667eea',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#fff'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.9)'}
                >
                    Понятно! 💪
                </button>
            </div>
        </div>
    );
};

export default DianaNotification;
