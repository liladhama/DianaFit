const fs = require('fs');

const content = fs.readFileSync('App.js', 'utf8');
const lines = content.split('\n');

let openBraces = 0;
let openParens = 0;
let inComment = false;
let inString = false;
let stringChar = '';

for (let lineNum = 0; lineNum < lines.length; lineNum++) {
  const line = lines[lineNum];
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prevChar = i > 0 ? line[i-1] : '';
    const nextChar = i < line.length - 1 ? line[i+1] : '';
    
    // Пропускаем комментарии
    if (!inString && !inComment && char === '/' && nextChar === '*') {
      inComment = true;
      i++; // пропускаем следующий символ
      continue;
    }
    if (inComment && char === '*' && nextChar === '/') {
      inComment = false;
      i++; // пропускаем следующий символ
      continue;
    }
    if (!inString && !inComment && char === '/' && nextChar === '/') {
      break; // остальная часть строки - комментарий
    }
    
    if (inComment) continue;
    
    // Обрабатываем строки
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
      continue;
    }
    if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = '';
      continue;
    }
    
    if (inString) continue;
    
    // Считаем скобки
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    
    // Выводим баланс каждые 100 строк
    if ((lineNum + 1) % 100 === 0 || lineNum > 1900) {
      console.log(`Строка ${lineNum + 1}: фигурные=${openBraces}, круглые=${openParens}`);
    }
    if (openBraces < 0) {
      console.log(`ОШИБКА: Лишняя закрывающая фигурная скобка на строке ${lineNum + 1}, позиция ${i + 1}`);
      console.log(`Строка: ${line}`);
    }
    if (openParens < 0) {
      console.log(`ОШИБКА: Лишняя закрывающая круглая скобка на строке ${lineNum + 1}, позиция ${i + 1}`);
      console.log(`Строка: ${line}`);
    }
  }
  
  // Сбрасываем строки в конце строки (кроме template literals)
  if (inString && stringChar !== '`') {
    inString = false;
    stringChar = '';
  }
}

console.log('\nФинальный баланс:');
console.log('Фигурные скобки:', openBraces);
console.log('Круглые скобки:', openParens);

if (openBraces !== 0) {
  console.log('\n❌ ПРОБЛЕМА: Несбалансированные фигурные скобки!');
  if (openBraces > 0) {
    console.log(`Не хватает ${openBraces} закрывающих фигурных скобок`);
  } else {
    console.log(`Лишних ${Math.abs(openBraces)} закрывающих фигурных скобок`);
  }
}

if (openParens !== 0) {
  console.log('\n❌ ПРОБЛЕМА: Несбалансированные круглые скобки!');
  if (openParens > 0) {
    console.log(`Не хватает ${openParens} закрывающих круглых скобок`);
  } else {
    console.log(`Лишних ${Math.abs(openParens)} закрывающих круглых скобок`);
  }
}

if (openBraces === 0 && openParens === 0) {
  console.log('\n✅ Все скобки сбалансированы');
}
