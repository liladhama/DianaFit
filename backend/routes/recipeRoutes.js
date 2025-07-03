import express from 'express';
import recipeUtils from '../utils/recipeUtils.js';
import { callMistralAI } from '../utils/aiUtils.js';

const router = express.Router();

// Эндпоинт для генерации рецепта по запросу
router.post('/generate-recipe', async (req, res) => {
  try {
    const { query, mealType, targetCalories } = req.body;
    
    if (!query || !mealType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать запрос и тип приема пищи' 
      });
    }
    
    // Пытаемся найти рецепт в нашей базе
    const recipe = recipeUtils.generateRecipe(
      query, 
      mealType, 
      targetCalories || 200
    );
    
    if (recipe) {
      return res.json({ 
        success: true, 
        recipe 
      });
    }
    
    // Если рецепт не найден в базе, пытаемся использовать AI для генерации
    const prompt = `Создай уникальный рецепт для приема пищи "${mealType}" на основе запроса "${query}". 
    Рецепт должен содержать примерно ${targetCalories || 200} ккал. 
    Включи название, ингредиенты с указанием граммовки, КБЖУ и краткий способ приготовления.`;
    
    // Отправляем запрос к AI для получения рецепта
    const messages = [
      { role: "system", content: "Ты эксперт по питанию и рецептам с акцентом на здоровую пищу." },
      { role: "user", content: prompt }
    ];
    
    const aiResponse = await callMistralAI(messages);
    
    // Форматируем ответ AI в структуру рецепта
    const generatedRecipe = {
      name: extractRecipeName(aiResponse),
      type: mealType,
      calories: targetCalories || extractCalories(aiResponse) || 200,
      protein: extractProtein(aiResponse) || 0,
      fat: extractFat(aiResponse) || 0,
      carbs: extractCarbs(aiResponse) || 0,
      ingredients: extractIngredients(aiResponse),
      instructions: extractInstructions(aiResponse),
      tags: extractTags(aiResponse)
    };
    
    return res.json({ 
      success: true, 
      recipe: generatedRecipe,
      isAiGenerated: true
    });
    
  } catch (error) {
    console.error('Ошибка при генерации рецепта:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Не удалось сгенерировать рецепт',
      details: error.message
    });
  }
});

// Функции для извлечения информации из текста рецепта, сгенерированного AI
function extractRecipeName(text) {
  // Пытаемся найти название в первых строках
  const lines = text.split('\n');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line && !line.toLowerCase().includes('ингредиенты') && !line.toLowerCase().includes('рецепт')) {
      return line;
    }
  }
  return 'Рецепт без названия';
}

function extractCalories(text) {
  const caloriesMatch = text.match(/(\d+)\s*ккал/i);
  return caloriesMatch ? parseInt(caloriesMatch[1]) : null;
}

function extractProtein(text) {
  const proteinMatch = text.match(/белки:?\s*(\d+)/i) || text.match(/протеин:?\s*(\d+)/i);
  return proteinMatch ? parseInt(proteinMatch[1]) : null;
}

function extractFat(text) {
  const fatMatch = text.match(/жиры:?\s*(\d+)/i);
  return fatMatch ? parseInt(fatMatch[1]) : null;
}

function extractCarbs(text) {
  const carbsMatch = text.match(/углеводы:?\s*(\d+)/i);
  return carbsMatch ? parseInt(carbsMatch[1]) : null;
}

function extractIngredients(text) {
  const ingredients = [];
  let inIngredientsSection = false;
  
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toLowerCase().includes('ингредиенты')) {
      inIngredientsSection = true;
      continue;
    }
    
    if (inIngredientsSection) {
      if (trimmedLine.toLowerCase().includes('приготовление') || 
          trimmedLine.toLowerCase().includes('инструкции') || 
          trimmedLine === '') {
        inIngredientsSection = false;
        continue;
      }
      
      // Попытка извлечь ингредиент и его количество
      const match = trimmedLine.match(/([^0-9]+)\s*[-–]\s*(\d+)\s*([а-яА-Я]+)/);
      if (match) {
        ingredients.push({
          name: match[1].trim(),
          amount: parseInt(match[2]),
          unit: match[3].trim()
        });
      } else if (trimmedLine) {
        // Если формат не соответствует, но строка не пустая
        ingredients.push({
          name: trimmedLine,
          amount: null,
          unit: 'по вкусу'
        });
      }
    }
  }
  
  return ingredients;
}

function extractInstructions(text) {
  let instructions = '';
  let inInstructionsSection = false;
  
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toLowerCase().includes('приготовление') || 
        trimmedLine.toLowerCase().includes('инструкции') || 
        trimmedLine.toLowerCase().includes('способ приготовления')) {
      inInstructionsSection = true;
      continue;
    }
    
    if (inInstructionsSection && trimmedLine) {
      instructions += trimmedLine + ' ';
    }
  }
  
  return instructions.trim();
}

function extractTags(text) {
  const commonTags = [
    'белковое', 'сытное', 'вегетарианское', 'веганское', 'низкокалорийное',
    'быстро', 'диетическое', 'легкое', 'полезное', 'богато клетчаткой'
  ];
  
  const tags = [];
  for (const tag of commonTags) {
    if (text.toLowerCase().includes(tag.toLowerCase())) {
      tags.push(tag);
    }
  }
  
  return tags;
}

export default router;
