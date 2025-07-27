/**
 * Система расчета плана питания без участия ИИ
 * Использует только локальную базу данных рецептов
 */

import recipesDB from './recipesDB.js';
import { calculateNutritionByIngredients } from './nutritionData.js';

class MealPlanCalculator {
    constructor() {
        this.recipes = recipesDB;
        // Распределение калорий по приемам пищи (в процентах)
        this.calorieDistribution = {
            'Завтрак': 25,     // 25%
            'Перекус': 10,     // 10%
            'Обед': 35,        // 35%
            'Полдник': 10,     // 10%
            'Ужин': 25         // 25%
        };
        
        // Маппинг типов питания на фильтры рецептов
        this.dietFilters = {
            'meat': ['meat', 'vegetarian_egg', 'vegetarian', 'vegan'],
            'fish': ['fish', 'vegetarian_egg', 'vegetarian', 'vegan'],
            'vegetarian_egg': ['vegetarian_egg', 'vegetarian', 'vegan'],
            'vegetarian': ['vegetarian', 'vegan'],
            'vegan': ['vegan']
        };
    }

    /**
     * Расчет КБЖУ пользователя на основе его данных
     */
    calculateUserMacros(userAnswers) {
        const weight = Number(userAnswers.weight) || Number(userAnswers.weight_kg) || 60;
        const height = Number(userAnswers.height) || Number(userAnswers.height_cm) || 165;
        const age = Number(userAnswers.age) || 30;
        const sex = (userAnswers.gender || userAnswers.sex || 'female').toLowerCase();

        // Единая формула BMR (Harris-Benedict как везде)
        let bmr;
        if (sex === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        // Коэффициент активности
        const activityMap = {
            'low': 1.2,
            'medium': 1.375,
            'high': 1.55,
            'very_high': 1.725
        };
        const activity = userAnswers.activity_level || userAnswers.activity_coef || 'medium';
        const activityCoef = activityMap[activity] || 1.375;

        let calories = Math.round(bmr * activityCoef);

        // Корректировка по цели (дефицит калорий)
        const goal = Number(userAnswers.goal);
        if ([3, 4, 5].includes(goal)) {
            const deficit = goal * 7700 / 30; // дефицит калорий в день
            calories = Math.round(calories - deficit);
        }

        // Минимум 1400 ккал для всех (единая политика)
        calories = Math.max(1400, calories);

        // Расчет белков, жиров, углеводов (единая формула)
        const protein = Math.round(weight * 1.5); // Исправлено: была 1.7, теперь 1.5 как везде
        const fat = Math.round(weight * 0.9);
        const carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);

        return {
            calories,
            protein: Math.max(0, protein),
            fat: Math.max(0, fat),
            carbs: Math.max(0, carbs)
        };
    }

    /**
     * Распределение калорий по приемам пищи
     */
    distributeMealCalories(totalCalories) {
        const distribution = {};
        
        for (const [mealType, percentage] of Object.entries(this.calorieDistribution)) {
            distribution[mealType] = Math.round(totalCalories * percentage / 100);
        }
        
        return distribution;
    }

    /**
     * Фильтрация рецептов по типу питания
     */
    filterRecipesByDiet(recipes, dietType) {
        const allowedDiets = this.dietFilters[dietType] || ['vegan'];
        return recipes.filter(recipe => 
            allowedDiets.includes(recipe.dietType) || !recipe.dietType
        );
    }

    /**
     * Подбор рецепта по калориям с учетом разнообразия
     */
    selectRecipeByCalories(recipes, targetCalories, usedRecipes = [], tolerance = 50) {
        // Исключаем уже использованные рецепты
        const availableRecipes = recipes.filter(recipe => 
            !usedRecipes.some(used => used.name === recipe.name)
        );

        if (availableRecipes.length === 0) {
            return recipes[Math.floor(Math.random() * recipes.length)];
        }

        // Сортируем по близости к целевой калорийности
        const sortedRecipes = availableRecipes.sort((a, b) => {
            const diffA = Math.abs(a.calories - targetCalories);
            const diffB = Math.abs(b.calories - targetCalories);
            return diffA - diffB;
        });

        // Берем несколько лучших вариантов для разнообразия
        const bestRecipes = sortedRecipes.slice(0, 3);
        return bestRecipes[Math.floor(Math.random() * bestRecipes.length)];
    }

    /**
     * Масштабирование рецепта под целевые калории
     */
    scaleRecipeToTarget(recipe, targetCalories) {
        const scale = targetCalories / recipe.calories;
        
        return {
            ...recipe,
            calories: Math.round(recipe.calories * scale),
            protein: Math.round(recipe.protein * scale * 10) / 10,
            fat: Math.round(recipe.fat * scale * 10) / 10,
            carbs: Math.round(recipe.carbs * scale * 10) / 10,
            ingredients: recipe.ingredients.map(ing => ({
                ...ing,
                amount: Math.round(ing.amount * scale * 10) / 10
            }))
        };
    }

