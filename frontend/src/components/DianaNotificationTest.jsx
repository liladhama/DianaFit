import React from 'react';

const DianaNotificationTest = ({ isVisible, onClose }) => {
    if (!isVisible) return null;
    
    return (
        <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            background: 'white', 
            padding: '10px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '14px'
        }}>
            Тест уведомления от Дианы
            <button onClick={onClose} style={{ marginLeft: '10px' }}>×</button>
        </div>
    );
};

export default DianaNotificationTest;
