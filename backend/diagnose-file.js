const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backup_files', 'users', 'testuser1_progress.json');


if (fs.existsSync(filePath)) {
    try {
        // Получаем статистику файла
        const stats = fs.statSync(filePath);
        
        // Читаем содержимое как Buffer для проверки кодировки
        const buffer = fs.readFileSync(filePath);
        
        // Читаем как строку разными способами
        const contentUtf8 = fs.readFileSync(filePath, 'utf8');
        const contentUtf16le = fs.readFileSync(filePath, 'utf16le');
        const contentLatin1 = fs.readFileSync(filePath, 'latin1');
        
        
        if (contentUtf8.trim()) {
            try {
                const parsed = JSON.parse(contentUtf8);
                // JSON валидный, оставляем вывод
                console.error('JSON валидный. Ключи верхнего уровня:', Object.keys(parsed));
                if (parsed.dailyProgress) {
                    console.error('dailyProgress содержит дней:', Object.keys(parsed.dailyProgress).length);
                }
            } catch (parseError) {
                // Ошибка парсинга JSON — критическая, оставляем вывод
                console.error('Ошибка парсинга JSON:', parseError.message);
            }
        } else {
            console.log('ФАЙЛ СОДЕРЖИТ ТОЛЬКО ПРОБЕЛЫ/ПЕРЕНОСЫ!');
        }
        
    } catch (error) {
        // Ошибка чтения файла — критическая, оставляем вывод
        console.error('Ошибка чтения файла:', error);
    }
} else {
    // Файл не существует — критическая, оставляем вывод
    console.error('ФАЙЛ НЕ СУЩЕСТВУЕТ!');
}

