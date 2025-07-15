const fs = require('fs');
const path = 'c:/Users/user/Desktop/DianaFit/backend/utils/recipesDB.js';
const content = fs.readFileSync(path, 'utf8');

// Найти все строковые инструкции и преобразовать их в массивы
const updatedContent = content.replace(/instructions:\s*"([^"]+)"/g, (match, instructionText) => {
  // Разбиваем строку на шаги по логическим разделителям
  let steps = [];
  
  // Если есть запятые, разбиваем по ним
  if (instructionText.includes(',')) {
    steps = instructionText.split(',').map(s => s.trim());
  } 
  // Если есть точки с пробелами, разбиваем по ним
  else if (instructionText.includes('. ')) {
    steps = instructionText.split('. ').map(s => s.trim());
  }
  // Иначе оставляем как один шаг
  else {
    steps = [instructionText.trim()];
  }
  
  // Очищаем от номеров в начале и делаем заглавную букву
  steps = steps.map(step => {
    step = step.replace(/^\d+\.?\s*/, ''); // убираем номера
    if (step.length > 0) {
      step = step.charAt(0).toUpperCase() + step.slice(1); // заглавная буква
    }
    return step;
  }).filter(s => s && s.length > 2);
  
  // Формируем массив
  const arrayStr = steps.map(s => '      "' + s + '"').join(',\n');
  return 'instructions: [\n' + arrayStr + '\n    ]';
});

fs.writeFileSync(path, updatedContent);
console.log('Рецепты приведены к единому формату массива с заглавными буквами');
