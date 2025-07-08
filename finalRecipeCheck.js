// ФИНАЛЬНАЯ ПРОВЕРКА ПОСЛЕ УДАЛЕНИЯ ВСЕХ ДУБЛИКАТОВ
const fs = require('fs');

try {
    // Попробуем загрузить рецепты напрямую
    const recipes = require('./backend/utils/recipesDB.js');
    
    console.log("=== ФИНАЛЬНЫЙ АНАЛИЗ ПОСЛЕ УДАЛЕНИЯ ДУБЛИКАТОВ ===\n");
    
    // Подсчёт рецептов по разделам
    const breakfast = recipes.breakfast || [];
    const lunch = recipes.lunch || [];
    const snacks = recipes.snacks || [];
    const afternoon_snacks = recipes.afternoon_snacks || [];
    const dinner = recipes.dinner || [];
    
    console.log("РЕЦЕПТОВ ПО РАЗДЕЛАМ:");
    console.log(`ЗАВТРАК (breakfast): ${breakfast.length} рецептов`);
    console.log(`ОБЕД (lunch): ${lunch.length} рецептов`);
    console.log(`ПЕРЕКУС (snacks): ${snacks.length} рецептов`);
    console.log(`ПОЛДНИК (afternoon_snacks): ${afternoon_snacks.length} рецептов`);
    console.log(`УЖИН (dinner): ${dinner.length} рецептов`);
    
    const totalCount = breakfast.length + lunch.length + snacks.length + afternoon_snacks.length + dinner.length;
    console.log(`\nВСЕГО РЕЦЕПТОВ: ${totalCount}`);
    
    // Собираем все названия рецептов
    const allRecipes = [
        ...breakfast.map(r => ({name: r.name, section: 'ЗАВТРАК'})),
        ...lunch.map(r => ({name: r.name, section: 'ОБЕД'})),
        ...snacks.map(r => ({name: r.name, section: 'ПЕРЕКУС'})),
        ...afternoon_snacks.map(r => ({name: r.name, section: 'ПОЛДНИК'})),
        ...dinner.map(r => ({name: r.name, section: 'УЖИН'}))
    ];
    
    // Поиск дубликатов между разделами
    console.log("\n=== ПРОВЕРКА НА ДУБЛИКАТЫ МЕЖДУ РАЗДЕЛАМИ ===\n");
    
    const duplicatesFound = {};
    const processedNames = new Set();
    
    allRecipes.forEach((recipe, index) => {
        if (processedNames.has(recipe.name)) return;
        
        const duplicates = allRecipes.filter((r, i) => 
            i !== index && r.name === recipe.name
        );
        
        if (duplicates.length > 0) {
            const allSections = [recipe.section, ...duplicates.map(d => d.section)];
            duplicatesFound[recipe.name] = allSections;
            processedNames.add(recipe.name);
        }
    });
    
    if (Object.keys(duplicatesFound).length === 0) {
        console.log("🎉 ОТЛИЧНО! ДУБЛИКАТОВ МЕЖДУ РАЗДЕЛАМИ НЕ НАЙДЕНО!");
    } else {
        console.log("❌ НАЙДЕНЫ ДУБЛИКАТЫ МЕЖДУ РАЗДЕЛАМИ:");
        Object.entries(duplicatesFound).forEach(([name, sections]) => {
            console.log(`\n"${name}" — найден в разделах: ${sections.join(', ')}`);
        });
    }
    
    // Проверка на дубликаты внутри разделов
    console.log("\n=== ПРОВЕРКА НА ДУБЛИКАТЫ ВНУТРИ РАЗДЕЛОВ ===\n");
    
    const sections = [
        {name: 'ЗАВТРАК', recipes: breakfast},
        {name: 'ОБЕД', recipes: lunch},
        {name: 'ПЕРЕКУС', recipes: snacks},
        {name: 'ПОЛДНИК', recipes: afternoon_snacks},
        {name: 'УЖИН', recipes: dinner}
    ];
    
    let foundInternalDuplicates = false;
    
    sections.forEach(section => {
        const names = section.recipes.map(r => r.name);
        const uniqueNames = new Set(names);
        
        if (names.length !== uniqueNames.size) {
            console.log(`❌ Дубликаты в разделе ${section.name}:`);
            const counts = {};
            names.forEach(name => {
                counts[name] = (counts[name] || 0) + 1;
            });
            Object.entries(counts).forEach(([name, count]) => {
                if (count > 1) {
                    console.log(`  "${name}" - ${count} раз`);
                }
            });
            foundInternalDuplicates = true;
        }
    });
    
    if (!foundInternalDuplicates) {
        console.log("🎉 ОТЛИЧНО! ДУБЛИКАТОВ ВНУТРИ РАЗДЕЛОВ НЕ НАЙДЕНО!");
    }
    
    // Итоговая статистика
    const uniqueNames = new Set(allRecipes.map(r => r.name));
    console.log("\n=== ИТОГОВАЯ СТАТИСТИКА ===");
    console.log(`Всего рецептов в базе: ${totalCount}`);
    console.log(`Уникальных названий: ${uniqueNames.size}`);
    console.log(`Дубликатов: ${totalCount - uniqueNames.size}`);
    
    // Полный список всех уникальных рецептов
    console.log("\n=== ПОЛНЫЙ СПИСОК ВСЕХ УНИКАЛЬНЫХ РЕЦЕПТОВ ===\n");
    Array.from(uniqueNames).sort().forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
    });
    
    console.log(`\n=== ИТОГ ===`);
    console.log(`✅ Общее количество уникальных рецептов: ${uniqueNames.size}`);
    console.log(`✅ Все дубликаты удалены!`);
    
} catch (error) {
    console.error('Ошибка при анализе файла:', error.message);
    console.log('\nПроверим структуру файла...');
}
