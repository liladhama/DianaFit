/**
 * Утилиты для работы с рецептами и планом питания
 */

import recipesDB from './recipesDB.js';
import { callMistralAI } from './aiUtils.js';

const recipeUtils = {
    recipes: recipesDB,
    
    getRecipesByType(mealType) {
        return this.recipes[mealType.toLowerCase()] || [];
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
            
            try {
                const planObj = typeof cleanPlan === 'string' ? JSON.parse(cleanPlan) : cleanPlan;
                
                if (!planObj.weeks || !Array.isArray(planObj.weeks)) {
                    console.log('❌ Неверный формат плана, не удалось найти недели');
                    return plan;
                }
                
                for (const week of planObj.weeks) {
                    if (!week.days || !Array.isArray(week.days)) continue;
                    
                    for (const day of week.days) {
                        if (!day.meals || !Array.isArray(day.meals)) continue;
                        
                        const mealNames = new Set();
                        const mealTypes = {};
                        const usedRecipes = [];
                        
                        for (const meal of day.meals) {
                            if (!meal.meal) continue;
                            
                            const mealName = typeof meal.meal === 'string' 
                                ? meal.meal 
                                : (meal.meal.name || 'Без названия');
                                
                            const mealNameLower = mealName.toLowerCase();
                            
                            if (mealNames.has(mealNameLower)) {
                                console.log(`⚠️ Обнаружен дубликат блюда в дне ${day.day}: "${mealName}"`);
                                
                                const targetCalories = meal.calories || 0;
                                const alternativeRecipe = this.findAlternativeRecipe(
                                    meal.type, 
                                    targetCalories, 
                                    usedRecipes
                                );
            
                                if (alternativeRecipe) {
                                    console.log(`✅ Заменяем дубликат "${mealName}" на "${alternativeRecipe.name}"`);
                                    
                                    if (typeof meal.meal === 'string') {
                                        meal.meal = alternativeRecipe.name;
                                    } else if (meal.meal && typeof meal.meal === 'object') {
                                        meal.meal = alternativeRecipe;
                                    }
                                    
                                    meal.calories = alternativeRecipe.calories;
                                    usedRecipes.push(alternativeRecipe.name);
                                }
                            }
                            
                            if (meal.type) {
                                if (!mealTypes[meal.type]) {
                                    mealTypes[meal.type] = [];
                            }
                            mealTypes[meal.type].push({ name: mealName, calories: meal.calories });
                        }
                        
                        mealNames.add(mealNameLower);
                        usedRecipes.push(mealNameLower);
                    }

                    if (mealTypes['Перекус'] && mealTypes['Полдник'] && 
                        mealTypes['Перекус'].length > 0 && mealTypes['Полдник'].length > 0) {
                        
                        const snacks = mealTypes['Перекус'];
                        const afternoonSnacks = mealTypes['Полдник'];
                        
                        for (const snack of snacks) {
                            for (const afternoonSnack of afternoonSnacks) {
                                if (snack.name.toLowerCase() === afternoonSnack.name.toLowerCase()) {
                                    console.log(`⚠️ Перекус и полдник одинаковые в дне ${day.day}: "${snack.name}"`);
                                    
                                    const alternativeRecipe = this.findAlternativeRecipe(
                                        'Полдник',
                                        afternoonSnack.calories,
                                        usedRecipes
                                    );
                                    
                                    if (alternativeRecipe) {
                                        const mealToUpdate = day.meals.find(m => 
                                            m.type === 'Полдник' && 
                                            (m.meal === afternoonSnack.name || 
                                             (m.meal.name && m.meal.name === afternoonSnack.name))
                                        );
                                        
                                        if (mealToUpdate) {
                                            if (typeof mealToUpdate.meal === 'string') {
                                                mealToUpdate.meal = alternativeRecipe.name;
                                            } else {
                                                mealToUpdate.meal = alternativeRecipe;
                                            }
                                            mealToUpdate.calories = alternativeRecipe.calories;
                                            console.log(`✅ Заменили полдник на "${alternativeRecipe.name}"`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
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
