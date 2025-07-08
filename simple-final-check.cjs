// ФИНАЛЬНЫЙ РУЧНОЙ ПОДСЧЁТ
const fs = require('fs');

console.log('=== ФИНАЛЬНЫЙ ПОДСЧЁТ РЕЦЕПТОВ ===\n');

const content = fs.readFileSync('./backend/utils/recipesDB.js', 'utf8');
const lines = content.split('\n');
const recipeNames = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const nameMatch = line.match(/^"?name"?\s*:\s*"([^"]+)"/);
    if (nameMatch) {
        const name = nameMatch[1];
        
        // Проверяем, что это рецепт, а не ингредиент
        let isRecipe = false;
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j];
            if (nextLine.includes('"type":') || nextLine.includes('type:') ||
                nextLine.includes('"dietType":') || nextLine.includes('dietType:') ||
                nextLine.includes('"calories":') || nextLine.includes('calories:')) {
                isRecipe = true;
                break;
            }
            if (nextLine.includes('"amount":') || nextLine.includes('amount:')) {
                break;
            }
        }
        
        if (isRecipe) {
            recipeNames.push(name);
        }
    }
}

console.log(`Всего найдено рецептов: ${recipeNames.length}\n`);

// Поиск дубликатов
const nameCounts = {};
recipeNames.forEach(name => {
    nameCounts[name] = (nameCounts[name] || 0) + 1;
});

const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);

if (duplicates.length > 0) {
    console.log('❌ НАЙДЕНЫ ДУБЛИКАТЫ:');
    duplicates.forEach(([name, count]) => {
        console.log(`"${name}" - ${count} раз`);
    });
} else {
    console.log('🎉 ДУБЛИКАТЫ НЕ НАЙДЕНЫ!');
}

const uniqueCount = Object.keys(nameCounts).length;
console.log(`\nУникальных рецептов: ${uniqueCount}`);

console.log('\n=== ПОЛНЫЙ СПИСОК УНИКАЛЬНЫХ РЕЦЕПТОВ ===\n');
Object.keys(nameCounts).sort().forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
});

console.log(`\n✅ ИТОГО: ${uniqueCount} уникальных рецептов`);
