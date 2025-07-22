const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\user\\Desktop\\DianaFit\\backend\\backup_files\\users\\testuser1_progress.json';


if (fs.existsSync(filePath)) {
    try {
        const stats = fs.statSync(filePath);
        
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (content.trim()) {
            const parsed = JSON.parse(content);
        } else {
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
        }
    } catch (error) {
        // Ошибка — критическая, оставляем вывод
        console.error('Ошибка:', error);
    }
}
