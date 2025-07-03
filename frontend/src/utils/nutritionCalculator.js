// Базовые коэффициенты активности
const ACTIVITY_MULTIPLIERS = {
  'низкий': 1.2,
  'средний': 1.375,
  'высокий': 1.55,
  'очень высокий': 1.725
};

// Базовые коэффициенты стресса
const STRESS_MULTIPLIERS = {
  'низкий': 1,
  'средний': 1.1,
  'высокий': 1.2
};

// Коэффициенты для разных типов диет
const DIET_RATIOS = {
  'meat': {
    protein: 0.3,
    fats: 0.3,
    carbs: 0.4
  },
  'vegetarian': {
    protein: 0.25,
    fats: 0.25,
    carbs: 0.5
  },
  'vegan': {
    protein: 0.2,
    fats: 0.25,
    carbs: 0.55
  },
  'keto': {
    protein: 0.3,
    fats: 0.65,
    carbs: 0.05
  }
};

// Калории в граммах для каждого макронутриента
const CALORIES_PER_GRAM = {
  protein: 4,
  fats: 9,
  carbs: 4
};

/**
 * Рассчитывает базовый обмен веществ (BMR)
 */
export function calculateBMR(userData) {
  const { 
    gender, 
    age, 
    weight, 
    height,
    activityLevel,
    stressLevel 
  } = userData;

  // Формула Миффлина-Сан Жеора
  let bmr;
  if (gender === 'female') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  }

  // Учитываем уровень активности
  bmr *= ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;

  // Учитываем уровень стресса
  bmr *= STRESS_MULTIPLIERS[stressLevel] || 1;

  return Math.round(bmr);
}

/**
 * Рассчитывает макронутриенты на основе BMR и типа диеты
 */
export function calculateMacros(bmr, dietType) {
  const ratios = DIET_RATIOS[dietType] || DIET_RATIOS.meat;
  
  // Распределяем калории по макронутриентам
  const proteinCals = bmr * ratios.protein;
  const fatsCals = bmr * ratios.fats;
  const carbsCals = bmr * ratios.carbs;

  // Конвертируем калории в граммы
  return {
    protein: Math.round(proteinCals / CALORIES_PER_GRAM.protein),
    fats: Math.round(fatsCals / CALORIES_PER_GRAM.fats),
    carbs: Math.round(carbsCals / CALORIES_PER_GRAM.carbs),
    calories: Math.round(bmr)
  };
}

/**
 * Адаптирует БЖУ под цели пользователя
 */
export function adaptMacrosToGoals(macros, userData) {
  const { goal_weight_loss, goal_type } = userData;
  let result = { ...macros };

  switch (goal_type) {
    case 'weight_loss':
      // Создаем дефицит калорий
      const deficit = goal_weight_loss * 1100; // ~1100 ккал на 1 кг в неделю
      const deficitPerDay = Math.round(deficit / 7);
      
      result.calories -= deficitPerDay;
      result.carbs = Math.round((result.calories * DIET_RATIOS[userData.diet_type].carbs) / CALORIES_PER_GRAM.carbs);
      break;

    case 'muscle_gain':
      // Создаем профицит калорий и увеличиваем белок
      result.calories += 300;
      result.protein += 20;
      result.carbs = Math.round((result.calories * 0.5) / CALORIES_PER_GRAM.carbs);
      break;

    case 'maintenance':
    default:
      // Оставляем как есть
      break;
  }

  return result;
}

export default {
  calculateBMR,
  calculateMacros,
  adaptMacrosToGoals
};
