import { calculateNutritionByIngredients, convertToGrams } from './nutritionData.js';

// Проверим конкретный рецепт карри
const karri = {
    name: "Карри из нута с картофелем и шпинатом",
    type: "Ужин",
    dietType: "vegan",
    calories: 570, // AI версия
    protein: 12,
    fat: 10,
    carbs: 54,
    ingredients: [
        { name: "Нут отварной", amount: 160, unit: "г" },
        { name: "Картофель", amount: 205, unit: "г" },
        { name: "Шпинат свежий", amount: 80, unit: "г" },
        { name: "Кокосовое молоко", amount: 125, unit: "мл" },
        { name: "Лук репчатый", amount: 65, unit: "г" },
        { name: "Чеснок", amount: 15, unit: "г" },
        { name: "Паста карри", amount: 0, unit: "ч.л." }, // 0 ч.л. странно
        { name: "Оливковое масло", amount: 15, unit: "мл" }
    ]
};

console.log('=== ПРОВЕРКА РЕЦЕПТА КАРРИ ===');
console.log('Заявленные калории:', karri.calories);

const calculated = calculateNutritionByIngredients(karri.ingredients);
console.log('Рассчитанные калории:', calculated.calories);
console.log('Рассчитанные БЖУ:', {
    protein: calculated.protein,
    fat: calculated.fat,
    carbs: calculated.carbs
});
console.log('Общий вес:', calculated.totalGrams, 'г');

console.log('\n=== ДЕТАЛЬНЫЙ РАСЧЁТ ===');
karri.ingredients.forEach(ingredient => {
    console.log(`${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`);
});
