const fs = require('fs');
const path = require('path');

// Читаем файл recipesDB.js как текст
const recipesFilePath = path.join(__dirname, 'backend', 'utils', 'recipesDB.js');
const recipesContent = fs.readFileSync(recipesFilePath, 'utf8');

// Извлекаем все названия рецептов из файла
function extractRecipeNamesFromText(content) {
  const names = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    // Ищем строки с name: "название"
    const nameMatch = line.match(/^\s*name:\s*["']([^"']+)["']/);
    if (nameMatch) {
      names.push(nameMatch[1]);
    }
  });
  
  return names;
}

// Список рецептов от пользователя
const userRecipesList = [
  "Авокадо-тост с яйцом",
  "Банановый смузи с овсянкой",
  "Блинчики из овсяной муки с ягодами",
  "Гранола с греческим йогуртом",
  "Завтрак из киноа с фруктами",
  "Каша из семян чиа с миндальным молоком",
  "Маффины с черникой (цельнозерновые)",
  "Омлет с грибами и шпинатом",
  "Омлет с овощами",
  "Овсянка с бананом и орехами",
  "Овсянка с ягодами",
  "Панкейки из банана и яиц",
  "Сырники с йогуртом",
  "Тост с авокадо и помидорами",
  "Фруктовый салат с творогом",
  "Хлебцы с творожным сыром и зеленью",
  "Творожная запеканка",
  "Яичница с овощами и зеленью",
  "Йогурт с гранолой и ягодами",
  "Смузи-боул с ягодами и орехами",
  "Запеченные яйца с овощами",
  "Каша из киноа с ягодами",
  "Тост с арахисовой пастой и бананом",
  "Французские тосты из цельнозернового хлеба",
  "Яблочные оладьи"
];

try {
  const existingRecipes = extractRecipeNamesFromText(recipesContent);
  
  console.log('=== АНАЛИЗ РЕЦЕПТОВ ===');
  console.log(`Рецептов в базе: ${existingRecipes.length}`);
  console.log(`Рецептов в списке пользователя: ${userRecipesList.length}`);
  console.log('');
  
  console.log('=== РЕЦЕПТЫ В БАЗЕ ===');
  existingRecipes.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  console.log('');
  
  // Сравниваем списки
  const missingRecipes = userRecipesList.filter(userRecipe => {
    return !existingRecipes.some(existingRecipe => 
      existingRecipe.toLowerCase().trim() === userRecipe.toLowerCase().trim()
    );
  });
  
  const existingInBoth = userRecipesList.filter(userRecipe => {
    return existingRecipes.some(existingRecipe => 
      existingRecipe.toLowerCase().trim() === userRecipe.toLowerCase().trim()
    );
  });
  
  console.log('=== РЕЦЕПТЫ УЖЕ ЕСТЬ В БАЗЕ ===');
  if (existingInBoth.length > 0) {
    existingInBoth.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
  } else {
    console.log('Нет совпадений');
  }
  console.log('');
  
  console.log('=== РЕЦЕПТЫ ОТСУТСТВУЮТ В БАЗЕ ===');
  if (missingRecipes.length > 0) {
    missingRecipes.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
  } else {
    console.log('Все рецепты уже есть в базе');
  }
  
  console.log('');
  console.log('=== СТАТИСТИКА ===');
  console.log(`Уже в базе: ${existingInBoth.length}`);
  console.log(`Отсутствуют: ${missingRecipes.length}`);
  
} catch (error) {
  console.error('Ошибка при анализе:', error);
}
