// Ручной поиск дубликатов рецептов в recipesDB.js
const fs = require('fs');
const path = require('path');

console.log('=== ПОИСК ДУБЛИКАТОВ РЕЦЕПТОВ ===\n');

try {
  const recipesPath = path.join(__dirname, 'backend', 'utils', 'recipesDB.js');
  const content = fs.readFileSync(recipesPath, 'utf8');
  
  // Ищем все названия рецептов
  const nameMatches = content.match(/name:\s*"([^"]+)"/g);
  
  if (nameMatches) {
    const recipeNames = nameMatches.map(match => {
      const nameMatch = match.match(/name:\s*"([^"]+)"/);
      return nameMatch ? nameMatch[1].trim() : null;
    }).filter(name => name !== null);
    
    console.log(`📊 Найдено ${recipeNames.length} названий рецептов`);
    
    // Создаем объект для подсчета повторений
    const nameCount = {};
    const duplicates = [];
    
    recipeNames.forEach((name, index) => {
      if (nameCount[name]) {
        nameCount[name]++;
        if (nameCount[name] === 2) {
          duplicates.push(name);
        }
      } else {
        nameCount[name] = 1;
      }
    });
    
    console.log(`\n=== РЕЗУЛЬТАТЫ ПРОВЕРКИ ===`);
    
    if (duplicates.length === 0) {
      console.log('✅ ДУБЛИКАТОВ НЕ НАЙДЕНО! Все рецепты уникальны.');
    } else {
      console.log(`❌ НАЙДЕНЫ ДУБЛИКАТЫ (${duplicates.length}):`);
      duplicates.forEach((name, index) => {
        console.log(`${index + 1}. "${name}" - повторяется ${nameCount[name]} раз(а)`);
      });
    }
    
    // Дополнительная проверка на похожие названия
    console.log(`\n=== ПРОВЕРКА ПОХОЖИХ НАЗВАНИЙ ===`);
    const similarPairs = [];
    
    for (let i = 0; i < recipeNames.length; i++) {
      for (let j = i + 1; j < recipeNames.length; j++) {
        const name1 = recipeNames[i].toLowerCase();
        const name2 = recipeNames[j].toLowerCase();
        
        // Проверяем, содержит ли одно название основные слова другого
        const words1 = name1.split(' ').filter(w => w.length > 2);
        const words2 = name2.split(' ').filter(w => w.length > 2);
        
        let commonWords = 0;
        words1.forEach(word => {
          if (words2.includes(word)) commonWords++;
        });
        
        // Если больше половины слов совпадают, считаем похожими
        if (commonWords >= Math.min(words1.length, words2.length) / 2 && commonWords >= 2) {
          similarPairs.push([recipeNames[i], recipeNames[j]]);
        }
      }
    }
    
    if (similarPairs.length === 0) {
      console.log('✅ Похожих названий не найдено.');
    } else {
      console.log(`⚠️ Найдены похожие названия (${similarPairs.length} пар):`);
      similarPairs.forEach((pair, index) => {
        console.log(`${index + 1}. "${pair[0]}" ~ "${pair[1]}"`);
      });
    }
    
    // Сохраняем полный список названий для ручной проверки
    console.log(`\n=== СОХРАНЕНИЕ ПОЛНОГО СПИСКА ===`);
    const sortedNames = [...new Set(recipeNames)].sort();
    fs.writeFileSync('recipe_names_check.txt', sortedNames.join('\n'), 'utf8');
    console.log(`💾 Сохранен файл "recipe_names_check.txt" с ${sortedNames.length} уникальными названиями`);
    
  } else {
    console.log('❌ Названия рецептов не найдены');
  }
  
} catch (error) {
  console.error('❌ Ошибка:', error.message);
}
