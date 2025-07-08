// Полный список рецептов из базы (extracted from grep_search)
const recipesInDB = [
  "Овсянка с ягодами",
  "Омлет с овощами", 
  "Сырники с йогуртом",
  "Авокадо-тост с яйцом",
  "Протеиновый смузи",
  "Тофу-скрамбл с овощами",
  "Овсяноблин с творогом",
  "Рыбный завтрак по-скандинавски",
  "Гречневая каша с грибами",
  "Смузи боул с чиа и фруктами",
  "Авокадо-тост с семенами",
  "Фриттата с грибами и сыром",
  "Омлет с беконом и сыром",
  "Завтрак по-английски мини",
  "Яичница с беконом и авокадо",
  "Бутерброд с ростбифом и яйцом",
  "Буррито с фаршем и яйцом",
  "Куриная грудка с гречкой",
  "Паста с индейкой и овощами",
  "Суп-пюре из тыквы",
  "Салат с киноа и тунцом",
  "Стир-фрай из говядины с овощами",
  "Рыбный суп с овощами",
  "Индейка с киноа",
  "Суп из чечевицы с овощами",
  "Рисовый боул с тофу терияки",
  "Паста с грибами и шпинатом",
  "Киноа с жареными овощами",
  "Фалафель с тахини соусом",
  "Омлет с овощами и сыром",
  "Ризотто с грибами и сыром",
  "Киш с брокколи и сыром",
  "Паста с творожным соусом и шпинатом",
  "Яйца пашот на овощном рагу",
  "Греческий йогурт с орехами",
  "Яблоко с арахисовой пастой",
  "Творожная запеканка с ягодами",
  "Хумус с овощами",
  "Протеиновые шарики",
  "Протеиновый коктейль",
  "Сардиновые тосты с авокадо",
  "Рыбные фрикадельки с соусом",
  "Рулетики из лаваша с семгой",
  "Крекеры с паштетом из сардин",
  "Говяжий джерки",
  "Куриные рулетики с творожным сыром",
  "Чиа-пудинг с манго",
  "Орехово-фруктовые шарики",
  "Творожное парфе с гранолой",
  "Овощные роллы с хумусом",
  "Энергетические батончики",
  "Рыбные роллы с огурцом",
  "Фруктовый смузи боул"
];

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

console.log('=== АНАЛИЗ РЕЦЕПТОВ ===');
console.log(`Рецептов в базе: ${recipesInDB.length}`);
console.log(`Рецептов в списке пользователя: ${userRecipesList.length}`);
console.log('');

// Нормализуем названия для сравнения
function normalize(name) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Найдем точные совпадения
const exactMatches = userRecipesList.filter(userRecipe => {
  return recipesInDB.some(dbRecipe => 
    normalize(dbRecipe) === normalize(userRecipe)
  );
});

// Найдем похожие (возможно, просто разные названия)
const similarMatches = [];
userRecipesList.forEach(userRecipe => {
  const normalized = normalize(userRecipe);
  
  recipesInDB.forEach(dbRecipe => {
    const dbNormalized = normalize(dbRecipe);
    
    // Проверяем, содержит ли одно название ключевые слова другого
    const userWords = normalized.split(' ').filter(w => w.length > 2);
    const dbWords = dbNormalized.split(' ').filter(w => w.length > 2);
    
    const hasCommonWords = userWords.some(word => 
      dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
    );
    
    if (hasCommonWords && normalize(dbRecipe) !== normalize(userRecipe)) {
      similarMatches.push({
        user: userRecipe,
        db: dbRecipe
      });
    }
  });
});

// Рецепты, которых точно нет в базе
const missingRecipes = userRecipesList.filter(userRecipe => {
  return !recipesInDB.some(dbRecipe => 
    normalize(dbRecipe) === normalize(userRecipe)
  );
});

console.log('=== ТОЧНЫЕ СОВПАДЕНИЯ (УЖЕ ЕСТЬ В БАЗЕ) ===');
if (exactMatches.length > 0) {
  exactMatches.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
} else {
  console.log('Нет точных совпадений');
}

console.log('\n=== ВОЗМОЖНЫЕ ПОХОЖИЕ РЕЦЕПТЫ ===');
if (similarMatches.length > 0) {
  const uniqueSimilar = [];
  const seen = new Set();
  
  similarMatches.forEach(match => {
    const key = `${match.user}|${match.db}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSimilar.push(match);
    }
  });
  
  uniqueSimilar.forEach((match, index) => {
    console.log(`${index + 1}. "${match.user}" ~ "${match.db}"`);
  });
} else {
  console.log('Нет похожих рецептов');
}

console.log('\n=== РЕЦЕПТЫ ОТСУТСТВУЮТ В БАЗЕ ===');
if (missingRecipes.length > 0) {
  missingRecipes.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
} else {
  console.log('Все рецепты уже есть в базе');
}

console.log('\n=== СТАТИСТИКА ===');
console.log(`Точные совпадения: ${exactMatches.length}`);
console.log(`Отсутствуют в базе: ${missingRecipes.length}`);
console.log(`Процент покрытия: ${Math.round((exactMatches.length / userRecipesList.length) * 100)}%`);
