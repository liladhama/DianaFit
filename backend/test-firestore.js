// Тест для проверки работы Firestore
import { readUserData, writeUserData } from './userDataStorage.js';

const testUserId = 'test_user_123';

async function testFirestore() {
  console.log('🧪 Начинаем тест Firestore...');
  
  try {
    // Тест 1: Чтение несуществующего пользователя
    console.log('\n📖 Тест 1: Чтение несуществующего пользователя');
    const emptyUser = await readUserData(testUserId);
    console.log('Результат:', emptyUser);
    
    // Тест 2: Создание и запись данных пользователя
    console.log('\n✍️ Тест 2: Создание и запись данных пользователя');
    const userData = {
      userId: testUserId,
      isPremium: false,
      quiz: {
        age: 25,
        weight: 70,
        height: 170,
        goal: 'lose_weight'
      },
      dailyProgress: {
        '2025-01-16': {
          calories: 1500,
          water: 2.5,
          steps: 8000
        }
      },
      dialogHistory: [
        {
          type: 'user',
          message: 'Привет!',
          timestamp: new Date().toISOString()
        },
        {
          type: 'assistant',
          message: 'Привет! Как дела?',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    await writeUserData(testUserId, userData);
    console.log('✅ Данные успешно записаны');
    
    // Тест 3: Чтение записанных данных
    console.log('\n📖 Тест 3: Чтение записанных данных');
    const retrievedUser = await readUserData(testUserId);
    console.log('Результат:', JSON.stringify(retrievedUser, null, 2));
    
    // Тест 4: Обновление данных
    console.log('\n🔄 Тест 4: Обновление данных');
    const updatedData = {
      ...retrievedUser,
      isPremium: true,
      dailyProgress: {
        ...retrievedUser.dailyProgress,
        '2025-01-17': {
          calories: 1800,
          water: 3.0,
          steps: 10000
        }
      }
    };
    
    await writeUserData(testUserId, updatedData);
    console.log('✅ Данные успешно обновлены');
    
    // Тест 5: Финальная проверка
    console.log('\n🔍 Тест 5: Финальная проверка');
    const finalUser = await readUserData(testUserId);
    console.log('Финальный результат:', JSON.stringify(finalUser, null, 2));
    
    console.log('\n🎉 Все тесты прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка во время тестирования:', error);
  }
}

// Запуск тестов
testFirestore();
