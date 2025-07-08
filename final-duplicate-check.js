// Скрипт для поиска и анализа всех названий рецептов по разделам
// Ищет дубликаты между разделами

const fs = require('fs');
const path = require('path');

try {
    const filePath = path.join(__dirname, 'backend', 'utils', 'recipesDB.js');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Парсим содержимое, чтобы найти все названия рецептов
    const recipesBySection = {};
    const allRecipeNames = [];
    
    // Регулярные выражения для поиска разделов и названий
    const sectionRegex = /(\w+):\s*\[/g;
    const nameRegex = /name:\s*["'](.*?)["']/g;
    
    let sectionMatches;
    let currentSection = null;
    let currentIndex = 0;
    
    // Найти все разделы
    const sections = [];
    while ((sectionMatches = sectionRegex.exec(content)) !== null) {
        sections.push({
            name: sectionMatches[1],
            startIndex: sectionMatches.index,
            endIndex: -1
        });
    }
    
    // Определить границы разделов
    for (let i = 0; i < sections.length; i++) {
        if (i < sections.length - 1) {
            sections[i].endIndex = sections[i + 1].startIndex;
        } else {
            sections[i].endIndex = content.length;
        }
    }
    
    // Извлечь рецепты для каждого раздела
    sections.forEach(section => {
        const sectionContent = content.substring(section.startIndex, section.endIndex);
        const names = [];
        let nameMatch;
        
        while ((nameMatch = nameRegex.exec(sectionContent)) !== null) {
            const recipeName = nameMatch[1];
            names.push(recipeName);
            allRecipeNames.push({
                name: recipeName,
                section: section.name
            });
        }
        
        recipesBySection[section.name] = names;
        console.log(`\n=== ${section.name.toUpperCase()} (${names.length} рецептов) ===`);
        names.forEach((name, idx) => {
            console.log(`${idx + 1}. ${name}`);
        });
    });
    
    // Поиск дубликатов между разделами
    console.log('\n\n=== АНАЛИЗ ДУБЛИКАТОВ МЕЖДУ РАЗДЕЛАМИ ===\n');
    
    const duplicatesFound = {};
    const processedNames = new Set();
    
    allRecipeNames.forEach((recipe, index) => {
        if (processedNames.has(recipe.name)) return;
        
        const duplicates = allRecipeNames.filter((r, i) => 
            i !== index && r.name === recipe.name
        );
        
        if (duplicates.length > 0) {
            const allSections = [recipe.section, ...duplicates.map(d => d.section)];
            duplicatesFound[recipe.name] = allSections;
            processedNames.add(recipe.name);
        }
    });
    
    if (Object.keys(duplicatesFound).length === 0) {
        console.log('🎉 ДУБЛИКАТОВ МЕЖДУ РАЗДЕЛАМИ НЕ НАЙДЕНО!');
    } else {
        console.log('❌ НАЙДЕНЫ ДУБЛИКАТЫ МЕЖДУ РАЗДЕЛАМИ:');
        Object.entries(duplicatesFound).forEach(([name, sections]) => {
            console.log(`\n"${name}" — найден в разделах: ${sections.join(', ')}`);
        });
    }
    
    // Общая статистика
    console.log('\n\n=== ОБЩАЯ СТАТИСТИКА ===');
    const totalRecipes = allRecipeNames.length;
    const uniqueRecipes = new Set(allRecipeNames.map(r => r.name)).size;
    
    console.log(`Всего рецептов: ${totalRecipes}`);
    console.log(`Уникальных названий: ${uniqueRecipes}`);
    console.log(`Найдено дубликатов: ${totalRecipes - uniqueRecipes}`);
    
    // Статистика по разделам
    console.log('\n=== СТАТИСТИКА ПО РАЗДЕЛАМ ===');
    Object.entries(recipesBySection).forEach(([section, names]) => {
        console.log(`${section}: ${names.length} рецептов`);
    });
    
} catch (error) {
    console.error('Ошибка при анализе файла:', error.message);
}
