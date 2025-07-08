const fs = require('fs');

try {
  console.log('Начинаю анализ...');
  const content = fs.readFileSync('./recipesDB.js', 'utf8');
  console.log('Файл прочитан успешно');

  // Подсчет рецептов по простому паттерну
  const recipePattern = /name:\s*["'][^"']+["']/g;
  const matches = content.match(recipePattern) || [];
  
  console.log(`\n🍽️ ОБЩЕЕ КОЛИЧЕСТВО РЕЦЕПТОВ: ${matches.length}`);
  
  // Покажем разбивку по разделам
  const sections = {
    breakfast: (content.match(/breakfast[^{]*\{[^}]*name:/g) || []).length,
    lunch: (content.match(/lunch[^{]*\{[^}]*name:/g) || []).length,
    snacks: (content.match(/snacks[^{]*\{[^}]*name:/g) || []).length,
    afternoon_snacks: (content.match(/afternoon_snacks[^{]*\{[^}]*name:/g) || []).length,
    dinner: (content.match(/dinner[^{]*\{[^}]*name:/g) || []).length
  };
  
  console.log('\nРазбивка по разделам:');
  Object.entries(sections).forEach(([section, count]) => {
    console.log(`  ${section}: ~${count} (приблизительно)`);
  });
  
} catch (error) {
  console.error('Ошибка:', error.message);
}
