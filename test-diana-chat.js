// Простой скрипт для тестирования эндпоинта /api/chat-diana
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';
const TEST_MESSAGES = [
    'Привет, как дела?',
    'Можешь рассказать о правильном питании?',
    'Какие продукты лучше всего есть на завтрак?'
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

testChatDiana();
