/**
 * Утилиты для работы с рецептами и планом питания
 */

import { recipesDB } from './recipesDB.js';
import { callMistralAI } from './aiUtils.js';
import { ingredientCalories } from './ingredientCalories.js';

// Маппинг типовых весов (граммы) для овощей, фруктов, зелени
const TYPICAL_WEIGHTS = {
    'помидор': 100,
    'помидоры': 100,
    'помидоры черри': 15,
    'огурец': 120,
    'морковь': 80,
    'болгарский перец': 120,
    'перец': 120,
    'яблоко': 150,
    'банан': 120,
    'лимон': 100,
    'лук репчатый': 80,
    'лук': 80,
    'лук зеленый': 10,
    'чеснок': 5,
    'зубчик чеснока': 5,
    'стебель сельдерея': 40,
    'сельдерей': 40,
    'шпинат': 30,
    'шпинат свежий': 30,
    'укроп': 5,
    'петрушка': 5,
    'руккола': 5,
    'зелень': 5,
    'базилик свежий': 5,
    'микрозелень': 5,
    'баклажан': 120,
    'цукини': 120,
    'тыква': 200,
    'грибы': 70,
    'шампиньоны': 70,
    'лист салата': 10,
    'листья салата': 10
};

// Список ключевых слов для овощей/фруктов/зелени
const GRAM_INGREDIENTS = [
    'помидор', 'помидоры', 'помидоры черри', 'огурец', 'морковь', 'болгарский перец', 'перец', 'яблоко', 'банан', 'лимон',
    'лук', 'лук репчатый', 'лук зеленый', 'чеснок', 'зубчик чеснока', 'сельдерей', 'стебель сельдерея', 'шпинат', 'шпинат свежий',
    'укроп', 'петрушка', 'руккола', 'зелень', 'базилик свежий', 'микрозелень', 'баклажан', 'цукини', 'тыква', 'грибы', 'шампиньоны',
    'лист салата', 'листья салата'
];

// Дополнительные типовые веса для нестандартных unit
const EXTRA_UNIT_WEIGHTS = {
    'кусочек': 35, // хлеб
    'ломтик': 20,
    'стебель': 40,
    'зубчик': 5,
    'щепотка': 1,
    'ч.л.': 5,
    'ст.л.': 15
};

// Список специй и приправ для автоматической нормализации
const SPICES = [
  'соль', 'соль, перец', 'черный перец', 'паприка', 'корица', 'зира', 'тимьян', 'мускатный орех', 'перец чили', 'розмарин', 'базилик', 'укроп', 'петрушка', 'горчица', 'карри', 'куркума', 'приправа', 'специи'
];

function normalizeIngredientUnits(ingredient) {
    const name = ingredient.name.toLowerCase();
    const isGramType = GRAM_INGREDIENTS.some(key => name.includes(key));
    let unit = ingredient.unit;
    let amount = Number(ingredient.amount);
    // 0. Автоматическая нормализация специй и приправ
    if (SPICES.some(spice => name.includes(spice))) {
        // Если количество больше 10 г или не указано, ограничиваем до 1-5 г
        if (!unit || unit === 'г' || unit === 'гр' || unit === 'грамм' || unit === 'grams') {
            if (isNaN(amount) || amount > 10 || amount <= 0) amount = 3;
            return { ...ingredient, amount, unit: 'г' };
        }
        // Если указана ложка/щепотка — оставляем, но не больше 5 г
        if (unit === 'ч.л.' || unit === 'ст.л.' || unit === 'щепотка') {
            if (isNaN(amount) || amount > 5 || amount <= 0) amount = 1;
            return { ...ingredient, amount, unit };
        }
    }
    // 1. Конвертация "шт", "кусочек", "ломтик", "стебель", "зубчик" и т.п. в граммы
    if (isGramType && unit && unit !== 'г') {
        // Определяем типовой вес
        let typicalWeight = 0;
        for (const key in TYPICAL_WEIGHTS) {
            if (name.includes(key)) {
                typicalWeight = TYPICAL_WEIGHTS[key];
                break;
            }
        }
        // Если не найдено — ищем по unit
        if (!typicalWeight && EXTRA_UNIT_WEIGHTS[unit]) {
            typicalWeight = EXTRA_UNIT_WEIGHTS[unit];
        }
        if (!typicalWeight) typicalWeight = 50; // fallback
        if (isNaN(amount) || amount === 0) amount = 1;
        const grams = Math.round(amount * typicalWeight);
        return { ...ingredient, amount: grams < 5 ? 5 : grams, unit: 'г' };
    }
    // 2. Если unit уже 'г', но amount подозрительно мал (<10 г для овощей/фруктов/зелени), исправляем на типовой вес
    if (isGramType && unit === 'г' && amount > 0 && amount < 10) {
        let typicalWeight = 0;
        for (const key in TYPICAL_WEIGHTS) {
            if (name.includes(key)) {
                typicalWeight = TYPICAL_WEIGHTS[key];
                break;
            }
        }
        if (!typicalWeight) typicalWeight = 50;
        return { ...ingredient, amount: typicalWeight, unit: 'г' };
    }
    // 3. Для хлеба и других продуктов с unit: 'кусочек', 'ломтик' и т.п.
    if ((unit === 'кусочек' || unit === 'ломтик') && (name.includes('хлеб') || name.includes('батон'))) {
        let typicalWeight = EXTRA_UNIT_WEIGHTS[unit] || 30;
        if (isNaN(amount) || amount === 0) amount = 1;
        const grams = Math.round(amount * typicalWeight);
        return { ...ingredient, amount: grams, unit: 'г' };
    }
    return ingredient;
}

