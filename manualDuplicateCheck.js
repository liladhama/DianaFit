// Быстрый сбор всех названий рецептов
const fs = require('fs');

const content = fs.readFileSync('./backend/utils/recipesDB.js', 'utf8');

// Извлекаем только строки с названиями рецептов (не ингредиентов)
const lines = content.split('\n');
const recipeNames = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Ищем строки вида: name: "Название рецепта",
  // Но исключаем строки внутри ingredients массивов
  if (line.match(/^\s*name:\s*"[^"]+",?\s*$/)) {
    // Проверяем, что предыдущие 10 строк не содержат "ingredients:"
    let isIngredient = false;
    for (let j = Math.max(0, i - 10); j < i; j++) {
      if (lines[j].includes('ingredients:') && !lines[j].includes(']')) {
        isIngredient = true;
        break;
      }
    }
    
    if (!isIngredient) {
      const nameMatch = line.match(/name:\s*"([^"]+)"/);
      if (nameMatch) {
        recipeNames.push(nameMatch[1]);
      }
    }
  }
}

console.log('=== НАЗВАНИЯ ВСЕХ РЕЦЕПТОВ ===\n');
console.log(`Найдено: ${recipeNames.length} рецептов\n`);

// Проверяем дубликаты
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

if (duplicates.length === 0) {
  console.log('✅ ДУБЛИКАТОВ НЕ НАЙДЕНО!\n');
} else {
  console.log('❌ НАЙДЕНЫ ДУБЛИКАТЫ:\n');
  duplicates.forEach((name, index) => {
    console.log(`${index + 1}. "${name}" - ${nameCount[name]} раз(а)`);
  });
  console.log('');
}

console.log('=== ПОЛНЫЙ СПИСОК РЕЦЕПТОВ ===\n');
recipeNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name}`);
});

// Сохраняем в файл
fs.writeFileSync('all_recipe_names.txt', recipeNames.join('\n'));
console.log('\n✅ Список сохранен в файл "all_recipe_names.txt"');
