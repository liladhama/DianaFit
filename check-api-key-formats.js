// Скрипт для проверки различных форматов API ключа
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function checkApiKeyFormats() {
    // Получаем исходный ключ из .env
    const originalApiKey = process.env.MISTRAL_API_KEY;
    if (!originalApiKey) {
        console.error('API ключ не найден в .env файле!');
        return;
    }

    console.log(`Проверка различных форматов API ключа: ${originalApiKey.substring(0, 4)}...${originalApiKey.substring(originalApiKey.length - 4)}`);
    
    // Форматы ключа для проверки
    const keyFormats = [
        { 
            name: 'Исходный ключ', 
            key: originalApiKey 
        },
        { 
            name: 'С префиксом Bearer', 
            key: `Bearer ${originalApiKey}`,
            headerOnly: true
        },
        { 
            name: 'С префиксом mis_', 
            key: `mis_${originalApiKey}` 
        },
        { 
            name: 'С префиксом sk-', 
            key: `sk-${originalApiKey}` 
        }
    ];

    // Проверяем каждый формат
    for (const format of keyFormats) {
        console.log(`\nПроверка формата: ${format.name}`);
        
        try {
            // Подготавливаем заголовки
            const headers = {
                'Authorization': format.headerOnly ? format.key : `Bearer ${format.key}`
            };
            
            console.log(`Заголовок Authorization: ${headers.Authorization.substring(0, 15)}...`);
            
            // Делаем запрос к API для проверки
            const response = await fetch('https://api.mistral.ai/v1/models', {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ УСПЕШНО! Формат ключа работает!');
                console.log('Доступные модели:');
                data.data.forEach(model => {
                    console.log(`- ${model.id}`);
                });
                
                // Сохраняем рабочий формат в .env
                if (format.name !== 'Исходный ключ' && !format.headerOnly) {
                    console.log('\nОбновляем .env файл с рабочим форматом ключа...');
                    // Здесь должен быть код для обновления .env
                }
                
                // Выходим после первого успешного формата
                return;
            } else {
                const errorText = await response.text();
                console.log(`❌ Ошибка: ${response.status} ${response.statusText}`);
                console.log(`Детали: ${errorText}`);
            }
        } catch (error) {
            console.log(`❌ Ошибка при проверке: ${error.message}`);
        }
    }
    
    console.log('\n⚠️ Ни один из проверенных форматов не работает.');
    console.log('Рекомендации:');
    console.log('1. Проверьте, что ключ API скопирован без лишних пробелов');
    console.log('2. Получите новый ключ API на сайте Mistral AI');
    console.log('3. Проверьте документацию Mistral AI для правильного формата ключа');
}

checkApiKeyFormats();
