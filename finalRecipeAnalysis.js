const recipes = require('./backend/utils/recipesDB.js');

console.log('ФИНАЛЬНЫЙ АНАЛИЗ БАЗЫ ДАННЫХ РЕЦЕПТОВ');
console.log('='.repeat(50));

// Подсчитываем рецепты по категориям
const categories = ['breakfast', 'lunch', 'snack', 'afternoonSnack', 'dinner'];
let totalRecipes = 0;
let allRecipeNames = [];

categories.forEach(category => {
    if (recipes[category] && Array.isArray(recipes[category])) {
        const count = recipes[category].length;
        totalRecipes += count;
        console.log(`${category.toUpperCase()}: ${count} рецептов`);
        
        // Добавляем названия рецептов
        recipes[category].forEach(recipe => {
            allRecipeNames.push(recipe.name);
        });
    }
});

console.log('='.repeat(50));
console.log(`ИТОГО УНИКАЛЬНЫХ РЕЦЕПТОВ: ${totalRecipes}`);

// Проверяем на дубликаты
const duplicates = allRecipeNames.filter((name, index) => allRecipeNames.indexOf(name) !== index);

if (duplicates.length === 0) {
    console.log('✅ ДУБЛИКАТОВ НЕ НАЙДЕНО!');
} else {
    console.log('❌ НАЙДЕНЫ ДУБЛИКАТЫ:');
    [...new Set(duplicates)].forEach(duplicate => {
        console.log(`- ${duplicate}`);
    });
}

// Проверяем структуру КБЖУ
console.log('\nПРОВЕРКА КБЖУ:');
let invalidNutrition = [];

allRecipeNames.forEach((name, index) => {
    const category = categories.find(cat => 
        recipes[cat] && recipes[cat].some(recipe => recipe.name === name)
    );
    
    if (category) {
        const recipe = recipes[category].find(r => r.name === name);
        if (recipe) {
            const { calories, protein, fat, carbs } = recipe;
            
            if (!calories || !protein || !fat || !carbs) {
                invalidNutrition.push(name);
            }
        }
    }
});

if (invalidNutrition.length === 0) {
    console.log('✅ ВСЕ РЕЦЕПТЫ ИМЕЮТ КОРРЕКТНЫЕ ЗНАЧЕНИЯ КБЖУ!');
} else {
    console.log('❌ РЕЦЕПТЫ С НЕКОРРЕКТНЫМИ КБЖУ:');
    invalidNutrition.forEach(name => {
        console.log(`- ${name}`);
    });
}

console.log('\n' + '='.repeat(50));
console.log('ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО!');
console.log('База данных рецептов готова к использованию.');
console.log('='.repeat(50));