function normalizeRecipeIngredients(recipe) {
    if (!recipe.ingredients) return recipe;
    return {
        ...recipe,
        ingredients: recipe.ingredients.map(normalizeIngredientUnits)
    };
}

// Применяем нормализацию к базе рецептов при инициализации
const normalizedRecipesDB = {};
for (const type in recipesDB) {
    normalizedRecipesDB[type] = recipesDB[type].map(normalizeRecipeIngredients);
}

const recipeUtils = {
    recipes: normalizedRecipesDB,
    ingredientCalories,
    
    getRecipesByType(mealType) {
        const type = mealType.toLowerCase();
        // Для перекуса используем snacks
        if (type === 'перекус') {
            return this.recipes.snacks || [];
        }
        // Для полдника используем afternoon_snacks
        if (type === 'полдник') {
            return this.recipes.afternoon_snacks || [];
        }
        return this.recipes[type] || [];
    },

    findDiverseRecipe(mealType, targetCalories, usedRecipes = [], tolerance = 100) {
        const recipes = this.getRecipesByType(mealType);
        const unusedRecipes = recipes.filter(recipe => 
            !usedRecipes.some(used => 
                used.name.toLowerCase() === recipe.name.toLowerCase() &&
                used.type.toLowerCase() === recipe.type.toLowerCase()
            )
        );
        const suitableRecipes = unusedRecipes.filter(recipe => 
            Math.abs(recipe.calories - targetCalories) <= tolerance
        );
        
        if (suitableRecipes.length === 0 && tolerance < 300) {
            return this.findDiverseRecipe(mealType, targetCalories, usedRecipes, tolerance + 50);
        }
        return suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)] || null;
    },

    async generateUniqueRecipe(mealType, targetCalories, usedIngredients = []) {
        const prompt = `Создай рецепт для ${mealType} примерно на ${targetCalories} калорий.
        Не используй следующие ингредиенты: ${usedIngredients.join(', ')}.
        Формат ответа должен быть в JSON:
        {
            "name": "Название блюда",
            "type": "${mealType}",
            "calories": число,
            "protein": число,
            "fat": число,
            "carbs": число,
            "ingredients": [
                {"name": "ингредиент", "amount": число, "unit": "единица измерения"}
            ],
            "instructions": "пошаговая инструкция",
            "tags": ["тег1", "тег2"]
        }`;

        try {
            const response = await callMistralAI(prompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('Ошибка при генерации рецепта:', error);
            return null;
        }
    },

    async diversifyMealPlan(plan) {
        const planObj = typeof plan === 'string' ? JSON.parse(plan) : plan;
        if (!planObj.weeks || !Array.isArray(planObj.weeks)) return plan;

        for (const week of planObj.weeks) {
            if (!week.days || !Array.isArray(week.days)) continue;

            for (const day of week.days) {
                if (!day.meals || !Array.isArray(day.meals)) continue;

                // Очищаем список использованных рецептов для каждого нового дня
                const usedRecipesByType = {
                    breakfast: [],
                    lunch: [],
                    dinner: [],
                    snack: []
                };

                for (const meal of day.meals) {
                    if (!meal.meal || !meal.type) continue;

                    const mealType = meal.type.toLowerCase();
                    const currentCalories = typeof meal.meal === 'object' ? meal.meal.calories : 300;

                    let newRecipe = this.findDiverseRecipe(
                        mealType,
                        currentCalories,
                        usedRecipesByType[mealType]
                    );

                    if (!newRecipe) {
                        const usedIngredients = usedRecipesByType[mealType]
                            .flatMap(recipe => recipe.ingredients ? recipe.ingredients.map(ing => ing.name) : []);
                        
                        newRecipe = await this.generateUniqueRecipe(
                            mealType,
                            currentCalories,
                            usedIngredients
                        );
                    }

                    if (newRecipe) {
                        meal.meal = newRecipe;
                        usedRecipesByType[mealType].push(newRecipe);
                    }
                }
            }
        }
        return planObj;
    },

    findAlternativeRecipe(mealType, targetCalories, excludeMeals = []) {
        const recipes = this.getRecipesByType(mealType);
        const availableRecipes = recipes.filter(recipe => 
            !excludeMeals.some(excludedName => recipe.name.toLowerCase() === excludedName.toLowerCase())
        );
        
        if (availableRecipes.length === 0) return null;
        
        availableRecipes.sort((a, b) => {
            const diffA = Math.abs(a.calories - targetCalories);
            const diffB = Math.abs(b.calories - targetCalories);
            return diffA - diffB;
        });
        
        return availableRecipes[0];
    },

    async checkAndFixMealDuplicatesWithAlternatives(plan) {
        try {
            // Если plan - это строка, очищаем её от markdown и парсим
            let cleanPlan = plan;
            if (typeof plan === 'string') {
                // Удаляем markdown code block markers и лишние пробелы/переносы строк
                cleanPlan = plan
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .replace(/^\s+|\s+$/g, '');
                
                // Проверяем, начинается ли строка с {
                if (!cleanPlan.startsWith('{')) {
                    const jsonStart = cleanPlan.indexOf('{');
                    if (jsonStart !== -1) {
                        cleanPlan = cleanPlan.substring(jsonStart);
                    }
                }
            }
            let planObj;
            try {
                planObj = JSON.parse(cleanPlan);
            } catch (parseError) {
                console.error('Ошибка парсинга JSON:', parseError);
                console.error('Содержимое после очистки:', cleanPlan);
                throw new Error('Невалидный JSON после очистки от markdown');
            }
            return planObj;
        } catch (error) {
            console.error('❌ Ошибка при исправлении дубликатов:', error);
            return plan;
        }
    }
};

export default recipeUtils;
