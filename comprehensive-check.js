// Комплексная проверка чата с Дианой
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, 'backend', '.env');

// Загружаем переменные окружения
dotenv.config({ path: envPath });

// Проверяем, что переменные окружения загружены
console.log('===== ПРОВЕРКА КОНФИГУРАЦИИ =====');
console.log('Текущая директория:', __dirname);
console.log('Путь к .env файлу:', envPath);
console.log('Файл .env существует:', fs.existsSync(envPath) ? 'Да' : 'Нет');

// Проверяем API ключ
const apiKey = process.env.MISTRAL_API_KEY;
console.log('\n===== ПРОВЕРКА API КЛЮЧА =====');
if (!apiKey) {
    console.error('ОШИБКА: MISTRAL_API_KEY не найден в .env файле');
} else {
    console.log(`API ключ найден: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`Длина ключа: ${apiKey.length} символов`);
}

// Функция для проверки API Mistral
async function checkMistralAPI() {
    console.log('\n===== ПРОВЕРКА СОЕДИНЕНИЯ С MISTRAL API =====');
    
    if (!apiKey) {
        console.error('Невозможно проверить API без ключа');
        return false;
    }
    
    try {
        console.log('Отправка запроса на https://api.mistral.ai/v1/models...');
        const response = await fetch('https://api.mistral.ai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        console.log('Получен ответ со статусом:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Успех! Доступные модели:');
            data.data.forEach(model => {
                console.log(`- ${model.id}`);
            });
            return true;
        } else {
            const errorText = await response.text();
            console.error(`Ошибка при проверке API: ${response.status} ${response.statusText}`);
            console.error(`Детали ошибки: ${errorText}`);
            
            if (response.status === 401) {
                console.error('\nОШИБКА АВТОРИЗАЦИИ (401):');
                console.error('1. Проверьте, правильно ли скопирован ключ API');
                console.error('2. Убедитесь, что ключ активен в вашем аккаунте Mistral');
                console.error('3. Проверьте, не истек ли срок действия ключа');
            }
            
            return false;
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        return false;
    }
}

// Функция для проверки чата с Дианой
async function testChatDiana() {
    console.log('\n===== ПРОВЕРКА ЧАТА С ДИАНОЙ =====');
    
    const testMessage = 'Привет, как дела?';
    const API_URL = 'http://localhost:3001';
    
    try {
        console.log(`Отправка запроса на ${API_URL}/api/chat-diana...`);
        console.log(`Сообщение: "${testMessage}"`);
        
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

        console.log('Получен ответ со статусом:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('\nОтвет от чата с Дианой:');
            console.log('-'.repeat(50));
            console.log(data.response);
            console.log('-'.repeat(50));
            console.log('\nЧат с Дианой работает корректно!');
            return true;
        } else {
            const errorText = await response.text();
            console.error(`Ошибка: ${response.status} ${response.statusText}`);
            console.error(`Детали ошибки: ${errorText}`);
            return false;
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error.message);
        console.error('Убедитесь, что backend сервер запущен на http://localhost:3001');
        return false;
    }
}

// Функция для вывода финального отчета
function printSummary(apiStatus, chatStatus) {
    console.log('\n===== ИТОГОВЫЙ ОТЧЕТ =====');
    
    if (apiStatus) {
        console.log('✅ Mistral API: Работает корректно');
    } else {
        console.log('❌ Mistral API: Проблема с подключением или авторизацией');
    }
    
    if (chatStatus) {
        console.log('✅ Чат с Дианой: Работает корректно');
    } else {
        console.log('❌ Чат с Дианой: Не работает');
    }
    
    console.log('\nРЕКОМЕНДАЦИИ:');
    if (!apiStatus) {
        console.log('1. Получите новый ключ API на https://console.mistral.ai/');
        console.log('2. Обновите ключ в файле backend/.env');
        console.log('3. Перезапустите backend сервер');
    } else if (!chatStatus) {
        console.log('1. Проверьте, запущен ли backend сервер');
        console.log('2. Проверьте логи сервера на наличие ошибок');
        console.log('3. Убедитесь, что сервер работает на порту 3001');
    } else {
        console.log('Всё работает корректно! Никаких действий не требуется.');
    }
}

// Запуск проверок
async function runTests() {
    const apiStatus = await checkMistralAPI();
    let chatStatus = false;
    
    // Проверяем чат только если API работает
    if (apiStatus) {
        console.log('\nMistral API работает корректно, проверяем чат с Дианой...');
        console.log('ВАЖНО: Убедитесь, что backend сервер запущен на http://localhost:3001');
        console.log('Если сервер не запущен, запустите его командой start-backend.bat');
        
        // Даем пользователю время запустить сервер, если он еще не запущен
        console.log('\nПроверка чата с Дианой начнется через 5 секунд...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        chatStatus = await testChatDiana();
    } else {
        console.log('\nПроблемы с Mistral API, пропускаем проверку чата с Дианой');
    }
    
    printSummary(apiStatus, chatStatus);
}

runTests();
