const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backup_files', 'users', 'testuser1_progress.json');

console.log('=== ДИАГНОСТИКА ФАЙЛА ПРОГРЕССА ===');
console.log('Путь к файлу:', filePath);
console.log('Файл существует:', fs.existsSync(filePath));

if (fs.existsSync(filePath)) {
    try {
        // Получаем статистику файла
        const stats = fs.statSync(filePath);
        console.log('Размер файла:', stats.size, 'байт');
        console.log('Время изменения:', stats.mtime);
        
        // Читаем содержимое как Buffer для проверки кодировки
        const buffer = fs.readFileSync(filePath);
        console.log('Размер буфера:', buffer.length, 'байт');
        console.log('Первые 10 байт как hex:', buffer.slice(0, 10).toString('hex'));
        console.log('Первые 10 байт как utf8:', buffer.slice(0, 10).toString('utf8'));
        
        // Читаем как строку разными способами
        const contentUtf8 = fs.readFileSync(filePath, 'utf8');
        const contentUtf16le = fs.readFileSync(filePath, 'utf16le');
        const contentLatin1 = fs.readFileSync(filePath, 'latin1');
        
        console.log('Длина как UTF-8:', contentUtf8.length);
        console.log('Длина как UTF-16LE:', contentUtf16le.length);
        console.log('Длина как Latin-1:', contentLatin1.length);
        
        console.log('Содержимое (первые 200 символов UTF-8):');
        console.log('"' + contentUtf8.substring(0, 200) + '"');
        
        if (contentUtf8.trim()) {
            try {
                const parsed = JSON.parse(contentUtf8);
                console.log('JSON валидный. Ключи верхнего уровня:', Object.keys(parsed));
                if (parsed.dailyProgress) {
                    console.log('dailyProgress содержит дней:', Object.keys(parsed.dailyProgress).length);
                }
            } catch (parseError) {
                console.log('Ошибка парсинга JSON:', parseError.message);
            }
        } else {
            console.log('ФАЙЛ СОДЕРЖИТ ТОЛЬКО ПРОБЕЛЫ/ПЕРЕНОСЫ!');
        }
        
    } catch (error) {
        console.error('Ошибка чтения файла:', error);
    }
} else {
    console.log('ФАЙЛ НЕ СУЩЕСТВУЕТ!');
}

console.log('=== КОНЕЦ ДИАГНОСТИКИ ===');
