// Скрипт для проверки статуса Mistral API
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function checkMistralAPI() {
    const apiKey = process.env.MISTRAL_API_KEY;
    
    if (!apiKey) {
        console.error('ОШИБКА: MISTRAL_API_KEY не найден в .env файле');
        console.log('Пожалуйста, убедитесь, что файл .env содержит действительный ключ API Mistral.');
        console.log('Формат ключа должен быть: MISTRAL_API_KEY=ваш_ключ_api');
        console.log('Вы можете получить ключ на https://console.mistral.ai/');
        return;
    }
    
    console.log(`API ключ найден: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`Длина ключа: ${apiKey.length} символов`);
    
    // Проверка формата ключа
    console.log('\nПроверка формата ключа:');
    if (apiKey.includes(' ')) {
        console.error('⚠️ ВНИМАНИЕ: Ключ содержит пробелы, которые могут вызвать проблемы');
    }
    if (apiKey.includes('\n') || apiKey.includes('\r')) {
        console.error('⚠️ ВНИМАНИЕ: Ключ содержит символы перевода строки, которые могут вызвать проблемы');
    }
    
    try {
        console.log('Проверка соединения с Mistral API...');
        const response = await fetch('https://api.mistral.ai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Соединение успешно установлено!');
            console.log('Доступные модели:');
            data.data.forEach(model => {
                console.log(`- ${model.id}`);
            });
            
            // Проверка простого запроса чата
            console.log('\nОтправка тестового запроса...');
            const chatResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'mistral-medium',
                    messages: [
                        { role: 'user', content: 'Привет, как дела?' }
                    ],
                    temperature: 0.3
                })
            });
            
            if (chatResponse.ok) {
                const chatData = await chatResponse.json();
                console.log('Тестовый запрос успешно выполнен!');
                console.log('Ответ от API:');
                console.log(chatData.choices[0].message.content);
                console.log('\nMistral API работает корректно.');
            } else {
                const errorText = await chatResponse.text();
                console.error(`Ошибка при выполнении тестового запроса: ${chatResponse.status}`);
                console.error(`Детали ошибки: ${errorText}`);
            }
        } else {
            const errorText = await response.text();
            console.error(`Ошибка соединения: ${response.status}`);
            console.error(`Детали ошибки: ${errorText}`);
            console.log('\nВозможные причины:');
            console.log('1. Недействительный API ключ');
            console.log('2. Истек срок действия ключа');
            console.log('3. Превышен лимит запросов');
            console.log('4. Проблемы с сервером Mistral AI');
        }
    } catch (error) {
        console.error('Ошибка при проверке API:', error);
    }
}

checkMistralAPI();
