import UserProgressLogger from './userProgressLogger.js';

async function testProgressLogger() {
    console.log('Тестируем UserProgressLogger...');
    
    try {
        const logger = new UserProgressLogger('testuser1');
        console.log('UserProgressLogger создан');
        
        // Загружаем лог
        const log = logger.loadLog();
        console.log('Лог загружен:', Object.keys(log));
        
        if (log.dailyProgress) {
            console.log('dailyProgress существует, дней:', Object.keys(log.dailyProgress).length);
        } else {
            console.log('dailyProgress отсутствует!');
        }
        
        // Сохраняем тестовый прогресс
        await logger.saveDayProgress({
            date: '2025-07-09',
            ate: true,
            workout: false,
            tasks: []
        });
        
        console.log('Тест прогресса прошел успешно!');
        
    } catch (error) {
        console.error('Ошибка теста:', error);
    }
}

testProgressLogger();
