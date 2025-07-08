const fs = require('fs');

// Читаем файл с рецептами
const filePath = 'c:\\Users\\user\\Desktop\\DianaFit\\backend\\utils\\recipesDB.js';
const content = fs.readFileSync(filePath, 'utf8');

// Разбиваем на строки и ищем названия рецептов
const lines = content.split('\n');
const recipeNames = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ищем строки с name: "название" где предыдущие строки указывают на рецепт
    if (line.includes('name: "') && !line.includes('amount:') && !line.includes('unit:')) {
        const nameMatch = line.match(/name: "([^"]+)"/);
        if (nameMatch) {
            const name = nameMatch[1];
            
            // Проверяем контекст - это должно быть в начале объекта рецепта
            const prevLines = lines.slice(Math.max(0, i-5), i);
            const nextLines = lines.slice(i+1, Math.min(lines.length, i+6));
            
            // Если в следующих строках есть type, dietType, calories - это рецепт
            const hasRecipeProps = nextLines.some(nextLine => 
                nextLine.includes('type:') || 
                nextLine.includes('dietType:') || 
                nextLine.includes('calories:')
            );
            
            // Если в предыдущих строках есть ingredients или { - это не рецепт
            const isInIngredients = prevLines.some(prevLine => 
                prevLine.includes('ingredients') || 
                prevLine.includes('{ name:')
            );
            
            if (hasRecipeProps && !isInIngredients) {
                recipeNames.push(name);
            }
        }
    }
}

console.log('=== СПИСОК ВСЕХ НАЗВАНИЙ РЕЦЕПТОВ ===\n');
recipeNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
});

console.log(`\n=== ОБЩЕЕ КОЛИЧЕСТВО РЕЦЕПТОВ: ${recipeNames.length} ===\n`);

// Ищем дубликаты
const nameCount = {};
recipeNames.forEach(name => {
    nameCount[name] = (nameCount[name] || 0) + 1;
});

const duplicates = Object.entries(nameCount).filter(([name, count]) => count > 1);

if (duplicates.length > 0) {
    console.log('=== НАЙДЕННЫЕ ДУБЛИКАТЫ ===\n');
    duplicates.forEach(([name, count]) => {
        console.log(`"${name}" - повторяется ${count} раза`);
    });
} else {
    console.log('=== ДУБЛИКАТЫ НЕ НАЙДЕНЫ ===');
}

const uniqueCount = Object.keys(nameCount).length;
console.log(`\n=== КОЛИЧЕСТВО УНИКАЛЬНЫХ РЕЦЕПТОВ: ${uniqueCount} ===`);
