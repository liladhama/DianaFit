// Скрипт для тестирования разнообразия блюд и работы с рецептами
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

// Тестовые сценарии для проверки разнообразия блюд
const TEST_SCENARIOS = [
    {
        name: 'Проверка генерации уникальных перекусов',
        endpoint: '/api/generate-meal-plan',
        body: {
            mealType: 'snack',
            calories: 200,
            excludeMeals: ['Яблоко', 'Банан']
        }
    },
    {
        name: 'Проверка генерации уникального рецепта',
        endpoint: '/api/generate-recipe',
        body: {
            type: 'snack',
            targetCalories: 200,
            preferences: {
                diet: 'balanced',
                exclude: ['орехи', 'молочные продукты']
            }
        }
    },
    {
        name: 'Проверка замены дубликатов в плане на день',
        endpoint: '/api/get-today-plan',
        body: {
            userId: 'test-user',
            date: new Date().toISOString().split('T')[0]
        }
    }
];

async function testMealDiversity() {
    console.log('Начинаем тестирование разнообразия блюд...\n');

    for (const scenario of TEST_SCENARIOS) {
        try {
            console.log(`Тестируем: ${scenario.name}`);
            console.log(`Отправка запроса на ${scenario.endpoint}`);
            
            const response = await fetch(`${API_URL}${scenario.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scenario.body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Ошибка ${response.status}: ${errorText}`);
                continue;
            }

            const data = await response.json();
            console.log('\nПолучен ответ:');
            console.log('-'.repeat(50));
            console.log(JSON.stringify(data, null, 2));
            console.log('-'.repeat(50));
            
            // Проверка уникальности блюд
            if (data.meals) {
                const meals = data.meals;
                const uniqueMeals = new Set(meals.map(m => m.name));
                console.log(`\nУникальность блюд: ${uniqueMeals.size}/${meals.length}`);
                
                if (uniqueMeals.size < meals.length) {
                    console.warn('⚠️ Обнаружены дубликаты блюд!');
                } else {
                    console.log('✅ Все блюда уникальны');
                }
            }
            
            if (data.recipe) {
                console.log('\nПроверка калорийности:');
                const targetCalories = scenario.body.targetCalories;
                const actualCalories = data.recipe.calories;
                const difference = Math.abs(targetCalories - actualCalories);
                
                if (difference <= targetCalories * 0.1) {
                    console.log('✅ Калорийность в пределах нормы');
                } else {
                    console.warn(`⚠️ Отклонение калорийности: ${difference} ккал`);
                }
            }

            console.log('\n✅ Тест успешно завершен\n');
        } catch (error) {
            console.error('\n❌ Критическая ошибка при выполнении запроса:');
            console.error(error);
            console.log('\n');
        }
    }
}

// Запускаем тестирование
testMealDiversity().catch(console.error);
