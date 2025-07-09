import UserProgressLogger from './userProgressLogger.js';

console.log('=== ТЕСТИРОВАНИЕ UserProgressLogger ===');

try {
    const logger = new UserProgressLogger('testuser1');
    console.log('Logger создан');
    
    // Загружаем лог
    const log = logger.loadLog();
    console.log('Лог загружен. Ключи:', Object.keys(log));
    
    if (log.dailyProgress) {
        console.log('dailyProgress найден, дней:', Object.keys(log.dailyProgress).length);
    }
    
    // Сохраняем тестовый прогресс
    const testDate = new Date().toISOString().split('T')[0];
    await logger.saveDayProgress({
        date: testDate,
        ate: true,
        workout: false,
        tasks: [{
            name: 'test',
            type: 'test',
            done: true
        }]
    });
    
    console.log('Тестовый прогресс сохранен');
    
    // Загружаем еще раз для проверки
    const updatedLog = logger.loadLog();
    console.log('Обновленный лог загружен. Дней в dailyProgress:', Object.keys(updatedLog.dailyProgress).length);
    
    console.log('=== ТЕСТ ПРОЙДЕН УСПЕШНО ===');
    
} catch (error) {
    console.error('ОШИБКА В ТЕСТЕ:', error);
}
