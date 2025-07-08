// Скрипт для подсчета рецептов с исправлением синтаксиса "на лету"
const fs = require('fs');
const path = require('path');

try {
  console.log('🔍 Анализирую файл recipesDB.js...');
  
  // Читаем файл как текст
  const filePath = './recipesDB.js';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Попробуем посчитать рецепты по текстовым маркерам
  const sections = ['breakfast', 'lunch', 'snacks', 'afternoon_snacks', 'dinner'];
  let totalRecipes = 0;
  
  console.log('\n=== ПОДСЧЕТ РЕЦЕПТОВ ПО РАЗДЕЛАМ ===');
  
  sections.forEach(section => {
    // Ищем рецепты в каждом разделе по паттерну name:
    const sectionRegex = new RegExp(`${section}[^\\[]*\\[([^\\]]*(?:\\[[^\\]]*\\][^\\]]*)*?)(?=\\]\\s*,?\\s*(?:"\\w+"|$))`, 'gs');
    const match = sectionRegex.exec(content);
    
    if (match) {
      const sectionContent = match[1];
      // Считаем количество рецептов по паттерну "name": или name:
      const recipeMatches = sectionContent.match(/(name|"name")\s*:\s*["']/g);
      const count = recipeMatches ? recipeMatches.length : 0;
      
      console.log(`📋 ${section}: ${count} рецептов`);
      totalRecipes += count;
    } else {
      console.log(`📋 ${section}: 0 рецептов (раздел не найден)`);
    }
  });
  
  console.log(`\n🎯 ОБЩЕЕ КОЛИЧЕСТВО РЕЦЕПТОВ: ${totalRecipes}`);
  
  // Дополнительно попробуем простой подсчет всех name:
  const allNameMatches = content.match(/(name|"name")\s*:\s*["'][^"']+["']/g);
  const totalNames = allNameMatches ? allNameMatches.length : 0;
  console.log(`📊 Всего найдено записей "name": ${totalNames}`);
  
} catch (error) {
  console.error('❌ Ошибка при анализе файла:', error.message);
}
