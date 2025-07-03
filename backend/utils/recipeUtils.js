/**
 * Утилиты для работы с рецептами и планом питания
 */

import recipesDB from './recipesDB.js';
import { callMistralAI } from './aiUtils.js';

class RecipeUtils {
    constructor() {
        this.recipes = recipesDB;
    }

    /**
     * Возвращает рецепты по типу приема пищи
     * @param {string} mealType - Тип приема пищи
     * @returns {Array} - Массив рецептов
     */
    getRecipesByType(mealType) {
        return this.recipes[mealType.toLowerCase()] || [];
    }
    /**
     * Находит альтернативный рецепт с похожей калорийностью
     * @param {string} mealType - Тип приема пищи
     * @param {number} targetCalories - Целевая калорийность
     * @param {Array} excludeMeals - Названия блюд, которые нужно исключить
     * @returns {Object} - Альтернативный рецепт
     */
    findAlternativeRecipe(mealType, targetCalories, excludeMeals = []) {
        // Получаем все рецепты по типу
        const recipes = this.getRecipesByType(mealType);
        
        // Исключаем блюда из excludeMeals
        const availableRecipes = recipes.filter(recipe => 
            !excludeMeals.some(excludedName => 
                recipe.name.toLowerCase() === excludedName.toLowerCase()
            )
        );
        
        if (availableRecipes.length === 0) {
            return null;
        }
        
        // Сортируем по близости к целевой калорийности
        availableRecipes.sort((a, b) => {
            const diffA = Math.abs(a.calories - targetCalories);
            const diffB = Math.abs(b.calories - targetCalories);
            return diffA - diffB;
        });
        
        // Возвращаем наиболее подходящий рецепт
        return availableRecipes[0];
    }

/**
 * Проверяет и исправляет дубликаты в плане питания, заменяя их на альтернативные рецепты
 * @param {Object} plan - План питания
 * @returns {Object} - Исправленный план питания
 */
    /**
     * Проверяет и исправляет дубликаты в плане питания, заменяя их на альтернативные рецепты
     * @param {Object} plan - План питания
     * @returns {Object} - Исправленный план питания
     */
    async checkAndFixMealDuplicatesWithAlternatives(plan) {
        try {
            // Пытаемся распарсить план, если он в виде строки
            const planObj = typeof plan === 'string' ? JSON.parse(plan) : plan;
            
            if (!planObj.weeks || !Array.isArray(planObj.weeks)) {
                console.log('❌ Неверный формат плана, не удалось найти недели');
                return plan; // Возвращаем исходный план, если формат неверный
            }
            
            // Перебираем все недели
            for (const week of planObj.weeks) {
                if (!week.days || !Array.isArray(week.days)) continue;
                
                // Перебираем все дни в неделе
                for (const day of week.days) {
                    if (!day.meals || !Array.isArray(day.meals)) continue;
                    
                    // Создаем множество для отслеживания блюд в текущем дне
                    const mealNames = new Set();
                    const mealTypes = {};
                    const usedRecipes = [];
                    
                    // Проверяем наличие дубликатов в текущем дне
                    for (const meal of day.meals) {
                        if (!meal.meal) continue;
                        
                        const mealName = typeof meal.meal === 'string' 
                            ? meal.meal 
                            : (meal.meal.name || 'Без названия');
                            
                        const mealNameLower = mealName.toLowerCase();
                        
                        // Проверяем, есть ли уже такое блюдо в этом дне
                        if (mealNames.has(mealNameLower)) {
                            console.log(`⚠️ Обнаружен дубликат блюда в дне ${day.day}: "${mealName}"`);
                            
                            // Находим калорийность текущего блюда для подбора альтернативы
                            const targetCalories = meal.calories || 0;
                            
                            // Находим альтернативный рецепт
                            const alternativeRecipe = this.findAlternativeRecipe(
                                meal.type, 
                                targetCalories, 
                                usedRecipes
                            );
            
            if (alternativeRecipe) {
              console.log(`✅ Заменяем дубликат "${mealName}" на "${alternativeRecipe.name}"`);
              
              // Заменяем блюдо на альтернативное
              if (typeof meal.meal === 'string') {
                meal.meal = alternativeRecipe.name;
              } else if (meal.meal && typeof meal.meal === 'object') {
                meal.meal.name = alternativeRecipe.name;
                
                // Если есть ингредиенты, заменяем их тоже
                if (alternativeRecipe.ingredients) {
                  meal.meal.ingredients = alternativeRecipe.ingredients;
                }
              }
              
              // Обновляем калорийность
              meal.calories = alternativeRecipe.calories;
              
              // Добавляем в список использованных рецептов
              usedRecipes.push(alternativeRecipe.name);
            } else {
              // Если альтернативу не нашли, просто переименовываем
              const newMealName = `${mealName} (вариант ${index + 1})`;
              
              if (typeof meal.meal === 'string') {
                meal.meal = newMealName;
              } else if (meal.meal && typeof meal.meal === 'object') {
                meal.meal.name = newMealName;
              }
              
              console.log(`⚠️ Не найдены альтернативы, переименовано в "${newMealName}"`);
            }
          }
          
          // Отслеживаем типы приемов пищи
          if (meal.type) {
            if (!mealTypes[meal.type]) {
              mealTypes[meal.type] = [];
            }
            mealTypes[meal.type].push({index, name: mealName, calories: meal.calories});
          }
          
          // Добавляем название блюда в множество (в нижнем регистре для сравнения)
          mealNames.add(mealNameLower);
          usedRecipes.push(mealNameLower);
        }
        
        // Особая проверка для перекусов и полдников
        if (mealTypes['Перекус'] && mealTypes['Полдник'] && 
            mealTypes['Перекус'].length === 1 && mealTypes['Полдник'].length === 1) {
          
          const snack = mealTypes['Перекус'][0];
          const afternoonSnack = mealTypes['Полдник'][0];
          
          // Если перекус и полдник одинаковые
          if (snack.name.toLowerCase() === afternoonSnack.name.toLowerCase()) {
            console.log(`⚠️ Перекус и полдник одинаковые в дне ${day.day}: "${snack.name}"`);
            
            // Находим альтернативный рецепт для полдника
            const alternativeRecipe = findAlternativeRecipe(
              'Полдник', 
              afternoonSnack.calories || 200, 
              [snack.name, ...usedRecipes]
            );
            
            if (alternativeRecipe) {
              console.log(`✅ Заменяем полдник "${afternoonSnack.name}" на "${alternativeRecipe.name}"`);
              
              // Заменяем полдник на альтернативный рецепт
              const meal = day.meals[afternoonSnack.index];
              
              if (typeof meal.meal === 'string') {
                meal.meal = alternativeRecipe.name;
              } else if (meal.meal && typeof meal.meal === 'object') {
                meal.meal.name = alternativeRecipe.name;
                
                // Если есть ингредиенты, заменяем их тоже
                if (alternativeRecipe.ingredients) {
                  meal.meal.ingredients = alternativeRecipe.ingredients;
                }
              }
              
              // Обновляем калорийность
              meal.calories = alternativeRecipe.calories;
            } else {
              // Если альтернативу не нашли, просто переименовываем
              const meal = day.meals[afternoonSnack.index];
              
              if (typeof meal.meal === 'string') {
                meal.meal = `${meal.meal} (альтернативный вариант)`;
              } else if (meal.meal && typeof meal.meal === 'object') {
                meal.meal.name = `${meal.meal.name} (альтернативный вариант)`;
              }
              
              console.log(`⚠️ Не найдены альтернативы для полдника, просто переименовано`);
            }
          }
        }
      });
    });
    
