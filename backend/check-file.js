const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\user\\Desktop\\DianaFit\\backend\\backup_files\\users\\testuser1_progress.json';

console.log('Проверяем файл:', filePath);
console.log('Существует:', fs.existsSync(filePath));

if (fs.existsSync(filePath)) {
    try {
        const stats = fs.statSync(filePath);
        console.log('Размер файла:', stats.size, 'байт');
        
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log('Длина содержимого:', content.length);
        console.log('Содержимое пустое:', !content.trim());
        
        if (content.trim()) {
            console.log('Первые 100 символов:', content.substring(0, 100));
            const parsed = JSON.parse(content);
            console.log('JSON валидный, ключи:', Object.keys(parsed));
        } else {
            console.log('Файл пустой, создаем дефолтную структуру');
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
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
            console.log('Дефолтная структура создана');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}
