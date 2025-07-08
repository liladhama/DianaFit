const recipesDB = require('./backend/utils/recipesDB.js');

// Функция для извлечения всех названий рецептов
function extractAllRecipeNames() {
  const allRecipes = [];
  
  // Извлекаем рецепты из всех категорий
  const categories = ['breakfast', 'lunch', 'snack', 'afternoonSnack', 'dinner'];
  
  categories.forEach(category => {
    if (recipesDB[category] && Array.isArray(recipesDB[category])) {
      recipesDB[category].forEach(recipe => {
        if (recipe.name) {
          allRecipes.push({
            name: recipe.name,
            category: category
          });
        }
      });
    }
  });
  
  return allRecipes;
}

try {
  const allRecipes = extractAllRecipeNames();
  
  console.log('=== СПИСОК ВСЕХ РЕЦЕПТОВ В БАЗЕ ===');
  console.log(`Общее количество: ${allRecipes.length}`);
  console.log('\n=== РЕЦЕПТЫ ПО КАТЕГОРИЯМ ===\n');
  
  // Группируем по категориям
  const groupedByCategory = {};
  allRecipes.forEach(recipe => {
    if (!groupedByCategory[recipe.category]) {
      groupedByCategory[recipe.category] = [];
    }
    groupedByCategory[recipe.category].push(recipe.name);
  });
  
  // Выводим по категориям
  Object.keys(groupedByCategory).forEach(category => {
    console.log(`${category.toUpperCase()} (${groupedByCategory[category].length} рецептов):`);
    groupedByCategory[category].forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    console.log('');
  });
  
  // Выводим простой список всех названий для сравнения
  console.log('\n=== ПРОСТОЙ СПИСОК ВСЕХ НАЗВАНИЙ ===');
  const uniqueNames = [...new Set(allRecipes.map(r => r.name))];
  uniqueNames.sort().forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  
} catch (error) {
  console.error('Ошибка при извлечении рецептов:', error);
}