    // Возвращаем исправленный план
    return typeof plan === 'string' ? JSON.stringify(planObj) : planObj;
    
  } catch (error) {
    console.error('❌ Ошибка при проверке дубликатов блюд:', error);
    return plan; // В случае ошибки возвращаем исходный план
  }
}

/**
 * Генерирует рецепт по запросу и калорийности
 * @param {string} query - Запрос пользователя
 * @param {string} mealType - Тип приема пищи
 * @param {number} targetCalories - Целевая калорийность
 * @returns {Object} - Сгенерированный рецепт
 */
function generateRecipe(query, mealType, targetCalories) {
  // Ищем подходящие рецепты по типу
  const recipes = getRecipesByType(mealType);
  
  if (recipes.length === 0) {
    return null;
  }
  
  // Фильтруем по ключевым словам в запросе
  let filteredRecipes = recipes;
  
  // Проверяем ключевые слова в запросе
  const keywords = [
    'вегетарианский', 'мясной', 'рыбный', 'быстрый', 
    'белковый', 'низкокалорийный', 'вкусный', 'легкий'
  ];
  
  const queryLower = query.toLowerCase();
  
  // Фильтруем по ключевым словам
  keywords.forEach(keyword => {
    if (queryLower.includes(keyword.toLowerCase())) {
      const relatedTags = getRelatedTags(keyword);
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.tags && recipe.tags.some(tag => 
          relatedTags.some(relatedTag => tag.includes(relatedTag))
        )
      );
    }
  });
  
  // Если после фильтрации ничего не осталось, возвращаемся к полному списку
  if (filteredRecipes.length === 0) {
    filteredRecipes = recipes;
  }
  
  // Сортируем по близости к целевой калорийности
  filteredRecipes.sort((a, b) => {
    const diffA = Math.abs(a.calories - targetCalories);
    const diffB = Math.abs(b.calories - targetCalories);
    return diffA - diffB;
  });
  
  // Возвращаем наиболее подходящий рецепт
  return filteredRecipes[0];
}

/**
 * Получает связанные теги по ключевому слову
 * @param {string} keyword - Ключевое слово
 * @returns {Array} - Массив связанных тегов
 */
function getRelatedTags(keyword) {
  const tagMapping = {
    'вегетарианский': ['вегетарианское', 'веганское', 'растительный белок'],
    'мясной': ['белковое', 'мясное', 'сытное'],
    'рыбный': ['рыбное', 'богато омега-3', 'белковое'],
    'быстрый': ['быстро', 'без готовки', 'простое'],
    'белковый': ['белковое', 'для спортсменов', 'энергетическое'],
    'низкокалорийный': ['низкокалорийное', 'диетическое', 'легкое'],
    'вкусный': ['сытное', 'классика', 'десерт'],
    'легкий': ['легкое', 'низкокалорийное', 'витаминное']
  };
  
  return tagMapping[keyword] || [keyword];
}

export { RecipeUtils };
