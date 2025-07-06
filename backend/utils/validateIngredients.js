// Скрипт для проверки соответствия ингредиентов в рецептах справочнику калорийности
import { recipesDB } from './recipesDB.js';
import { ingredientCalories } from './ingredientCalories.js';

function getAllIngredients(recipes) {
  const all = new Set();
  Object.values(recipes).forEach(arr => {
    arr.forEach(r => {
      (r.ingredients || []).forEach(ing => {
        all.add(ing.name.trim().toLowerCase());
      });
    });
  });
  return Array.from(all);
}

function getMissingIngredients() {
  const allIngredients = getAllIngredients(recipesDB);
  const calorieKeys = Object.keys(ingredientCalories).map(k => k.trim().toLowerCase());
  return allIngredients.filter(name => !calorieKeys.includes(name));
}

const missing = getMissingIngredients();
if (missing.length === 0) {
  console.log('✅ Все ингредиенты из рецептов есть в справочнике калорийности.');
} else {
  console.log('❌ Не найдены в ingredientCalories.js:');
  missing.forEach(name => console.log('-', name));
}
