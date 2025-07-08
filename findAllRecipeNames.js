const fs = require('fs');

// Читаем файл с рецептами
const filePath = 'c:\\Users\\user\\Desktop\\DianaFit\\backend\\utils\\recipesDB.js';
const content = fs.readFileSync(filePath, 'utf8');

// Ищем все строки с name: "название рецепта"
const nameRegex = /name: "([^"]+)"/g;
const recipeNames = [];
let match;

while ((match = nameRegex.exec(content)) !== null) {
    const name = match[1];
    // Исключаем названия ингредиентов (они обычно идут после ingredients)
    const beforeMatch = content.substring(0, match.index);
    const linesBeforeMatch = beforeMatch.split('\n');
    const lastLines = linesBeforeMatch.slice(-5); // последние 5 строк перед названием
    
    // Проверяем, что это название рецепта, а не ингредиента
    const isIngredient = lastLines.some(line => 
        line.includes('ingredients') || 
        line.includes('name:') ||
        line.includes('amount:') ||
        line.includes('unit:')
    );
    
    if (!isIngredient) {
        recipeNames.push(name);
    }
}

console.log('=== СПИСОК ВСЕХ НАЗВАНИЙ РЕЦЕПТОВ ===\n');
recipeNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
});

console.log(`\n=== ОБЩЕЕ КОЛИЧЕСТВО РЕЦЕПТОВ: ${recipeNames.length} ===\n`);

// Ищем дубликаты
const duplicates = {};
const unique = new Set();

recipeNames.forEach(name => {
    if (unique.has(name)) {
        if (!duplicates[name]) {
            duplicates[name] = 2;
        } else {
            duplicates[name]++;
        }
    } else {
        unique.add(name);
    }
});

if (Object.keys(duplicates).length > 0) {
    console.log('=== НАЙДЕННЫЕ ДУБЛИКАТЫ ===\n');
    Object.entries(duplicates).forEach(([name, count]) => {
        console.log(`"${name}" - повторяется ${count} раза`);
    });
} else {
    console.log('=== ДУБЛИКАТЫ НЕ НАЙДЕНЫ ===');
}

console.log(`\n=== КОЛИЧЕСТВО УНИКАЛЬНЫХ РЕЦЕПТОВ: ${unique.size} ===`);
