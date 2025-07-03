/**
 * База данных рецептов с калорийностью и категориями
 * @type {Object.<string, Array>}
 */

const recipesDB = {
    breakfast: [
        {
            name: "Овсянка с ягодами",
            type: "Завтрак",
            calories: 320,
            protein: 10,
            fat: 5,
            carbs: 55,
            ingredients: [
                { name: "Овсяные хлопья", amount: 50, unit: "г" },
                { name: "Молоко 1%", amount: 150, unit: "мл" },
                { name: "Ягоды свежие/замороженные", amount: 100, unit: "г" },
                { name: "Мед", amount: 5, unit: "г" }
            ],
            instructions: "Смешать молоко и воду, довести до кипения, добавить хлопья, варить 5-7 минут. Подавать с ягодами.",
            tags: ["вегетарианское", "сытное", "быстро"]
        },
        {
            name: "Омлет с овощами",
            type: "Завтрак",
            calories: 300,
            protein: 18,
            fat: 20,
            carbs: 5,
            ingredients: [
                { name: "Яйца", amount: 3, unit: "шт" },
                { name: "Молоко", amount: 50, unit: "мл" },
                { name: "Помидоры", amount: 100, unit: "г" },
                { name: "Лук", amount: 30, unit: "г" },
                { name: "Масло растительное", amount: 10, unit: "мл" }
            ],
            instructions: "Взбить яйца с молоком, обжарить овощи, залить яичной смесью, готовить под крышкой.",
            tags: ["высокий_белок", "низкоуглеводное"]
        }
    ],
    lunch: [
        {
            name: "Куриная грудка с гречкой",
            type: "Обед",
            calories: 450,
            protein: 35,
            fat: 12,
            carbs: 55,
            ingredients: [
                { name: "Куриная грудка", amount: 150, unit: "г" },
                { name: "Гречка", amount: 100, unit: "г" },
                { name: "Масло оливковое", amount: 10, unit: "мл" },
                { name: "Специи", amount: 1, unit: "по вкусу" }
            ],
            instructions: "Отварить гречку, приготовить куриную грудку на гриле или в духовке, подавать с зеленью.",
            tags: ["высокий_белок", "здоровое"]
        }
    ],
    dinner: [
        {
            name: "Рыба на пару с овощами",
            type: "Ужин",
            calories: 350,
            protein: 30,
            fat: 15,
            carbs: 25,
            ingredients: [
                { name: "Филе белой рыбы", amount: 150, unit: "г" },
                { name: "Брокколи", amount: 150, unit: "г" },
                { name: "Морковь", amount: 100, unit: "г" },
                { name: "Лимон", amount: 0.5, unit: "шт" }
            ],
            instructions: "Приготовить рыбу на пару, подать с овощами и лимоном.",
            tags: ["низкокалорийное", "здоровое", "рыба"]
        }
    ],
    snack: [
        {
            name: "Яблоко с миндалем",
            type: "Перекус",
            calories: 150,
            protein: 5,
            fat: 8,
            carbs: 20,
            ingredients: [
                { name: "Яблоко", amount: 1, unit: "шт" },
                { name: "Миндаль", amount: 20, unit: "г" }
            ],
            instructions: "Съесть яблоко с миндалем.",
            tags: ["перекус", "фрукты", "орехи"]
        },
        {
            name: "Греческий йогурт с медом",
            type: "Полдник",
            calories: 180,
            protein: 15,
            fat: 5,
            carbs: 25,
            ingredients: [
                { name: "Греческий йогурт", amount: 150, unit: "г" },
                { name: "Мед", amount: 10, unit: "г" },
                { name: "Грецкие орехи", amount: 10, unit: "г" }
            ],
            instructions: "Смешать йогурт с медом, посыпать орехами.",
            tags: ["белковое", "полдник"]
        }
    ]
};

export default recipesDB;
