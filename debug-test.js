console.log("Тестирование загрузки...");
try {
    const recipes = require('./backend/utils/recipesDB.js');
    console.log("Файл успешно загружен!");
    
    console.log("Проверка разделов:");
    console.log("breakfast:", Array.isArray(recipes.breakfast) ? recipes.breakfast.length : "ОШИБКА");
    console.log("lunch:", Array.isArray(recipes.lunch) ? recipes.lunch.length : "ОШИБКА");
    console.log("snacks:", Array.isArray(recipes.snacks) ? recipes.snacks.length : "ОШИБКА");
    console.log("afternoon_snacks:", Array.isArray(recipes.afternoon_snacks) ? recipes.afternoon_snacks.length : "ОШИБКА");
    console.log("dinner:", Array.isArray(recipes.dinner) ? recipes.dinner.length : "ОШИБКА");
    
} catch (error) {
    console.error("Ошибка:", error.message);
    console.log("Первые 5 строк ошибки:", error.stack?.split('\n').slice(0,5).join('\n'));
}