    /**
     * Масштабирование ингредиентов блюда под целевую калорийность
     */
    scaleRecipeToCalories(recipe, targetCalories) {
        if (!recipe || !recipe.ingredients || !recipe.calories || recipe.calories === 0) return recipe;
        const scale = targetCalories / recipe.calories;
        const scaledIngredients = recipe.ingredients.map(ing => ({
            ...ing,
            amount: Math.round(ing.amount * scale * 10) / 10 // округление до 0.1
        }));
        // Пересчитываем БЖУ
        let newNutrition = { calories: 0, protein: 0, fat: 0, carbs: 0 };
        try {
            newNutrition = calculateNutritionByIngredients(scaledIngredients);
        } catch (e) {
            // fallback если что-то не так
            newNutrition = {
                calories: Math.round(recipe.calories * scale),
                protein: Math.round((recipe.protein || 0) * scale * 10) / 10,
                fat: Math.round((recipe.fat || 0) * scale * 10) / 10,
                carbs: Math.round((recipe.carbs || 0) * scale * 10) / 10
            };
        }
        return {
            ...recipe,
            ingredients: scaledIngredients,
            calories: newNutrition.calories,
            protein: newNutrition.protein,
            fat: newNutrition.fat,
            carbs: newNutrition.carbs
        };
    }

    /**
     * Подбор любых блюд по типу и диете, затем масштабирование под нужные калории
     */
    getMealOptionsByTypeAndDiet(mealType, dietType, targetCalories, count = 5) {
        const allRecipes = this.filterRecipesByDiet(
            this.recipes[mealType.toLowerCase()] || [],
            dietType
        );
        // Берем любые (рандомно), затем масштабируем
        const shuffled = allRecipes.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map(r => this.scaleRecipeToCalories(r, targetCalories));
    }

    /**
     * Маппинг типов приемов пищи на ключи в базе рецептов
     */
    getMealTypeKey(mealType) {
        const mapping = {
            'Завтрак': 'breakfast',
            'Перекус': 'snacks',
            'Обед': 'lunch',
            'Полдник': 'afternoon_snacks',
            'Ужин': 'dinner'
        };
        return mapping[mealType] || 'breakfast';
    }

    /**
     * Генерация плана питания на день (упрощенная версия)
     */
    generateDayPlan(userAnswers, usedRecipes = {}) {
        const macros = this.calculateUserMacros(userAnswers);
        const calorieDistribution = this.distributeMealCalories(macros.calories);
        const dietType = userAnswers.diet_flags || 'meat';
        
        const meals = [];
        const mealTypes = ['Завтрак', 'Перекус', 'Обед', 'Полдник', 'Ужин'];
        for (const mealType of mealTypes) {
            const targetCalories = calorieDistribution[mealType];
            // Используем упрощенную версию - генерируем только 1 вариант
            const options = this.getMealOptionsByTypeAndDiet(
                mealType, 
                dietType, 
                targetCalories, 
                1 // Только 1 вариант вместо 5
            );
            if (options.length > 0) {
                meals.push({
                    type: mealType,
                    options: options,
                    targetCalories: targetCalories,
                    selectedOption: 0
                });
                if (!usedRecipes[mealType]) {
                    usedRecipes[mealType] = [];
                }
                usedRecipes[mealType].push(options[0]);
            }
        }
        // === ОТЛАДКА: выводим сумму калорий всех приёмов пищи и целевое значение ===
        const totalDayCalories = meals.reduce((sum, meal) => sum + (meal.options[0]?.calories || 0), 0);
        console.log('[DEBUG] Сумма калорий всех приёмов пищи за день:', totalDayCalories, 'Целевая:', macros.calories);
        meals.forEach(m => console.log(`[DEBUG] ${m.type}:`, m.options[0]?.calories, 'target:', m.targetCalories));
        
        return {
            meals,
            totalCalories: macros.calories,
            macros,
            usedRecipes
        };
    }

    /**
     * Генерация плана питания на неделю
     */
    generateWeekPlan(userAnswers) {
        const weekPlan = [];
        const globalUsedRecipes = {};
        
        for (let day = 1; day <= 7; day++) {
            const dayPlan = this.generateDayPlan(userAnswers, globalUsedRecipes);
            weekPlan.push({
                day,
                date: this.getDateString(day),
                ...dayPlan
            });
        }
        
        return weekPlan;
    }

    /**
     * Получение строки даты для дня
     */
    getDateString(dayOffset = 0) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset - 1);
        return date.toISOString().split('T')[0];
    }
}

export default new MealPlanCalculator();
