const { recipesDB } = require('./recipesDB');

function validateRecipes() {
  const counts = {
    breakfast: recipesDB.breakfast.length,
    lunch: recipesDB.lunch.length,
    snacks: recipesDB.snacks.length,
    afternoon_snacks: recipesDB.afternoon_snacks.length,
    dinner: recipesDB.dinner.length
  };

  console.log('Количество рецептов по разделам:');
  Object.entries(counts).forEach(([section, count]) => {
    console.log(`${section}: ${count} рецептов`);
  });

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log(`\nОбщее количество рецептов: ${total}`);

  // Проверка структуры данных
  const sections = ['breakfast', 'lunch', 'snacks', 'afternoon_snacks', 'dinner'];
  const requiredFields = ['name', 'type', 'dietType', 'calories', 'protein', 'fat', 'carbs', 'ingredients', 'instructions', 'tags'];
  
  let hasErrors = false;
  sections.forEach(section => {
    recipesDB[section].forEach((recipe, index) => {
      requiredFields.forEach(field => {
        if (!recipe[field]) {
          console.error(`Ошибка: Отсутствует поле "${field}" в рецепте "${recipe.name || `#${index+1}`}" в разделе "${section}"`);
          hasErrors = true;
        }
      });
    });
  });

  if (!hasErrors) {
    console.log('\nПроверка структуры данных: Все рецепты имеют корректную структуру');
  }
}

validateRecipes();
