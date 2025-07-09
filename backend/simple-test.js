// Простой тест для проверки UserProgressLogger
const { Worker } = require('worker_threads');

console.log('Создаем тестового пользователя...');

// Симулируем загрузку логики UserProgressLogger
const fs = require('fs');
const path = require('path');

const logPath = path.join(process.cwd(), 'backup_files', 'users', 'testuser1_progress.json');
console.log('Путь к файлу:', logPath);

if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, 'utf-8');
    console.log('Размер файла:', content.length);
    
    if (!content.trim()) {
        console.log('ФАЙЛ ПУСТОЙ! Это причина ошибки.');
        // Создаем дефолтную структуру
        const defaultData = {
            workouts: 0,
            nutrition: 0,
            details: {
                meals: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
                weeklyProgress: [],
                commonIssues: [],
                improvements: { weekOverWeek: 0, trend: 'up' }
            },
            dailyProgress: {},
            lastUpdate: new Date().toISOString()
        };
        
        fs.writeFileSync(logPath, JSON.stringify(defaultData, null, 2));
        console.log('Файл восстановлен с дефолтной структурой');
    } else {
        try {
            const parsed = JSON.parse(content);
            console.log('JSON валидный. Ключи:', Object.keys(parsed));
            if (parsed.dailyProgress) {
                console.log('dailyProgress найден, дней:', Object.keys(parsed.dailyProgress).length);
            }
        } catch (e) {
            console.log('Ошибка парсинга JSON:', e.message);
        }
    }
} else {
    console.log('Файл не существует');
}
