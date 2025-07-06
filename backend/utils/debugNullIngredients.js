// Скрипт для отладки: выводит ингредиенты, которые не найдены в ingredientCalories.js для каждого блюда
import { recipesDB } from './recipesDB.js';
import { ingredientCalories } from './ingredientCalories.js';

function checkRecipe(recipe) {
  const missing = [];
  (recipe.ingredients || []).forEach(ing => {
    const key = ing.name.trim().toLowerCase();
    if (!ingredientCalories[key]) missing.push(ing.name);
  });
  return missing;
}

for (const [type, arr] of Object.entries(recipesDB)) {
  arr.forEach(recipe => {
    const missing = checkRecipe(recipe);
    if (missing.length > 0) {
      console.log(`❌ ${recipe.name} (${type}):`);
      missing.forEach(ing => console.log('   -', ing));
    }
  });
}
console.log('Проверка завершена.');
