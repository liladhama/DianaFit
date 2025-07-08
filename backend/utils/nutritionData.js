// Таблица калорийности и БЖУ продуктов на 100г
export const nutritionData = {
    // Крупы и злаки
    "Овсяные хлопья":      { calories: 366, protein: 11.0, fat: 6.9,  carbs: 66.3 },
    "Рис отварной":        { calories: 130, protein: 2.4,  fat: 0.3,  carbs: 28.2 },
    "Гречка отварная":     { calories: 123, protein: 4.5,  fat: 1.4,  carbs: 25.6 },
    "Макароны отварные":   { calories: 157, protein: 5.8,  fat: 0.9,  carbs: 30.9 },
    "Хлеб цельнозерновой": { calories: 247, protein: 9.0,  fat: 3.5,  carbs: 41.0 },
    "Мука цельнозерновая": { calories: 315, protein: 13.6, fat: 2.8,  carbs: 60.0 },

    // Бобовые
    "Нут отварной":        { calories: 164, protein: 8.9,  fat: 2.6,  carbs: 27.4 },
    "Чечевица отварная":   { calories: 116, protein: 9.0,  fat: 0.4,  carbs: 20.1 },
    "Фасоль отварная":     { calories: 127, protein: 8.7,  fat: 0.5,  carbs: 21.1 },
    "Горох отварной":      { calories: 118, protein: 8.3,  fat: 0.4,  carbs: 20.5 },

    // Мясо и птица (сырой продукт)
    "Курица грудка":       { calories: 165, protein: 31.0, fat: 3.6,  carbs: 0 },
    "Говядина постная":    { calories: 158, protein: 22.1, fat: 5.0,  carbs: 0 },
    "Индейка филе":        { calories: 135, protein: 29.0, fat: 1.0,  carbs: 0 },
    "Свинина постная":     { calories: 143, protein: 21.5, fat: 6.3,  carbs: 0 },

    // Рыба и морепродукты
    "Лосось":              { calories: 206, protein: 22.1, fat: 12.4, carbs: 0 },
    "Треска":              { calories: 82,  protein: 17.8, fat: 0.7,  carbs: 0 },
    "Тунец":               { calories: 132, protein: 29.9, fat: 1.6,  carbs: 0 },
    "Креветки":            { calories: 99,  protein: 24.0, fat: 0.3,  carbs: 0 },

    // Молочные продукты
    "Творог 2%":           { calories: 103, protein: 18.0, fat: 2.0,  carbs: 3.3 },
    "Творог 5%":           { calories: 121, protein: 17.2, fat: 5.0,  carbs: 1.8 },
    "Молоко 1%":           { calories: 42,  protein: 3.4,  fat: 1.0,  carbs: 4.8 },
    "Молоко 2.5%":         { calories: 52,  protein: 3.2,  fat: 2.5,  carbs: 4.9 },
    "Кефир 1%":            { calories: 40,  protein: 3.0,  fat: 1.0,  carbs: 4.0 },
    "Йогурт натуральный":   { calories: 59,  protein: 10.0, fat: 0.4,  carbs: 3.6 },
    "Сыр твердый":         { calories: 356, protein: 25.0, fat: 27.0, carbs: 1.3 },
    "Моцарелла":           { calories: 280, protein: 28.0, fat: 17.0, carbs: 3.1 },

    // Яйца
    "Яйцо":                { calories: 155, protein: 12.6, fat: 10.6, carbs: 1.1 }, // на 100 г
    "Яйцо (1 шт)":         { calories: 78,  protein: 6.3,  fat: 5.3,  carbs: 0.6 },

    // Овощи
    "Помидоры":            { calories: 18,  protein: 0.9,  fat: 0.2,  carbs: 3.9 },
    "Помидоры черри":      { calories: 19,  protein: 0.9,  fat: 0.2,  carbs: 4.0 },
    "Огурцы":              { calories: 15,  protein: 0.7,  fat: 0.1,  carbs: 3.0 },
    "Болгарский перец":     { calories: 31,  protein: 1.0,  fat: 0.3,  carbs: 6.0 },
    "Морковь":             { calories: 41,  protein: 0.9,  fat: 0.2,  carbs: 9.6 },
    "Капуста белокочанная":{ calories: 25,  protein: 1.3,  fat: 0.1,  carbs: 5.8 },
    "Брокколи":            { calories: 34,  protein: 2.8,  fat: 0.4,  carbs: 6.6 },
    "Цветная капуста":     { calories: 25,  protein: 2.0,  fat: 0.3,  carbs: 5.0 },
    "Кабачки":             { calories: 17,  protein: 1.2,  fat: 0.2,  carbs: 3.1 },
    "Баклажаны":           { calories: 25,  protein: 1.0,  fat: 0.2,  carbs: 5.7 },
    "Картофель":           { calories: 77,  protein: 2.0,  fat: 0.1,  carbs: 17.0 },
    "Лук репчатый":        { calories: 40,  protein: 1.1,  fat: 0.1,  carbs: 9.3 },
    "Чеснок":              { calories: 149, protein: 6.4,  fat: 0.5,  carbs: 33.1 },
    "Шпинат свежий":       { calories: 23,  protein: 2.9,  fat: 0.4,  carbs: 1.1 },
    "Салат листовой":      { calories: 15,  protein: 1.4,  fat: 0.2,  carbs: 2.3 },

    // Фрукты и ягоды
    "Яблоки":              { calories: 52,  protein: 0.3,  fat: 0.2,  carbs: 14.0 },
    "Банан":               { calories: 89,  protein: 1.1,  fat: 0.3,  carbs: 23.0 },
    "Апельсины":           { calories: 47,  protein: 0.9,  fat: 0.1,  carbs: 11.8 },
    "Клубника":            { calories: 33,  protein: 0.7,  fat: 0.3,  carbs: 7.7 },
    "Черника":             { calories: 57,  protein: 0.7,  fat: 0.3,  carbs: 14.5 },
    "Голубика":            { calories: 57,  protein: 0.7,  fat: 0.3,  carbs: 14.5 },

    // Орехи и семена
    "Миндаль":             { calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6 },
    "Грецкие орехи":       { calories: 654, protein: 15.2, fat: 65.2, carbs: 13.7 },
    "Арахис":              { calories: 567, protein: 25.8, fat: 49.2, carbs: 16.1 },
    "Семена подсолнечника":{ calories: 584, protein: 20.8, fat: 51.5, carbs: 20.0 },

    // Масла и жиры
    "Оливковое масло":     { calories: 884, protein: 0,    fat: 100,  carbs: 0 },
    "Подсолнечное масло":  { calories: 884, protein: 0,    fat: 100,  carbs: 0 },
    "Сливочное масло":     { calories: 717, protein: 0.5,  fat: 81.1, carbs: 0.1 },
    "Авокадо":             { calories: 160, protein: 2.0,  fat: 14.7, carbs: 8.5 },

    // Молочные альтернативы
    "Кокосовое молоко":    { calories: 230, protein: 2.3,  fat: 24.0, carbs: 3.3 },
    "Миндальное молоко":    { calories: 15,  protein: 0.6,  fat: 1.1,  carbs: 0.3 },

    // Соусы и приправы
    "Мед":                 { calories: 304, protein: 0.3,  fat: 0,    carbs: 82.4 },
    "Паста карри":         { calories: 248, protein: 5.7,  fat: 15.6, carbs: 20.8 },
    "Соевый соус":         { calories: 53,  protein: 8.0,  fat: 0,    carbs: 4.9 },

    // Готовые продукты
    "Тофу":                { calories: 76,  protein: 8.0,  fat: 4.8,  carbs: 1.9 },
    "Протеин":             { calories: 380, protein: 80.0, fat: 5.0,  carbs: 5.0 }
};

