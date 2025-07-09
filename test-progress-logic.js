// Тестируем новую логику расчета прогресса
console.log('🧪 Тестируем новую логику расчета прогресса...\n');

// Симулируем данные из файла прогресса
const mockProgressData = {
  dailyProgress: {
    "2025-07-09": {
      ate: false,
      workout: false,
      tasks: [
        { name: "Завтрак", type: "meal", done: true },
        { name: "Перекус", type: "meal", done: true },
        { name: "Обед", type: "meal", done: false },
        { name: "Полдник", type: "meal", done: true },
        { name: "Ужин", type: "meal", done: false },
        { name: "steps", type: "steps", done: false, value: 0 }
      ]
    }
  }
};

function calculateNutritionProgress(userHistory) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dailyProgress = userHistory.dailyProgress || {};
  
  let completedMeals = 0;
  
  Object.entries(dailyProgress).forEach(([date, dayData]) => {
    const dayDate = new Date(date);
    if (dayDate >= weekAgo && dayDate <= now) {
      const tasks = dayData.tasks || [];
      const mealTasks = tasks.filter(task => task.type === 'meal');
      completedMeals += mealTasks.filter(task => task.done).length;
    }
  });
  
  // Всегда считаем от недельной нормы 35 приемов пищи
  const expectedMealsPerWeek = 35;
  
  return Math.round((completedMeals / expectedMealsPerWeek) * 100);
}

function calculateWorkoutProgress(userHistory) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dailyProgress = userHistory.dailyProgress || {};
  
  let totalActivities = 0;
  let completedActivities = 0;
  
  Object.entries(dailyProgress).forEach(([date, dayData]) => {
    const dayDate = new Date(date);
    if (dayDate >= weekAgo && dayDate <= now) {
      const tasks = dayData.tasks || [];
      const activityTasks = tasks.filter(task => task.type !== 'meal');
      
      totalActivities += activityTasks.length;
      completedActivities += activityTasks.filter(task => task.done).length;
    }
  });
  
  return totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
}

// Тестируем
console.log('📊 Исходные данные:');
console.log('- Выполненные приемы пищи: 3 (Завтрак, Перекус, Полдник)');
console.log('- Невыполненные приемы пищи: 2 (Обед, Ужин)');
console.log('- Активности: 1 (шаги - не выполнено)');
console.log('');

const nutritionProgress = calculateNutritionProgress(mockProgressData);
const workoutProgress = calculateWorkoutProgress(mockProgressData);

console.log('🧮 Расчеты:');
console.log(`📊 Питание: ${nutritionProgress}% (3 из 35 приемов пищи за неделю)`);
console.log(`💪 Тренировки: ${workoutProgress}% (0 из 1 активности)`);
console.log('');

console.log('✅ Ожидаемые результаты:');
console.log('- Питание: ~9% (3/35 = 8.57% ≈ 9%)');
console.log('- Тренировки: 0% (0/1 = 0%)');
console.log('');

if (nutritionProgress === 9 && workoutProgress === 0) {
  console.log('🎉 Тест ПРОШЕЛ! Логика работает правильно.');
} else {
  console.log('❌ Тест НЕ ПРОШЕЛ! Нужно проверить логику.');
  console.log(`   Получено: питание ${nutritionProgress}%, тренировки ${workoutProgress}%`);
  console.log(`   Ожидалось: питание 9%, тренировки 0%`);
}
