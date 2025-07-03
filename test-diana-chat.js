// Простой скрипт для тестирования эндпоинта /api/chat-diana
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';
const TEST_MESSAGES = [
    'Привет, как дела?',
    'Можешь рассказать о правильном питании?',
    'Какие продукты лучше всего есть на завтрак?',
    'Составь мне план питания на день с разнообразными блюдами для мясной диеты.',
    'Предложи 5 разных вариантов приготовления курицы с сохранением БЖУ.'
];

async function testChatDiana() {
    const testMessage = TEST_MESSAGES[Math.floor(Math.random() * TEST_MESSAGES.length)];
    
    try {
        console.log(`Отправка запроса на /api/chat-diana: "${testMessage}"`);
        console.log('URL:', `${API_URL}/api/chat-diana`);
        
        const response = await fetch(`${API_URL}/api/chat-diana`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: testMessage,
                context: 'Начало разговора'
            })
        });

        console.log('Статус ответа:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ошибка ${response.status}: ${errorText}`);
            console.error('\nДиагностика проблемы:');
            console.error('1. Проверьте, запущен ли backend (порт 3001)');
            console.error('2. Проверьте ключ Mistral API в файле backend/.env');
            console.error('3. Проверьте консоль backend на наличие детальных ошибок');
            return;
        }

        const data = await response.json();
        console.log('\nОтвет получен:');
        console.log('-'.repeat(50));
        console.log(data.response);
        console.log('-'.repeat(50));
        console.log('\nЧат с Дианой работает корректно!');
    } catch (error) {
        console.error('\nКритическая ошибка при выполнении запроса:');
        console.error(error);
        console.error('\nДиагностика проблемы:');
        console.error('1. Проверьте, запущен ли backend (порт 3001)');
        console.error('2. Проверьте сетевое соединение');
        console.error('3. Проверьте файервол или антивирус на блокировку соединений');
    }
}

async function testMealDiversity() {
    const message = 'Составь мне разнообразный план питания на один день для похудения с мясной диетой. Постарайся использовать разные источники белка в течение дня.';
    
    try {
        console.log(`\nПроверка разнообразия плана питания...`);
        console.log(`Отправка запроса на /api/chat-diana с запросом плана питания`);
        
        const response = await fetch(`${API_URL}/api/chat-diana`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                context: 'Пользователь хочет получить разнообразный план питания'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ошибка ${response.status}: ${errorText}`);
            return;
        }

        const data = await response.json();
        
        console.log('\nОтвет на запрос плана питания:');
        console.log('-'.repeat(50));
        console.log(data.response.substring(0, 500) + '...');
        console.log('-'.repeat(50));
        
        // Проверка наличия разнообразных блюд
        const proteinSources = ['курица', 'индейка', 'говядина', 'телятина', 'треска', 'лосось', 'творог', 'яйца'];
        const foundProteins = [];
        
        for (const protein of proteinSources) {
            if (data.response.toLowerCase().includes(protein)) {
                foundProteins.push(protein);
            }
        }
        
        console.log('\nРезультаты проверки адаптации:');
        console.log(`Найдено ${foundProteins.length} разных источников белка: ${foundProteins.join(', ')}`);
        
        if (foundProteins.length >= 3) {
            console.log('✅ План питания содержит хорошее разнообразие источников белка!');
        } else {
            console.log('⚠️ План питания мог бы содержать больше разнообразных источников белка.');
        }
        
    } catch (error) {
        console.error('\nОшибка при тестировании разнообразия плана питания:');
        console.error(error);
    }
}

async function testUserSettingsAndHistory() {
    console.log('\nТестирование адаптации под настройки пользователя и историю...');

    // Эмуляция изменений в личном кабинете
    const userSettings = {
        excludedProducts: ['молочные продукты', 'орехи'],
        preferredProteins: ['рыба', 'индейка'],
        mealTimings: {
            breakfast: '08:00',
            lunch: '13:00',
            dinner: '19:00'
        },
        activityLevel: 'средний',
        weightGoal: -0.5, // -0.5 кг в неделю
        currentStress: 'высокий',
        sleepQuality: 'низкое'
    };

    // Эмуляция истории диалогов и причин невыполнения
    const userHistory = {
        missedMeals: ['обед'],
        commonReasons: ['нет времени готовить днем', 'не нравится вкус протеиновых коктейлей'],
        successfulMeals: ['рыба на ужин', 'омлет на завтрак'],
        lastWeekAdherence: 0.7 // 70% выполнения плана
    };

    try {
        console.log('Отправка запроса с учетом настроек пользователя и истории...');
        
        const response = await fetch(`${API_URL}/api/chat-diana`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Составь план питания на завтра с учетом моих обновленных настроек',