// Функция для конвертации единиц в граммы
export function convertToGrams(amount, unit, productName) {
    // Стандартные веса для штучных продуктов
    const standardWeights = {
        "Картофель": 150, // 1 шт = 150г
        "Лук репчатый": 130, // 1 шт = 130г
        "Яйцо": 50, // 1 шт = 50г
        "Яйца": 50, // 1 шт = 50г
        "Банан": 120, // 1 шт = 120г
        "Яблоки": 180, // 1 шт = 180г
        "Апельсины": 200, // 1 шт = 200г
        "Помидоры черри": 15, // 1 шт = 15г
        "Чеснок": 4, // 1 зубчик = 4г
        "Хлеб цельнозерновой": 25 // 1 кусочек = 25г
    };

    switch (unit) {
        case 'г':
        case 'грамм':
            return amount;
        case 'кг':
            return amount * 1000;
        case 'мл':
        case 'миллилитр':
            // Для жидкостей считаем 1мл = 1г (приблизительно)
            return amount;
        case 'л':
        case 'литр':
            return amount * 1000;
        case 'шт':
        case 'штук':
        case 'штука':
            if (standardWeights[productName]) {
                return amount * standardWeights[productName];
            }
            return amount * 100; // Дефолтный вес для неизвестных продуктов
        case 'зубчика':
        case 'зубчик':
            return amount * 4; // 1 зубчик чеснока = 4г
        case 'ч.л.':
        case 'чайная ложка':
            return amount * 5; // 1 ч.л. = 5г
        case 'ст.л.':
        case 'столовая ложка':
            return amount * 15; // 1 ст.л. = 15г
        case 'стакан':
            return amount * 200; // 1 стакан = 200г/мл
        case 'кусочка':
        case 'кусочек':
            if (productName.includes('хлеб')) {
                return amount * 25; // 1 кусочек хлеба = 25г
            }
            return amount * 50; // Дефолт для кусочков
        default:
            console.warn(`Неизвестная единица измерения: ${unit} для ${productName}`);
            return amount;
    }
}

// Функция точного расчёта калорий и БЖУ по ингредиентам
export function calculateNutritionByIngredients(ingredients) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalGrams = 0;

    ingredients.forEach(ingredient => {
        const { name, amount, unit } = ingredient;
        const grams = convertToGrams(amount, unit, name);
        totalGrams += grams;
        
        const nutrition = nutritionData[name];
        if (nutrition) {
            // Пересчитываем на фактические граммы
            const ratio = grams / 100;
            totalCalories += nutrition.calories * ratio;
            totalProtein += nutrition.protein * ratio;
            totalFat += nutrition.fat * ratio;
            totalCarbs += nutrition.carbs * ratio;
        } else {
            console.warn(`Нет данных по питательности для продукта: ${name}`);
        }
    });

    return {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        totalGrams: Math.round(totalGrams)
    };
}

// Функция для проверки и исправления калорийности рецепта
export function validateRecipeNutrition(recipe) {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
        return recipe; // Нет ингредиентов для проверки
    }

    const calculated = calculateNutritionByIngredients(recipe.ingredients);
    const difference = Math.abs(recipe.calories - calculated.calories);
    
    // Если разница больше 10%, исправляем
    if (difference > recipe.calories * 0.1) {
        console.warn(`Рецепт "${recipe.name}": калории не совпадают. Было: ${recipe.calories}, рассчитано: ${calculated.calories}`);
        return {
            ...recipe,
            calories: calculated.calories,
            protein: calculated.protein,
            fat: calculated.fat,
            carbs: calculated.carbs
        };
    }

    return recipe;
}
