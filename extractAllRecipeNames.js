// Скрипт для извлечения всех названий рецептов из recipesDB.js
const fs = require('fs');
const path = require('path');

// Путь к файлу с рецептами
const recipesPath = path.join(__dirname, 'backend', 'utils', 'recipesDB.js');

try {
  // Читаем содержимое файла
  const content = fs.readFileSync(recipesPath, 'utf8');
  
  // Ищем все названия рецептов с помощью регулярного выражения
  const nameMatches = content.match(/"name":\s*"([^"]+)"/g);
  
  if (nameMatches) {
    const recipeNames = nameMatches.map(match => {
      const nameMatch = match.match(/"name":\s*"([^"]+)"/);
      return nameMatch ? nameMatch[1] : null;
    }).filter(name => name !== null);
    
    console.log('=== ПОЛНЫЙ СПИСОК РЕЦЕПТОВ ИЗ БАЗЫ ===');
    console.log(`Общее количество рецептов: ${recipeNames.length}`);
    console.log('');
    
    // Группируем по категориям
    const lines = content.split('\n');
    let currentCategory = '';
    const categories = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ищем категории
      if (line.includes('"breakfast":') || line.includes('breakfast:')) {
        currentCategory = 'Завтрак';
        categories[currentCategory] = [];
      } else if (line.includes('"lunch":') || line.includes('lunch:')) {
        currentCategory = 'Обед';
        categories[currentCategory] = [];
      } else if (line.includes('"snacks":') || line.includes('snacks:')) {
        currentCategory = 'Перекус';
        categories[currentCategory] = [];
      } else if (line.includes('"afternoon_snack":') || line.includes('afternoon_snack:')) {
        currentCategory = 'Полдник';
        categories[currentCategory] = [];
      } else if (line.includes('"dinner":') || line.includes('dinner:')) {
        currentCategory = 'Ужин';
        categories[currentCategory] = [];
      }
      
      // Ищем названия рецептов
      if (line.includes('"name":') && currentCategory) {
        const nameMatch = line.match(/"name":\s*"([^"]+)"/);
        if (nameMatch) {
          categories[currentCategory].push(nameMatch[1]);
        }
      }
    }
    
    // Выводим по категориям
    Object.keys(categories).forEach(category => {
      console.log(`=== ${category.toUpperCase()} (${categories[category].length} рецептов) ===`);
      categories[category].forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
      console.log('');
    });
    
    // Создаем файл со всеми названиями для удобства
    const outputText = `ПОЛНЫЙ СПИСОК РЕЦЕПТОВ ИЗ БАЗЫ ДАННЫХ
Общее количество: ${recipeNames.length}

СПИСОК ПО КАТЕГОРИЯМ:
${Object.keys(categories).map(category => 
  `${category} (${categories[category].length} рецептов):\n${categories[category].map((name, i) => `${i+1}. ${name}`).join('\n')}`
).join('\n\n')}

ПОЛНЫЙ АЛФАВИТНЫЙ СПИСОК:
${recipeNames.sort().map((name, i) => `${i+1}. ${name}`).join('\n')}
`;
    
    fs.writeFileSync('recipe_names_full_list.txt', outputText, 'utf8');
    console.log('Полный список сохранен в файл recipe_names_full_list.txt');
    
  } else {
    console.log('Названия рецептов не найдены в файле.');
  }
  
} catch (error) {
  console.error('Ошибка при чтении файла:', error.message);
}
