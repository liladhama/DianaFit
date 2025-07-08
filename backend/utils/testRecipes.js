console.log('Начинаю проверку файла recipesDB.js...');

try {
  const { recipesDB } = require('./recipesDB.js');
  console.log('✅ Файл успешно импортирован!');
  
  let totalRecipes = 0;
  console.log('\n=== ПОДСЧЕТ РЕЦЕПТОВ ===');
  
  Object.keys(recipesDB).forEach(section => {
    if (Array.isArray(recipesDB[section])) {
      const count = recipesDB[section].length;
      console.log(`${section}: ${count} рецептов`);
      totalRecipes += count;
    }
  });
  
  console.log(`\n🎯 ОБЩЕЕ КОЛИЧЕСТВО РЕЦЕПТОВ: ${totalRecipes}`);
  
} catch (error) {
  console.error('❌ ОШИБКА при импорте файла:');
  console.error(error.message);
  console.error('\nСтек ошибки:');
  console.error(error.stack);
}
