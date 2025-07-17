// Тест чтения данных пользователя и миграции
const { readUserData, writeUserData } = require('./backend/firebaseAdmin');

async function testUserDataMigration() {
    console.log('🔍 ПРОВЕРКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ');
    console.log('================================\n');
    
    const userId = 'demo_user_local_test';
    
    try {
        // Читаем текущие данные пользователя
        console.log('📖 Читаем данные пользователя из Firestore...');
        const userData = await readUserData(userId);
        
        console.log('📊 Структура данных пользователя:');
        console.log('- userId:', userData.userId);
        console.log('- hasDailyProgress:', !!userData.dailyProgress);
        console.log('- hasProgressHistory:', !!userData.progressHistory);
        console.log('- hasProgramData:', !!userData.programData);
        
        if (userData.dailyProgress) {
            const dailyProgressDates = Object.keys(userData.dailyProgress);
            console.log('- dailyProgress дней:', dailyProgressDates.length);
            console.log('- последние даты:', dailyProgressDates.slice(-3));
            
            // Показываем примеры данных
            const latestDate = dailyProgressDates[dailyProgressDates.length - 1];
            if (latestDate) {
                const latestDay = userData.dailyProgress[latestDate];
                console.log(`- данные за ${latestDate}:`, {
                    ate: latestDay.ate,
                    workout: latestDay.workout,
                    tasksCount: Array.isArray(latestDay.tasks) ? latestDay.tasks.length : 0
                });
                
                if (Array.isArray(latestDay.tasks) && latestDay.tasks.length > 0) {
                    console.log('  задачи:');
                    latestDay.tasks.forEach((task, i) => {
                        console.log(`    ${i + 1}. ${task.name} (${task.type}): ${task.done ? '✅' : '❌'}`);
                    });
                }
            }
        }
        
        if (userData.progressHistory) {
            console.log('- progressHistory записей:', userData.progressHistory.length);
        } else {
            console.log('⚠️ progressHistory отсутствует - нужна миграция');
        }
        
        console.log('\n🔄 Тестируем UserProgressLogger...');
        
        // Имитируем UserProgressLogger
        const UserProgressLogger = require('./backend/userProgressLogger').default;
        const logger = new UserProgressLogger(userId);
        
        // Тестируем получение недельной истории
        const weeklyData = await logger.analyzeWeeklyProgressFromHistory();
        
        console.log('📈 Результат анализа недельного прогресса:');
        console.log('- Дней в истории:', weeklyData.summary.totalDays);
        console.log('- Питание:', `${weeklyData.summary.mealsCompletion}% (${weeklyData.summary.stats.completedMeals}/${weeklyData.summary.stats.totalMeals})`);
        console.log('- Тренировки:', `${weeklyData.summary.workoutsCompletion}% (${weeklyData.summary.stats.completedWorkouts}/${weeklyData.summary.stats.totalWorkouts})`);
        console.log('- Общий прогресс:', `${weeklyData.summary.overallCompletion}% (${weeklyData.summary.stats.completedTasks}/${weeklyData.summary.stats.totalTasks})`);
        
        if (weeklyData.summary.totalTasks === 0) {
            console.log('\n❌ ПРОБЛЕМА: Нет данных о задачах');
            console.log('💡 Возможные причины:');
            console.log('1. Пользователь еще не отмечал упражнения/питание');
            console.log('2. Данные не сохраняются при отметке выполнения');
            console.log('3. Структура tasks в dailyProgress неправильная');
        } else {
            console.log('\n✅ Данные найдены и обработаны успешно!');
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

// Запускаем тест
testUserDataMigration();
