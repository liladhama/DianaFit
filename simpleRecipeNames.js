const fs = require('fs');

// Читаем файл
const content = fs.readFileSync('c:\\Users\\user\\Desktop\\DianaFit\\backend\\utils\\recipesDB.js', 'utf8');

// Делим на строки и находим названия рецептов
const lines = content.split('\n');
const recipeNames = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ищем только строки с отступом "name: " (не "{ name: " для ингредиентов)
    if (line.startsWith('name: "') && line.endsWith('",')) {
        const nameMatch = line.match(/name: "([^"]+)"/);
        if (nameMatch) {
            recipeNames.push(nameMatch[1]);
        }
    }
}

console.log('=== ВСЕ НАЗВАНИЯ РЕЦЕПТОВ ===\n');
recipeNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
});

console.log(`\n=== ОБЩЕЕ КОЛИЧЕСТВО: ${recipeNames.length} ===\n`);

// Поиск дубликатов
const counts = {};
recipeNames.forEach(name => {
    counts[name] = (counts[name] || 0) + 1;
});

const duplicates = Object.entries(counts).filter(([name, count]) => count > 1);

if (duplicates.length > 0) {
    console.log('=== ДУБЛИКАТЫ ===\n');
    duplicates.forEach(([name, count]) => {
        console.log(`"${name}" - ${count} раза`);
    });
} else {
    console.log('=== ДУБЛИКАТЫ НЕ НАЙДЕНЫ ===');
}

console.log(`\n=== УНИКАЛЬНЫХ РЕЦЕПТОВ: ${Object.keys(counts).length} ===`);
