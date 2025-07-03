import React from 'react';

const QuizSettingsTest = ({ quizAnswers = {}, onSettingChange }) => {
    return (
        <div style={{ color: '#fff', padding: '20px' }}>
            <h3>Настройки (тест)</h3>
            <p>Компонент загружается корректно</p>
        </div>
    );
};

export default QuizSettingsTest;
