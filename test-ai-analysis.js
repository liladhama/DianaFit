// Тестирование AI анализа недели (симуляция 7-го дня)
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001'; // Замените на ваш URL бэкенда

async function testAIAnalysis() {
  const testUserId = 'demo_user_local_test'; // Тестовый ID пользователя
  
  console.log('🧪 Тестируем AI анализ недели...');
  console.log('📅 Симулируем 7-й день недели');
  console.log('👤 Тестовый userId:', testUserId);
  
  try {
    // Тестируем эндпоинт напрямую
    const response = await fetch(`${API_URL}/api/openai-diana-analyze`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        userId: testUserId 
      })
    });
    
    console.log('📊 Статус ответа:', response.status);
    console.log('📋 Headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка HTTP:', response.status, response.statusText);
      console.error('📄 Текст ошибки:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Успешный ответ от API:');
    console.log('📝 Полученные данные:', data);
    
    if (data.message) {
      console.log('🤖 AI Анализ от Дианы:');
      console.log('──────────────────────────────');
      console.log(data.message);
      console.log('──────────────────────────────');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    
    if (error.message.includes('Failed to fetch')) {
      console.error('🚨 Возможно, бэкенд не запущен!');
      console.error('💡 Запустите бэкенд: cd backend && node index.js');
    }
  }
}

// Запускаем тест
testAIAnalysis();
