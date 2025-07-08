const fs = require('fs');

const content = fs.readFileSync('c:\\Users\\user\\Desktop\\DianaFit\\backend\\utils\\recipesDB.js', 'utf8');

// Простое извлечение названий рецептов
const nameMatches = content.match(/name: "([^"]+)"/g) || [];
const names = nameMatches.map(match => match.replace(/name: "([^"]+)"/, '$1'));

console.log('Все названия рецептов:');
names.forEach((name, i) => console.log(`${i+1}. ${name}`));

console.log(`\nВсего: ${names.length}`);

// Поиск дубликатов
const counts = {};
names.forEach(name => counts[name] = (counts[name] || 0) + 1);
const dups = Object.entries(counts).filter(([n, c]) => c > 1);

if (dups.length > 0) {
    console.log('\nДубликаты:');
    dups.forEach(([name, count]) => console.log(`"${name}" - ${count} раза`));
} else {
    console.log('\nДубликаты не найдены!');
}

console.log(`\nУникальных: ${Object.keys(counts).length}`);
