const fs = require('fs');
const path = require('path');

// Читаем файл recipesDB.js
const filePath = path.join(__dirname, 'backend', 'utils', 'recipesDB.js');

console.log('Путь к файлу:', filePath);
console.log('Файл существует:', fs.existsSync(filePath));
const content = fs.readFileSync(filePath, 'utf8');

// Извлекаем все названия рецептов с помощью регулярного выражения
const nameMatches = content.match(/name:\s*"([^"]+)"/g);

if (!nameMatches) {
    console.log('Названия рецептов не найдены');
    process.exit(1);
}

// Извлекаем только названия
const recipeNames = nameMatches
    .map(match => match.match(/name:\s*"([^"]+)"/)[1])
    .filter(name => !name.includes('г') && !name.includes('мл') && !name.includes('шт')); // Исключаем ингредиенты

console.log('ВСЕГО НАЗВАНИЙ РЕЦЕПТОВ:', recipeNames.length);
console.log('\nСПИСОК ВСЕХ РЕЦЕПТОВ:');
recipeNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
});

// Поиск дубликатов
const nameCount = {};
const duplicates = [];

recipeNames.forEach(name => {
    if (nameCount[name]) {
        nameCount[name]++;
        if (nameCount[name] === 2) {
            duplicates.push(name);
        }
    } else {
        nameCount[name] = 1;
    }
});

console.log('\n' + '='.repeat(50));
console.log('АНАЛИЗ ДУБЛИКАТОВ:');
console.log('='.repeat(50));

if (duplicates.length > 0) {
    console.log(`\nНАЙДЕНО ${duplicates.length} ДУБЛИРУЮЩИХСЯ НАЗВАНИЙ:`);
    duplicates.forEach((name, index) => {
        console.log(`${index + 1}. "${name}" - встречается ${nameCount[name]} раз(а)`);
    });
} else {
    console.log('\nДУБЛИКАТОВ НЕ НАЙДЕНО! ✅');
}

// Подсчет уникальных рецептов
const uniqueNames = Object.keys(nameCount);
console.log(`\nИТОГОВОЕ КОЛИЧЕСТВО УНИКАЛЬНЫХ РЕЦЕПТОВ: ${uniqueNames.length}`);

// Группировка по категориям
console.log('\n' + '='.repeat(50));
console.log('СТРУКТУРА ФАЙЛА:');
console.log('='.repeat(50));

// Ищем секции
const sections = [
    { name: 'Завтрак', pattern: /breakfast:\s*\[/, end: /\]\s*,?\s*lunch:/ },
    { name: 'Обед', pattern: /lunch:\s*\[/, end: /\]\s*,?\s*snack:/ },
    { name: 'Перекус', pattern: /snack:\s*\[/, end: /\]\s*,?\s*afternoonSnack:/ },
    { name: 'Полдник', pattern: /afternoonSnack:\s*\[/, end: /\]\s*,?\s*dinner:/ },
    { name: 'Ужин', pattern: /dinner:\s*\[/, end: /\]\s*,?\s*\}/ }
];

sections.forEach(section => {
    const startMatch = content.match(section.pattern);
    const endMatch = content.match(section.end);
    
    if (startMatch && endMatch) {
        const sectionContent = content.substring(startMatch.index, endMatch.index);
        const sectionNames = sectionContent.match(/name:\s*"([^"]+)"/g) || [];
        const sectionRecipes = sectionNames
            .map(match => match.match(/name:\s*"([^"]+)"/)[1])
            .filter(name => !name.includes('г') && !name.includes('мл') && !name.includes('шт'));
        
        console.log(`${section.name}: ${sectionRecipes.length} рецептов`);
    }
});
