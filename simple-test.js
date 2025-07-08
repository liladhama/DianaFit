const recipes = require('./backend/utils/recipesDB.js');

console.log("=== ЗАГРУЗКА ФАЙЛА УСПЕШНА ===\n");

console.log("РЕЦЕПТОВ ПО РАЗДЕЛАМ:");
console.log(`ЗАВТРАК: ${recipes.breakfast.length}`);
console.log(`ОБЕД: ${recipes.lunch.length}`);
console.log(`ПЕРЕКУС: ${recipes.snacks.length}`);
console.log(`ПОЛДНИК: ${recipes.afternoon_snacks.length}`);
console.log(`УЖИН: ${recipes.dinner.length}`);

const total = recipes.breakfast.length + recipes.lunch.length + recipes.snacks.length + recipes.afternoon_snacks.length + recipes.dinner.length;
console.log(`\nВСЕГО: ${total} рецептов`);

// Собираем все названия
const allNames = [
    ...recipes.breakfast.map(r => r.name),
    ...recipes.lunch.map(r => r.name),
    ...recipes.snacks.map(r => r.name),
    ...recipes.afternoon_snacks.map(r => r.name),
    ...recipes.dinner.map(r => r.name)
];

console.log(`\nУникальных названий: ${new Set(allNames).size}`);
console.log(`Дубликатов: ${total - new Set(allNames).size}`);

if (total === new Set(allNames).size) {
    console.log("\n🎉 ВСЕ ДУБЛИКАТЫ УДАЛЕНЫ!");
} else {
    console.log("\n❌ Ещё есть дубликаты");
}
