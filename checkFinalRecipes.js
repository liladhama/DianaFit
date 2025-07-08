// Проверка финального состояния файла recipesDB.js
const fs = require('fs');
const path = require('path');

console.log('=== ПРОВЕРКА ФАЙЛА recipesDB.js ===\n');

try {
  // Подключаем файл с рецептами
  const recipesPath = path.join(__dirname, 'backend', 'utils', 'recipesDB.js');
  
  // Читаем и проверяем содержимое файла
  const content = fs.readFileSync(recipesPath, 'utf8');
  
  // Проверяем основную структуру
  console.log('✅ Файл успешно прочитан');
  console.log(`📄 Размер файла: ${(content.length / 1024).toFixed(2)} KB`);
  console.log(`📝 Количество строк: ${content.split('\n').length}`);
  
  // Ищем основные разделы
  const sections = {
    breakfast: (content.match(/breakfast:\s*\[/)) ? '✅ Найден' : '❌ Отсутствует',
    lunch: (content.match(/lunch:\s*\[/)) ? '✅ Найден' : '❌ Отсутствует', 
    snacks: (content.match(/snacks:\s*\[/)) ? '✅ Найден' : '❌ Отсутствует',
    dinner: (content.match(/dinner"?:\s*\[/)) ? '✅ Найден' : '❌ Отсутствует'
  };
  
  console.log('\n=== СТРУКТУРА РАЗДЕЛОВ ===');
  Object.keys(sections).forEach(section => {
    console.log(`${section}: ${sections[section]}`);
  });
  
  // Подсчёт рецептов по названиям
  const recipeNames = content.match(/"?name"?:\s*"([^"]+)"/g);
  if (recipeNames) {
    console.log(`\n=== ОБЩАЯ СТАТИСТИКА ===`);
    console.log(`📊 Общее количество рецептов: ${recipeNames.length}`);
    
    // Подсчёт по типам
    const typeBreakfast = (content.match(/"?type"?:\s*"Завтрак"/g) || []).length;
    const typeLunch = (content.match(/"?type"?:\s*"Обед"/g) || []).length;
    const typeSnack = (content.match(/"?type"?:\s*"Перекус"/g) || []).length;
    const typeAfternoonSnack = (content.match(/"?type"?:\s*"Полдник"/g) || []).length;
    const typeDinner = (content.match(/"?type"?:\s*"Ужин"/g) || []).length;
    
    console.log(`🌅 Завтрак: ${typeBreakfast} рецептов`);
    console.log(`🍽️  Обед: ${typeLunch} рецептов`);
    console.log(`🥪 Перекус: ${typeSnack} рецептов`);
    console.log(`🍎 Полдник: ${typeAfternoonSnack} рецептов`);
    console.log(`🌙 Ужин: ${typeDinner} рецептов`);
    console.log(`➕ Сумма: ${typeBreakfast + typeLunch + typeSnack + typeAfternoonSnack + typeDinner} рецептов`);
  }
  
  // Проверка синтаксиса JSON-подобной структуры
  const hasCorrectClosing = content.includes('module.exports = recipes;');
  console.log(`\n=== ПРОВЕРКА СИНТАКСИСА ===`);
  console.log(`📤 Экспорт модуля: ${hasCorrectClosing ? '✅ Корректный' : '❌ Проблема'}`);
  
  // Проверка на распространённые ошибки
  const commonErrors = [];
  if (content.includes('export ')) commonErrors.push('❌ Найден export (должен быть module.exports)');
  if (content.includes(',}')) commonErrors.push('❌ Найдена лишняя запятая перед закрывающей скобкой');
  if (content.includes(',,')) commonErrors.push('❌ Найдены двойные запятые');
  
  if (commonErrors.length === 0) {
    console.log('✅ Распространённые ошибки не найдены');
  } else {
    commonErrors.forEach(error => console.log(error));
  }
  
  console.log('\n=== ПРОВЕРКА ЗАВЕРШЕНА ===');
  
} catch (error) {
  console.error('❌ Ошибка при проверке файла:', error.message);
}
