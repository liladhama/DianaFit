// Тест новой логики расчета прогресса
// Тестируем расчет процента выполнения по количеству заданий, а не по дням

// Моделируем данные прогресса пользователя за неделю
const mockProgressData = {
  dailyProgress: {
    "2025-07-03": {
      ate: false,
      workout: false,
      tasks: [
        { name: "Завтрак", type: "meal", done: true },
        { name: "Перекус", type: "meal", done: false },
        { name: "Обед", type: "meal", done: true },
        { name: "Полдник", type: "meal", done: true },
        { name: "Ужин", type: "meal", done: false },
        { name: "Приседания", type: "exercise", done: true },
        { name: "Планка", type: "exercise", done: false },
        { name: "steps", type: "steps", done: false, value: 5000 }
      ]
    },
    "2025-07-04": {
      ate: true,
      workout: true,
      tasks: [
        { name: "Завтрак", type: "meal", done: true },
        { name: "Перекус", type: "meal", done: true },
        { name: "Обед", type: "meal", done: true },
        { name: "Полдник", type: "meal", done: true },
        { name: "Ужин", type: "meal", done: true },
        { name: "Отжимания", type: "exercise", done: true },
        { name: "Пресс", type: "exercise", done: true },
        { name: "steps", type: "steps", done: true, value: 10000 }
      ]
    },
    "2025-07-05": {
      ate: false,
      workout: false,
      tasks: [
        { name: "Завтрак", type: "meal", done: false },
        { name: "Перекус", type: "meal", done: true },
        { name: "Обед", type: "meal", done: false },
        { name: "Полдник", type: "meal", done: false },
        { name: "Ужин", type: "meal", done: true },
        { name: "Йога", type: "exercise", done: false },
        { name: "steps", type: "steps", done: false, value: 3000 }
      ]
    },
    "2025-07-06": {
      ate: true,
      workout: false,
      tasks: [
        { name: "Завтрак", type: "meal", done: true },
        { name: "Перекус", type: "meal", done: true },
        { name: "Обед", type: "meal", done: true },
        { name: "Полдник", type: "meal", done: true },
        { name: "Ужин", type: "meal", done: false },
        { name: "Кардио", type: "exercise", done: false },
        { name: "steps", type: "steps", done: true, value: 8500 }
      ]
    },
    "2025-07-07": {
      ate: true,
      workout: true,
      tasks: [
        { name: "Завтрак", type: "meal", done: true },
        { name: "Перекус", type: "meal", done: true },
        { name: "Обед", type: "meal", done: true },
        { name: "Полдник", type: "meal", done: true },
        { name: "Ужин", type: "meal", done: true },
        { name: "Силовая", type: "exercise", done: true },
        { name: "Растяжка", type: "exercise", done: true },
        { name: "steps", type: "steps", done: true, value: 12000 }
      ]
    },
    "2025-07-08": {
      ate: false,
      workout: false,
      tasks: [
        { name: "Завтрак", type: "meal", done: true },
        { name: "Перекус", type: "meal", done: false },
        { name: "Обед", type: "meal", done: true },
        { name: "Полдник", type: "meal", done: false },
        { name: "Ужин", type: "meal", done: false },
        { name: "steps", type: "steps", done: false, value: 4000 }
      ]
    },
    "2025-07-09": {
      ate: false,
      workout: false,
      tasks: [
        { name: "Завтрак", type: "meal", done: true },
        { name: "Перекус", type: "meal", done: true },
        { name: "Обед", type: "meal", done: false },
        { name: "Полдник", type: "meal", done: true },
        { name: "Ужин", type: "meal", done: false },
        { name: "steps", type: "steps", done: false, value: 6000 }
      ]
    }
  }
};

// Новая логика расчета прогресса (как в ProfilePage.js)
function calculateNewProgress(progressData) {
  const dailyProgress = progressData.dailyProgress || {};
  
  if (Object.keys(dailyProgress).length === 0) {
    return { workouts: 0, nutrition: 0 };
  }
  
  let completedMeals = 0;
  let totalMeals = 0;
  let completedActivities = 0;
  let totalActivities = 0;
  
  // Считаем за последние 7 дней
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  Object.entries(dailyProgress).forEach(([date, dayData]) => {
    const dayDate = new Date(date);
    if (dayDate >= weekAgo && dayDate <= now) {
      const tasks = dayData.tasks || [];
      
      // Считаем приемы пищи
      const mealTasks = tasks.filter(task => task.type === 'meal');
      totalMeals += mealTasks.length;
      completedMeals += mealTasks.filter(task => task.done).length;
      
      // Считаем активности (все задания кроме приемов пищи)
      const activityTasks = tasks.filter(task => 
        task.type !== 'meal'
      );
      totalActivities += activityTasks.length;
      completedActivities += activityTasks.filter(task => task.done).length;
    }
  });
  
  // Если данных по питанию недостаточно, используем ожидаемое количество
  const expectedMealsPerWeek = 35; // 5 приемов × 7 дней
  if (totalMeals === 0) {
    totalMeals = expectedMealsPerWeek;
  }
  
  const nutritionProgress = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;
  const workoutProgress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  
  return {
    workouts: workoutProgress,
    nutrition: nutritionProgress,
    details: {
      completedMeals,
      totalMeals,
      completedActivities,
      totalActivities
    }
  };
}

