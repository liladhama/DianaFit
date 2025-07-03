import React from 'react';

const DianaNotification = ({ isVisible, onClose, progressData = {}, userAnswers = {} }) => {
    if (!isVisible) return null;

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
                position: 'relative',
                textAlign: 'center',
                color: '#fff',
                fontFamily: "'Alte Haas Grotesk RUS', Arial, sans-serif"
            }}>
                <h3>Уведомление от Дианы</h3>
                <p>Простое уведомление (в разработке)</p>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Закрыть
                </button>
            </div>
        </div>
    );
};

export default DianaNotification;
