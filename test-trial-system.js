const axios = require('axios');

// Тест системы ограничения доступа к TodayBlock после 3 дней
async function testTrialSystem() {
    const baseURL = 'https://dianafit.onrender.com';
    const testUsers = [
        'demo_user_local_test',
        'new_user_123',
        'expired_user_456'
    ];

    console.log('🧪 Тестирование системы пробного периода...\n');

    for (const userId of testUsers) {
        try {
            console.log(`👤 Тестируем пользователя: ${userId}`);
            
            // Получаем информацию о лимитах и днях использования
            const response = await axios.get(`${baseURL}/api/diana-limits/${userId}`);
            const data = response.data;
            
            console.log('📊 Статус пользователя:');
            console.log(`   - Премиум: ${data.isPremium ? '✅ Да' : '❌ Нет'}`);
            console.log(`   - Дней использования: ${data.daysUsed || 0}`);
            console.log(`   - Дней осталось: ${data.daysLeft || 0}`);
            console.log(`   - Пробный период истек: ${data.trialExpired ? '⏰ Да' : '🆓 Нет'}`);
            console.log(`   - Доступ к TodayBlock: ${data.canUseTodayBlock ? '✅ Разрешен' : '🔒 Запрещен'}`);
            console.log(`   - Доступ к недельному расписанию: ${data.canUseWeeklySchedule ? '✅ Разрешен' : '🔒 Запрещен'}`);
            
            // Определяем ожидаемое поведение в приложении
            if (data.isPremium) {
                console.log('🎯 Ожидаемое поведение: Полный доступ ко всем функциям');
            } else if (data.trialExpired) {
                console.log('🎯 Ожидаемое поведение: Только недельное расписание, TodayBlock заблокирован');
            } else {
                console.log(`🎯 Ожидаемое поведение: Доступ к TodayBlock (${data.daysLeft} дней осталось)`);
            }
            
            console.log('─'.repeat(50));
            
        } catch (error) {
            console.error(`❌ Ошибка для пользователя ${userId}:`, error.message);
            console.log('─'.repeat(50));
        }
    }

    // Тест сценария истечения пробного периода
    console.log('\n🎭 Симуляция сценариев:\n');
    
    console.log('📱 Сценарий 1: Новый пользователь (день 1)');
    console.log('   ✅ Показывается SplashScreen');
    console.log('   ✅ Потом уведомление Дианы (если есть)');
    console.log('   ✅ Затем TodayBlock');
    console.log('   ℹ️ Уведомление: "Пробный период: день 1 из 3"');
    
    console.log('\n📱 Сценарий 2: Пользователь на 3-й день');
    console.log('   ✅ Показывается SplashScreen');
    console.log('   ✅ Потом уведомление Дианы (если есть)');
    console.log('   ✅ Затем TodayBlock');
    console.log('   ⚠️ Уведомление: "Пробный период: день 3 из 3. Осталось 1 день"');
    
    console.log('\n📱 Сценарий 3: Пользователь после 3-го дня (триал истек)');
    console.log('   ✅ Показывается SplashScreen');
    console.log('   ✅ Потом уведомление Дианы (если есть)');
    console.log('   🔄 НО переход к недельному расписанию (не TodayBlock)');
    console.log('   🔒 TodayBlock заблокирован с уведомлением о подписке');
    console.log('   ❌ Уведомление: "Пробный период истек. Для доступа к Текущий день нужна подписка"');
    
    console.log('\n📱 Сценарий 4: Премиум пользователь');
    console.log('   ✅ Полный доступ ко всем функциям без ограничений');
}

// Запуск теста
testTrialSystem().catch(console.error);