// Старая логика расчета (по дням)
function calculateOldProgress(progressData) {
  const dailyProgress = progressData.dailyProgress || {};
  const totalDays = Object.keys(dailyProgress).length;
  
  if (totalDays === 0) {
    return { workouts: 0, nutrition: 0 };
  }
  
  let completedMeals = 0;
  let totalMeals = 0;
  let completedWorkouts = 0;
  let totalWorkouts = 0;
  
  Object.values(dailyProgress).forEach(day => {
    if (day.ate !== undefined) {
      totalMeals++;
      if (day.ate) completedMeals++;
    }
    if (day.workout !== undefined) {
      totalWorkouts++;
      if (day.workout) completedWorkouts++;
    }
  });
  
  const nutritionProgress = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;
  const workoutProgress = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  
  return {
    workouts: workoutProgress,
    nutrition: nutritionProgress,
    details: {
      completedMeals,
      totalMeals,
      completedWorkouts,
      totalWorkouts
    }
  };
}

// Тестируем обе логики
console.log("=== ТЕСТ ЛОГИКИ РАСЧЕТА ПРОГРЕССА ===\n");

console.log("📊 СТАРАЯ ЛОГИКА (по дням):");
const oldResult = calculateOldProgress(mockProgressData);
console.log(`🍽️ Питание: ${oldResult.nutrition}% (${oldResult.details.completedMeals}/${oldResult.details.totalMeals} дней)`);
console.log(`💪 Тренировки: ${oldResult.workouts}% (${oldResult.details.completedWorkouts}/${oldResult.details.totalWorkouts} дней)\n`);

console.log("📊 НОВАЯ ЛОГИКА (по заданиям):");
const newResult = calculateNewProgress(mockProgressData);
console.log(`🍽️ Питание: ${newResult.nutrition}% (${newResult.details.completedMeals}/${newResult.details.totalMeals} приемов пищи)`);
console.log(`💪 Активности: ${newResult.workouts}% (${newResult.details.completedActivities}/${newResult.details.totalActivities} заданий)\n`);

console.log("=== АНАЛИЗ РАЗЛИЧИЙ ===");
console.log(`Разница в питании: ${newResult.nutrition - oldResult.nutrition}%`);
console.log(`Разница в тренировках: ${newResult.workouts - oldResult.workouts}%`);

console.log("\n🎯 ПРЕИМУЩЕСТВА НОВОЙ ЛОГИКИ:");
console.log("✅ Учитывает реальное количество выполненных приемов пищи");
console.log("✅ Считает все активности (упражнения + шаги)");
console.log("✅ Более точно отражает прогресс пользователя");
console.log("✅ Мотивирует выполнять конкретные задания, а не просто \"хорошие дни\"");

// Ручной подсчет для проверки
let manualMealCount = 0;
let manualMealCompleted = 0;
let manualActivityCount = 0;
let manualActivityCompleted = 0;

Object.values(mockProgressData.dailyProgress).forEach(day => {
  const tasks = day.tasks || [];
  
  // Подсчет приемов пищи
  tasks.filter(t => t.type === 'meal').forEach(t => {
    manualMealCount++;
    if (t.done) manualMealCompleted++;
  });
  
  // Подсчет активностей
  tasks.filter(t => t.type !== 'meal').forEach(t => {
    manualActivityCount++;
    if (t.done) manualActivityCompleted++;
  });
});

console.log("\n🔍 РУЧНАЯ ПРОВЕРКА:");
console.log(`Приемы пищи: ${manualMealCompleted}/${manualMealCount} = ${Math.round((manualMealCompleted/manualMealCount)*100)}%`);
console.log(`Активности: ${manualActivityCompleted}/${manualActivityCount} = ${Math.round((manualActivityCompleted/manualActivityCount)*100)}%`);
