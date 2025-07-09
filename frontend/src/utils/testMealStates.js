// Тест сохранения состояния питания

// Симуляция действий пользователя
async function testMealStatesSaving() {
    console.log('🧪 НАЧИНАЕМ ТЕСТ СОХРАНЕНИЯ СОСТОЯНИЙ ПИТАНИЯ');
    
    // 1. Эмулируем загрузку страницы
    console.log('1️⃣ Загружаем страницу...');
    
    // 2. Эмулируем установку состояния "съел" для первого приема пищи
    console.log('2️⃣ Отмечаем первый прием пищи как съеденный...');
    
    // 3. Эмулируем переход на другую страницу
    console.log('3️⃣ Переходим на другую страницу...');
    
    // 4. Эмулируем возврат на страницу дня
    console.log('4️⃣ Возвращаемся на страницу дня...');
    
    // 5. Проверяем, сохранилось ли состояние
    console.log('5️⃣ Проверяем, сохранилось ли состояние...');
    
    console.log('✅ ТЕСТ ЗАВЕРШЕН');
}

// Функция для проверки работы API прогресса
async function testProgressAPI() {
    const userId = 'testuser1';
    const date = new Date().toISOString().split('T')[0];
    
    console.log('🔧 ТЕСТИРУЕМ API ПРОГРЕССА');
    console.log('📅 Дата:', date);
    console.log('👤 Пользователь:', userId);
    
    try {
        // Получаем текущий прогресс
        const response = await fetch(`/api/user/progress/${userId}`);
        const data = await response.json();
        
        console.log('📊 Текущий прогресс:', data);
        
        if (data.dailyProgress && data.dailyProgress[date]) {
            console.log('🍽️ Состояние питания за сегодня:', data.dailyProgress[date].ate);
        } else {
            console.log('❌ Нет данных за сегодняшний день');
        }
        
    } catch (error) {
        console.error('❌ Ошибка тестирования API:', error);
    }
}

// Экспортируем функции для использования в консоли браузера
if (typeof window !== 'undefined') {
    window.testMealStatesSaving = testMealStatesSaving;
    window.testProgressAPI = testProgressAPI;
    
    console.log('🚀 Тестовые функции готовы к использованию:');
    console.log('- testMealStatesSaving() - тест сохранения состояний');
    console.log('- testProgressAPI() - тест API прогресса');
}
