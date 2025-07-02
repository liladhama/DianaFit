const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001';

async function testBackend() {
  console.log('🧪 Тестирование DianaFit Backend...\n');

  try {
    // Тест 1: Проверка статуса сервера
    console.log('1️⃣ Проверка статуса сервера...');
    const statusResponse = await fetch(`${API_URL}/`);
    const statusText = await statusResponse.text();
    console.log(`   ✅ Ответ: ${statusText}\n`);

    // Тест 2: Получение конфига квиза
    console.log('2️⃣ Проверка конфига квиза...');
    const quizResponse = await fetch(`${API_URL}/api/quiz-config`);
    if (quizResponse.ok) {
      const quizData = await quizResponse.json();
      console.log(`   ✅ Конфиг загружен: ${quizData.slides?.length || 0} слайдов\n`);
    } else {
      console.log(`   ❌ Ошибка: ${quizResponse.status}\n`);
    }

    // Тест 3: Тест чата с Дианой
    console.log('3️⃣ Тестирование чата с ИИ агентом Дианой...');
    const chatResponse = await fetch(`${API_URL}/api/chat-diana`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Привет! Как дела?',
        context: 'Начало разговора'
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log(`   ✅ Ответ от Дианы: ${chatData.response?.substring(0, 100)}...\n`);
    } else {
      console.log(`   ❌ Ошибка чата: ${chatResponse.status}\n`);
    }

    // Тест 4: Тест расчета плана
    console.log('4️⃣ Тестирование расчета плана...');
    const planResponse = await fetch(`${API_URL}/api/calculate-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        age: 25,
        weight: 65,
        height: 170,
        goal: 'похудеть'
      })
    });

    if (planResponse.ok) {
      const planData = await planResponse.json();
      console.log(`   ✅ План создан: ${planData.plan?.substring(0, 100)}...\n`);
    } else {
      console.log(`   ❌ Ошибка создания плана: ${planResponse.status}\n`);
    }

    console.log('🎉 Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка подключения к серверу:', error.message);
    console.log('\n💡 Убедитесь, что backend запущен: npm start в папке backend');
  }
}

testBackend();
