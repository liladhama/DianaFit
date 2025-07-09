// Заглушка API для генерации и выдачи недельного плана
import express from 'express';
const router = express.Router();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import recipeUtils from './utils/recipeUtils.js';
import { callMistralAI } from './utils/aiUtils.js';
import mealPlanCalculator from './utils/mealPlanCalculator.js';

// В памяти (для примера)
const programs = {};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Удалена загрузка knowledge_base_full.jsonl, так как она не используется

// --- Глобальные константы для распределения КБЖУ и типов диет ---
const mealTypes = ['Завтрак', 'Перекус', 'Обед', 'Полдник', 'Ужин'];
const mealPercents = [0.25, 0.10, 0.35, 0.10, 0.20];
const dietTypeHierarchy = {
  vegan: ['vegan'],
  vegetarian: ['vegan', 'vegetarian'],
  vegetarian_egg: ['vegan', 'vegetarian', 'vegetarian_egg'],
  fish: ['vegan', 'vegetarian', 'vegetarian_egg', 'fish'],
  meat: ['vegan', 'vegetarian', 'vegetarian_egg', 'fish', 'meat'],
};

// Функции для получения тренировок
function getGymWorkoutTitle(dayNumber) {
  const titles = {
    1: 'День 1 | Силовая: ягодицы, бицепс',
    2: 'День 2 | Плечи, трицепс, пресс',
    3: 'День 3 | Спина, бицепс',
    4: 'День 4 | Ягодицы, квадрицепс, икры'
  };
  return titles[((dayNumber - 1) % 4) + 1];
}

function getHomeWorkoutTitle(dayNumber) {
  const titles = {
    1: 'День 1 | К (вт) — 5 кругов, отдых 1 мин',
    2: 'День 2 | Ф (нп) — 5 кругов',
    3: 'День 3 | T — 20 с работа / 10 с отдых, 6 кругов',
    4: 'День 4 | HIIT (вт) — 40 с работа / 20 с отдых',
    5: 'День 5 | К (нп) — 5 кругов, бег на месте'
  };
}

function getGymExercises(dayNumber) {
  const exercisesByDay = {
    1: [
      { name: 'Ягодичный мост в смите', reps: 15 },
      { name: 'Мах ногой назад в кроссовере', reps: 15 },
      { name: 'Гуд Морнинг', reps: 15 }
    ],
    2: [
      { name: 'Жим Арнольда дроп-сет', reps: 16 },
      { name: 'Тяга в нижнем кроссовере к подбородку', reps: 15 },
      { name: 'Отведения рук с гантелями дроп-сет', reps: 15 }
    ],
    3: [
      { name: 'Подтягивания в гравитроне', reps: 12 },
      { name: 'Горизонтальная тяга', reps: 15 },
      { name: 'Тяга гантели в наклоне', reps: 15 }
    ],
    4: [
      { name: 'Разгибание ног сидя дроп-сет', reps: 15 },
      { name: 'Выпады в смите', reps: 15 },
      { name: 'Фронтальный присед', reps: 12 }
    ]
  };
  return exercisesByDay[((dayNumber - 1) % 4) + 1];
}

function getHomeExercises(dayNumber) {
  const exercisesByDay = {
    1: [
      { name: 'Приседания с шагами вперёд', reps: 12 },
      { name: 'Обратная планка с подъёмом колена', reps: 18 },
      { name: 'Берёзка', reps: 18 }
    ],
    2: [
      { name: 'Приседания с захлёстом ноги назад', reps: 10 },
      { name: 'Планка с махом ноги назад', reps: 8 },
      { name: 'Прыжок в планку из положения приседа', reps: 12 }
    ],
    3: [
      { name: 'Прыгающий джек', reps: 20 },
      { name: 'Присед + выпад назад', reps: 15 },
      { name: 'Книжка сидя на ягодицах', reps: 20 }
    ],
    4: [
      { name: 'Выход в планку из положения стоя', reps: 12 },
      { name: 'Скручивания лёжа', reps: 20 },
      { name: 'Присед + гудмонинг', reps: 15 }
    ],
    5: [
      { name: 'Выпад + подъём колена', reps: 12 },
      { name: 'Планка', reps: 30 },
      { name: 'Ягодичный мостик на 1 ноге', reps: 15 }
    ]
  };
  return exercisesByDay[((dayNumber - 1) % 5) + 1];
}

// POST /api/program — генерация и сохранение полной программы через ИИ
router.post('/program', async (req, res) => {
  const { userId, profile } = req.body;
  const programId = userId + '-' + Date.now();
  const startDate = profile.start_date || new Date().toISOString().slice(0, 10);
  const workoutsPerWeek = profile.workouts_per_week || 3; // по умолчанию 3 тренировки
  const location = profile.gym_or_home || 'home'; // зал или дом

  // --- ЗАГЛУШКА: возвращаем фейковый план без вызова ИИ ---
  const days = Array.from({ length: 7 }).map((_, i) => {
    const isWorkoutDay = i < workoutsPerWeek; // первые N дней недели - тренировочные
    
    return {
      title: `День ${i + 1}`,
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      workout: isWorkoutDay ? {
        name: location === 'gym' ? `Тренировка в зале ${i + 1}` : `Домашняя тренировка ${i + 1}`,
        title: location === 'gym' ? getGymWorkoutTitle(i + 1) : getHomeWorkoutTitle(i + 1),
        exercises: location === 'gym' ? getGymExercises(i + 1) : getHomeExercises(i + 1)
      } : null,
      meals: [
        { name: 'Завтрак', menu: 'Овсянка, банан, чай' },
        { name: 'Обед', menu: 'Курица, гречка, салат' },
        { name: 'Ужин', menu: 'Творог, яблоко' }
      ],
      completedWorkout: false,
      completedMeals: false,
      completedExercises: isWorkoutDay ? [false, false, false] : [],
      completedMealsArr: [false, false, false]
    };
  });
  
  programs[programId] = { userId, profile, days };
  res.json({ success: true, programId });
});

// GET /api/program/week?programId=...&week=1
router.get('/program/week', (req, res) => {
  const { programId, week = 1 } = req.query;
  const program = programs[programId];
  if (!program) return res.status(404).json({ error: 'not found' });
  const start = (week - 1) * 7;
  const days = program.days.slice(start, start + 7);
  res.json({
    weekStart: days[0]?.date,
    days
  });
});

// GET /api/program/week-stats?programId=...&week=1
router.get('/program/week-stats', (req, res) => {
  const { programId, week = 1 } = req.query;
  const program = programs[programId];
  if (!program) return res.status(404).json({ error: 'not found' });
  const start = (week - 1) * 7;
  const days = program.days.slice(start, start + 7);
  const stats = {
    total: days.length,
    workoutDone: days.filter(d => d.completedWorkout).length,
    mealsDone: days.filter(d => d.completedMeals).length,
    workoutMissed: days.filter(d => d.workout && !d.completedWorkout).length,
    mealsMissed: days.filter(d => d.meals && !d.completedMeals).length,
  };
  res.json(stats);
});

// PATCH /api/program/day-complete
router.patch('/program/day-complete', (req, res) => {
  const { programId, date, completedWorkout, completedMeals, completedExercises, completedMealsArr } = req.body;
  const program = programs[programId];
  if (!program) return res.status(404).json({ error: 'not found' });
  const day = program.days.find(d => d.date === date);
  if (!day) return res.status(404).json({ error: 'day not found' });
  if (typeof completedWorkout === 'boolean') day.completedWorkout = completedWorkout;
  if (typeof completedMeals === 'boolean') day.completedMeals = completedMeals;
  if (Array.isArray(completedExercises)) day.completedExercises = completedExercises;
  if (Array.isArray(completedMealsArr)) day.completedMealsArr = completedMealsArr;
  res.json({ success: true });
});

// Функция генерации персонального месячного расписания
function generateMonthlySchedule(profile) {
  const workoutsPerWeek = profile.workouts_per_week || 3;
  const location = profile.gym_or_home || 'home';
  const startDate = new Date(profile.start_date || new Date());
  const goal = profile.weight_loss || 'weight_loss';
  const level = profile.training_level || 'beginner';
  
  // Создаем расписание на 30 дней
  const days = [];
  
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dayOfWeek = currentDate.getDay(); // 0 = воскресенье, 1 = понедельник
    const weekNumber = Math.floor(i / 7) + 1;
    const dayInWeek = i % 7;
    
    // Определяем, тренировочный ли это день
    let isWorkoutDay = false;
    if (workoutsPerWeek === 2) {
      isWorkoutDay = dayOfWeek === 1 || dayOfWeek === 4; // пн, чт
    } else if (workoutsPerWeek === 3) {
      isWorkoutDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5; // пн, ср, пт
    } else if (workoutsPerWeek === 4) {
      isWorkoutDay = dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5; // пн, вт, чт, пт
    } else if (workoutsPerWeek === 5) {
      isWorkoutDay = dayOfWeek >= 1 && dayOfWeek <= 5; // пн-пт
    }
    
    const workoutNumber = Math.floor(i / 7) * workoutsPerWeek + (dayInWeek < workoutsPerWeek ? dayInWeek + 1 : 1);
    
    const day = {
      date: currentDate.toISOString().slice(0, 10),
      title: currentDate.toLocaleDateString('ru-RU', { weekday: 'long' }),
      dayNumber: i + 1,
      weekNumber,
      isWorkoutDay,
      workout: isWorkoutDay ? generateWorkout(workoutNumber, location, level, goal) : null,
      meals: generateMeals(goal, profile),
      dailySteps: 0,
      dailyStepsGoal: getDailyStepsGoal(profile),
      completedExercises: isWorkoutDay ? new Array(3).fill(false) : [],
      completedMealsArr: new Array(5).fill(false),
      completedWorkout: false,
      completedMeals: false
    };
    
    days.push(day);
  }
  
  return days;
}

// Генерация тренировки для конкретного дня
function generateWorkout(workoutNumber, location, level, goal) {
  if (location === 'gym') {
    return {
      title: getGymWorkoutTitle(workoutNumber),
      exercises: getGymExercises(workoutNumber),
      duration: level === 'beginner' ? 45 : level === 'intermediate' ? 60 : 75,
      difficulty: level,
      focus: getWorkoutFocus(workoutNumber, goal)
    };
  } else {
    return {
      title: getHomeWorkoutTitle(workoutNumber),
      exercises: getHomeExercises(workoutNumber),
      duration: level === 'beginner' ? 30 : level === 'intermediate' ? 45 : 60,
      difficulty: level,
      focus: getWorkoutFocus(workoutNumber, goal)
    };
  }
}

// Определение фокуса тренировки
function getWorkoutFocus(workoutNumber, goal) {
  const focuses = {
    weight_loss: ['Кардио + силовая', 'HIIT', 'Функциональная', 'Жиросжигание'],
    muscle_gain: ['Силовая', 'Масса', 'Функциональная', 'Рельеф'],
    maintenance: ['Общая физподготовка', 'Функциональная', 'Кардио', 'Силовая']
  };
  
  const focusArray = focuses[goal] || focuses.weight_loss;
  return focusArray[(workoutNumber - 1) % focusArray.length];
}

// Генерация плана питания с учетом типа диеты и предотвращением дублирования
function generateMeals(goal, profile) {
  // --- Всегда используем итоговую цель пользователя (goal: 3, 4, 5) ---
  let numericGoal = Number(profile.goal);
  if (![3, 4, 5].includes(numericGoal)) {
    numericGoal = Number(profile.goal_weight_loss);
  }
  if (![3, 4, 5].includes(numericGoal)) {
    numericGoal = 4; // дефолт
  }
  goal = numericGoal;

  // Базовый метаболизм
  let bmr;
  const sex = profile.sex || 'female';
  const age = profile.age || 25;
  const weight = profile.weight_kg || 65;
  const height = profile.height_cm || 165;
  const activity = profile.activity_coef || 1.4;
  const dietType = profile.diet_flags || 'meat';
  if (sex === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  // Итоговые калории с учётом цели (goal)
  let dailyCalories;
  let deficit = 0;
  if ([3,4,5].includes(goal)) {
    deficit = goal * 7700 / 30;
    dailyCalories = Math.round(bmr * activity - deficit);
  } else {
    dailyCalories = Math.round(bmr * activity);
  }

  // Корректировка по цели (оставить только для muscle_gain, для weight_loss не трогать)
  if (goal === 'muscle_gain') {
    dailyCalories = Math.round(dailyCalories * 1.15); // профицит 15%
  }
  
  // Массив для отслеживания использованных перекусов
  const usedSnacks = [];
  
  // Генерируем перекус для 11:00
  const snack1 = getSnackOption(goal, 1, dietType, usedSnacks);
  usedSnacks.push(snack1);
  
  // Генерируем перекус для 17:00 (не должен повторяться)
  const snack2 = getSnackOption(goal, 2, dietType, usedSnacks);
  
  // Генерируем блюда с итоговыми калориями
  return [
    { 
      type: 'Завтрак', 
      menu: getBreakfastOption(goal, dietType), 
      calories: Math.round(dailyCalories * 0.25),
      time: '08:00'
    },
    { 
      type: 'Перекус', 
      menu: snack1, 
      calories: Math.round(dailyCalories * 0.10),
      time: '11:00'
    },
    { 
      type: 'Обед', 
      menu: getLunchOption(goal, dietType), 
      calories: Math.round(dailyCalories * 0.35),
      time: '14:00'
    },
    { 
      type: 'Полдник', 
      menu: snack2, 
      calories: Math.round(dailyCalories * 0.10),
      time: '17:00'
    },
    { 
      type: 'Ужин', 
      menu: getDinnerOption(goal, dietType), 
      calories: Math.round(dailyCalories * 0.20),
      time: '19:00'
    }
  ];
}

// --- ДОБАВЛЕНО: функция для распределения dietType по приёмам пищи ---
function getMealDietTypes(mainDietType) {
  // Можно скорректировать распределение по желанию
  const distribution = {
    meat:      ['meat', 'meat', 'fish', 'vegetarian', 'vegan'],
    fish:      ['fish', 'fish', 'vegetarian', 'vegetarian', 'vegan'],
    vegetarian_egg: ['vegetarian_egg', 'vegetarian_egg', 'vegetarian', 'vegan', 'vegan'],
    vegetarian: ['vegetarian', 'vegetarian', 'vegan', 'vegan', 'vegan'],
    vegan:     ['vegan', 'vegan', 'vegan', 'vegan', 'vegan'],
  };
  return distribution[mainDietType] || Array(5).fill('vegan');
}

// Опции завтраков с учетом типа диеты
function getBreakfastOption(goal, dietType = 'meat') {
  const breakfasts = {
    weight_loss: {
      meat: [
        'Овсянка с ягодами и корицей',
        'Творог с фруктами',
        'Омлет с овощами',
        'Греческий йогурт с орехами',
        'Запеченные сырники',
        'Каша гречневая с молоком'
      ],
      vegetarian_eggs: [
        'Овсянка с ягодами и корицей',
        'Творог с фруктами',
        'Омлет с овощами и сыром',
        'Греческий йогурт с орехами',
        'Запеченные сырники',
        'Каша овсяная с молоком'
      ],
      vegetarian_no_eggs: [
        'Овсянка с ягодами и корицей',
        'Творог с фруктами и медом',
        'Йогурт с мюсли',
        'Каша пшенная на молоке',
        'Творожная запеканка',
        'Смузи боул с орехами'
      ],
      vegan: [
        'Овсянка на растительном молоке с ягодами',
        'Смузи боул с фруктами и семенами',
        'Каша киноа с фруктами',
        'Тост с авокадо и семенами',
        'Чиа пудинг с ягодами',
        'Гранола с растительным йогуртом'
      ]
    },
    muscle_gain: {
      meat: [
        'Овсянка с бананом и арахисовой пастой',
        'Творог с медом и орехами',
        'Омлет с сыром и авокадо',
        'Протеиновый коктейль с овсянкой',
        'Каша с мясом',
        'Запеканка творожная'
      ],
      vegetarian_eggs: [
        'Овсянка с бананом и арахисовой пастой',
        'Творог с медом и орехами',
        'Омлет с сыром и авокадо',
        'Протеиновый коктейль на молоке',
        'Сырники с медом',
        'Яичница с сыром'
      ],
      vegetarian_no_eggs: [
        'Овсянка с бананом и ореховой пастой',
        'Творог с медом и орехами',
        'Протеиновый коктейль на молоке',
        'Творожная запеканка с фруктами',
        'Каша с молоком и орехами',
        'Йогурт с мюсли и медом'
      ],
      vegan: [
        'Овсянка на соевом молоке с орехами',
        'Протеиновый коктейль растительный',
        'Каша киноа с орехами и семенами',
        'Тост с авокадо и хумусом',
        'Смузи с растительным белком',
        'Энергетическая каша с суперфудами'
      ]
    },
    maintenance: {
      meat: [
        'Овсянка с ягодами',
        'Творог с фруктами',
        'Омлет с зеленью',
        'Йогурт с мюсли',
        'Каша молочная',
        'Сырники'
      ],
      vegetarian_eggs: [
        'Овсянка с ягодами',
        'Творог с фруктами',
        'Омлет с зеленью',
        'Йогурт с мюсли',
        'Каша молочная',
        'Сырники с ягодами'
      ],
      vegetarian_no_eggs: [
        'Овсянка с ягодами',
        'Творог с фруктами',
        'Йогурт с мюсли',
        'Каша молочная с фруктами',
        'Творожная запеканка',
        'Смузи с йогуртом'
      ],
      vegan: [
        'Овсянка на растительном молоке',
        'Смузи с фруктами',
        'Каша на кокосовом молоке',
        'Тост с авокадо',
        'Гранола с ягодами',
        'Чиа пудинг'
      ]
    }
  };
  
  const goalBreakfasts = breakfasts[goal] || breakfasts.weight_loss;
  const dietBreakfasts = goalBreakfasts[dietType] || goalBreakfasts.meat;
  
  return dietBreakfasts[Math.floor(Math.random() * dietBreakfasts.length)];
}

// Опции перекусов с учетом типа диеты
function getSnackOption(goal, snackNumber, dietType = 'meat', usedSnacks = []) {
  const snacks = {
    weight_loss: {
      meat: [
        'Яблоко',
        'Кефир',
        'Горсть орехов',
        'Овощной салат',
        'Творог 0%',
        'Морковные палочки',
        'Зеленый чай с лимоном',
        'Огурец с зеленью'
      ],
      vegetarian_eggs: [
        'Яблоко с корицей',
        'Кефир с ягодами',
        'Горсть миндаля',
        'Овощной салат',
        'Творог с зеленью',
        'Морковные палочки с хумусом',
        'Йогурт натуральный',
        'Сельдерей с арахисовой пастой'
      ],
      vegetarian_no_eggs: [
        'Яблоко с корицей',
        'Растительный йогурт',
        'Горсть грецких орехов',
        'Овощной салат с семечками',
        'Хумус с овощами',
        'Морковные палочки',
        'Смузи из ягод',
        'Авокадо с лимоном'
      ],
      vegan: [
        'Яблоко с корицей',
        'Растительное молоко с орехами',
        'Горсть кешью',
        'Салат из овощей с семенами',
        'Хумус с морковью',
        'Банан с миндальной пастой',
        'Смузи из фруктов',
        'Авокадо с помидором'
      ]
    },
    muscle_gain: {
      meat: [
        'Протеиновый батончик',
        'Творог с медом',
        'Банан с арахисовой пастой',
        'Греческий йогурт',
        'Омлет из 2 яиц',
        'Мясной рулет',
        'Молочный коктейль',
        'Сыр с орехами'
      ],
      vegetarian_eggs: [
        'Творог с медом и орехами',
        'Банан с арахисовой пастой',
        'Греческий йогурт с ягодами',
        'Омлет с сыром',
        'Протеиновый коктейль на молоке',
        'Сырники запеченные',
        'Йогурт с мюсли',
        'Авокадо с яйцом'
      ],
      vegetarian_no_eggs: [
        'Творог с медом и орехами',
        'Банан с миндальной пастой',
        'Греческий йогурт с орехами',
        'Протеиновый коктейль на молоке',
        'Сырная запеканка',
        'Йогурт с семенами чиа',
        'Авокадо с творогом',
        'Смузи с протеином'
      ],
      vegan: [
        'Растительный протеиновый коктейль',
        'Банан с тахини',
        'Соевый йогурт с орехами',
        'Хумус с цельнозерновым хлебом',
        'Авокадо с семенами',
        'Смузи с растительным белком',
        'Орехово-фруктовые шарики',
        'Киноа с ягодами'
      ]
    },
    maintenance: {
      meat: [
        'Фрукт по сезону',
        'Йогурт',
        'Орехи',
        'Овощи с дипом',
        'Сыр с крекерами',
        'Творог с ягодами',
        'Молочный коктейль',
        'Мини-сэндвич'
      ],
      vegetarian_eggs: [
        'Фрукт по сезону',
        'Йогурт с медом',
        'Орехи и сухофрукты',
        'Овощи с хумусом',
        'Сыр с фруктами',
        'Творог с ягодами',
        'Молочный коктейль',
        'Омлет мини'
      ],
      vegetarian_no_eggs: [
        'Фрукт по сезону',
        'Йогурт натуральный',
        'Орехи и сухофрукты',
        'Овощи с хумусом',
        'Сыр с виноградом',
        'Творог с фруктами',
        'Молочный коктейль',
        'Овсяное печенье'
      ],
      vegan: [
        'Фрукт по сезону',
        'Растительный йогурт',
        'Орехи и семечки',
        'Овощи с тахини',
        'Авокадо тост',
        'Фруктовый смузи',
        'Энергетические шарики',
        'Овсяное печенье веган'
      ]
    }
  };
  
  const goalSnacks = snacks[goal] || snacks.weight_loss;
  const dietSnacks = goalSnacks[dietType] || goalSnacks.meat;
  
  // Фильтруем уже использованные перекусы
  const availableSnacks = dietSnacks.filter(snack => !usedSnacks.includes(snack));
  
  // Если все перекусы использованы, возвращаем из полного списка
  const finalSnacks = availableSnacks.length > 0 ? availableSnacks : dietSnacks;
  
  return finalSnacks[Math.floor(Math.random() * finalSnacks.length)];
}

// Опции обедов с учетом типа диеты
function getLunchOption(goal, dietType = 'meat') {
  const lunches = {
    weight_loss: {
      meat: [
        'Куриная грудка с овощами',
        'Рыба с салатом',
        'Индейка с гречкой',
        'Овощное рагу с говядиной',
        'Суп с курицей',
        'Телятина с овощами'
      ],
      vegetarian_eggs: [
        'Омлет с овощами и сыром',
        'Рыба с салатом',
        'Овощное рагу с яйцами',
        'Салат с яйцом и сыром',
        'Рыбный суп',
        'Запеканка овощная с сыром'
      ],
      vegetarian_no_eggs: [
        'Рыба с овощами',
        'Овощное рагу с творогом',
        'Салат с сыром и орехами',
        'Рыбный суп с овощами',
        'Запеканка с сыром',
        'Овощи гриль с творогом'
      ],
      vegan: [
        'Овощное рагу с киноа',
        'Салат с нутом и семенами',
        'Суп чечевичный',
        'Тофу с овощами',
        'Запеканка овощная',
        'Бобовые с овощами'
      ]
    },
    muscle_gain: {
      meat: [
        'Курица с рисом и овощами',
        'Говядина с картофелем',
        'Рыба с макаронами',
        'Индейка с киноа',
        'Стейк с гарниром',
        'Суп мясной с крупой'
      ],
      vegetarian_eggs: [
        'Омлет с сыром и гарниром',
        'Рыба с рисом и овощами',
        'Яичная запеканка с овощами',
        'Рыбный стейк с киноа',
        'Суп рыбный с яйцом',
        'Сырная запеканка с гарниром'
      ],
      vegetarian_no_eggs: [
        'Рыба с рисом и овощами',
        'Творожная запеканка с гарниром',
        'Рыбный стейк с киноа',
        'Суп рыбный с сыром',
        'Сырная запеканка',
        'Рыба с макаронами'
      ],
      vegan: [
        'Тофу с рисом и овощами',
        'Бобовые с киноа',
        'Нут с макаронами',
        'Суп из чечевицы с овощами',
        'Темпе с гарниром',
        'Растительный белок с крупой'
      ]
    },
    maintenance: {
      meat: [
        'Курица с гарниром',
        'Рыба с овощами',
        'Мясо с крупой',
        'Белок с салатом',
        'Суп мясной',
        'Котлеты с гарниром'
      ],
      vegetarian_eggs: [
        'Омлет с гарниром',
        'Рыба с овощами',
        'Яйца с крупой',
        'Салат с яйцом',
        'Суп рыбный',
        'Запеканка с сыром'
      ],
      vegetarian_no_eggs: [
        'Рыба с овощами',
        'Творог с гарниром',
        'Сыр с крупой',
        'Салат с творогом',
        'Суп рыбный',
        'Запеканка творожная'
      ],
      vegan: [
        'Тофу с овощами',
        'Бобовые с гарниром',
        'Нут с крупой',
        'Салат с семенами',
        'Суп овощной',
        'Запеканка из овощей'
      ]
    }
  };
  
  const goalLunches = lunches[goal] || lunches.weight_loss;
  const dietLunches = goalLunches[dietType] || goalLunches.meat;
  
  return dietLunches[Math.floor(Math.random() * dietLunches.length)];
}

// Опции ужинов с учетом типа диеты
function getDinnerOption(goal, dietType = 'meat') {
  const dinners = {
    weight_loss: {
      meat: [
        'Творог с зеленью',
        'Запеченная рыба с салатом',
        'Омлет с овощами',
        'Кефир с отрубями',
        'Куриная грудка с овощами',
        'Рыбные котлеты с салатом'
      ],
      vegetarian_eggs: [
        'Творог с зеленью',
        'Запеченная рыба с салатом',
        'Омлет с овощами',
        'Кефир с ягодами',
        'Яичница с сыром',
        'Рыбные котлеты с овощами'
      ],
      vegetarian_no_eggs: [
        'Творог с зеленью',
        'Запеченная рыба с салатом',
        'Кефир с ягодами',
        'Сыр с овощами',
        'Рыбные котлеты с салатом',
        'Творожная запеканка'
      ],
      vegan: [
        'Овощной салат с семенами',
        'Тофу с овощами',
        'Растительный йогурт с ягодами',
        'Хумус с овощами',
        'Авокадо с зеленью',
        'Смузи зеленый'
      ]
    },
    muscle_gain: {
      meat: [
        'Творог с орехами и медом',
        'Мясо с овощами',
        'Рыба с гарниром',
        'Протеиновый коктейль',
        'Курица с салатом',
        'Омлет с мясом'
      ],
      vegetarian_eggs: [
        'Творог с орехами и медом',
        'Омлет с сыром',
        'Рыба с гарниром',
        'Протеиновый коктейль на молоке',
        'Яичница с сыром',
        'Рыбные котлеты'
      ],
      vegetarian_no_eggs: [
        'Творог с орехами и медом',
        'Рыба с гарниром',
        'Протеиновый коктейль на молоке',
        'Сырная запеканка',
        'Рыбные котлеты с творогом',
        'Йогурт с орехами'
      ],
      vegan: [
        'Растительный протеиновый коктейль',
        'Тофу с орехами',
        'Бобовые с овощами',
        'Ореховая паста с фруктами',
        'Киноа с семенами',
        'Смузи с растительным белком'
      ]
    },
    maintenance: {
      meat: [
        'Легкий белок с овощами',
        'Творог с фруктами',
        'Рыба с салатом',
        'Омлет с зеленью',
        'Кефир',
        'Куриный салат'
      ],
      vegetarian_eggs: [
        'Омлет с овощами',
        'Творог с фруктами',
        'Рыба с салатом',
        'Яйца с зеленью',
        'Кефир с ягодами',
        'Рыбный салат'
      ],
      vegetarian_no_eggs: [
        'Творог с фруктами',
        'Рыба с салатом',
        'Сыр с овощами',
        'Кефир с ягодами',
        'Рыбный салат',
        'Йогурт с фруктами'
      ],
      vegan: [
        'Овощной салат',
        'Тофу с зеленью',
        'Растительный йогурт',
        'Авокадо салат',
        'Орехи с фруктами',
        'Зеленый смузи'
      ]
    }
  };
  
  const goalDinners = dinners[goal] || dinners.weight_loss;
  const dietDinners = goalDinners[dietType] || goalDinners.meat;
  
  return dietDinners[Math.floor(Math.random() * dietDinners.length)];
}

// Универсальная функция для определения овощей/фруктов/зелени (всегда граммы)
function isGramOnlyIngredient(name) {
  const n = name.trim().toLowerCase();
  const keywords = [
    'помидор', 'томат', 'перец', 'морковь', 'лук', 'баклажан', 'кабачок', 'цуккини', 'огурец', 'картофель',
    'брокколи', 'сельдерей', 'шпинат', 'тыква', 'фасоль', 'горошек', 'кукуруза', 'редис', 'свекла', 'капуста',
    'цветная капуста', 'брюссельская капуста', 'спаржа', 'яблоко', 'груша', 'апельсин', 'мандари', 'банан',
    'киви', 'персик', 'слива', 'абрикос', 'виноград', 'черешня', 'вишня', 'клубника', 'малина', 'ежевика',
    'голубика', 'смородина', 'арбуз', 'дыня', 'ананас', 'манго', 'гранат', 'авокадо', 'лимон', 'лайм',
    'грейпфрут', 'черника', 'клюква', 'облепиха', 'инжир', 'финик', 'курага', 'изюм', 'чернослив', 'ягод',
    'зелень', 'укроп', 'петрушка', 'базилик', 'кинза', 'лук зеленый', 'салат', 'сельдерей', 'щавель', 'руккола'
  ];
  return keywords.some(k => n.includes(k));
}

// GET /api/program/month?programId=...&month=1
router.get('/program/month', (req, res) => {
  const { programId, month = 1 } = req.query;
  const program = programs[programId];
  if (!program) return res.status(404).json({ error: 'not found' });
  const start = (month - 1) * 30;
  const days = program.days.slice(start, start + 30);
  res.json({
    monthStart: days[0]?.date,
    days
  });
});

// GET /api/program/day?programId=...&date=YYYY-MM-DD
router.get('/program/day', (req, res) => {
  const { programId, date } = req.query;
  const program = programs[programId];
  if (!program) return res.status(404).json({ error: 'not found' });
  const day = program.days.find(d => d.date === date);
  if (!day) return res.status(404).json({ error: 'day not found' });
  res.json(day);
});

// POST /api/program/monthly — генерация месячного персонального расписания
router.post('/program/monthly', async (req, res) => {
  const { userId, profile } = req.body;
  
  try {
    console.log('🎯 Генерируем месячное расписание для:', userId);
    console.log('📋 Профиль:', profile);
    
    const programId = userId + '-monthly-' + Date.now();
    const monthlySchedule = generateMonthlySchedule(profile);
    
    // Сохраняем расписание
    programs[programId] = { 
      userId, 
      profile, 
      days: monthlySchedule,
      type: 'monthly',
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ Месячное расписание создано:', programId);
    console.log('📅 Количество дней:', monthlySchedule.length);
    
    res.json({ 
      success: true, 
      programId,
      totalDays: monthlySchedule.length,
      workoutDays: monthlySchedule.filter(d => d.isWorkoutDay).length
    });
  } catch (error) {
    console.error('❌ Ошибка генерации месячного расписания:', error);
    res.status(500).json({ error: 'Ошибка создания программы' });
  }
});

// GET /api/program/today — получить план на сегодня или конкретную дату
router.get('/program/today', (req, res) => {
  const { programId, date } = req.query;
  const program = programs[programId];
  
  if (!program) {
    return res.status(404).json({ error: 'Программа не найдена' });
  }
  
  // Если дата не указана, используем сегодняшнюю
  const targetDate = date || new Date().toISOString().slice(0, 10);
  
  // Ищем день в программе
  const todayPlan = program.days.find(d => d.date === targetDate);
  
  if (!todayPlan) {
    return res.status(404).json({ error: 'План на эту дату не найден' });
  }
  
  console.log('📅 Отправляем план на дату:', targetDate);
  
  res.json({
    success: true,
    date: targetDate,
    plan: todayPlan,
    profile: program.profile
  });
});

// GET /api/program/calendar — получить весь календарь программы
router.get('/program/calendar', (req, res) => {
  const { programId } = req.query;
  const program = programs[programId];
  
  if (!program) {
    return res.status(404).json({ error: 'Программа не найдена' });
  }
  
  // Группируем дни по неделям для удобства
  const weeks = [];
  for (let i = 0; i < program.days.length; i += 7) {
    weeks.push(program.days.slice(i, i + 7));
  }
  
  const stats = {
    totalDays: program.days.length,
    workoutDays: program.days.filter(d => d.isWorkoutDay).length,
    restDays: program.days.filter(d => !d.isWorkoutDay).length,
    completedWorkouts: program.days.filter(d => d.completedWorkout).length,
    completedMeals: program.days.filter(d => d.completedMeals).length
  };
  
  res.json({
    success: true,
    programId,
    weeks,
    stats,
    profile: program.profile
  });
});

// POST /api/generate-meal-plan — генерация рациона на день с учетом иерархии dietType
router.post('/generate-meal-plan', async (req, res) => {
  try {
    const { dietType = 'vegetarian_egg', calories = 1800 } = req.body;
    const profile = req.body.profile || req.body;
    // --- Итоговая цель ---
    let numericGoal = Number(profile.goal);
    if (![3, 4, 5].includes(numericGoal)) {
      numericGoal = Number(profile.goal_weight_loss);
    }
    if (![3, 4, 5].includes(numericGoal)) {
      numericGoal = 4;
    }
    profile.goal = numericGoal;

    let bmr;
    if (profile.sex === 'male') {
      bmr = 88.362 + (13.397 * profile.weight_kg) + (4.799 * profile.height_cm) - (5.677 * profile.age);
    } else {
      bmr = 447.593 + (9.247 * profile.weight_kg) + (3.098 * profile.height_cm) - (4.330 * profile.age);
    }
    let dailyCalories = bmr * profile.activity_coef;
    // --- Новый расчёт дефицита по goal (3/4/5 кг в месяц) ---
    let deficit = 0;
    if ([3,4,5].includes(profile.goal)) {
      deficit = profile.goal * 7700 / 30;
      dailyCalories = Math.round(calories_before_goal - deficit);
    }
    // Формула Дианы: белки 1.5 г/кг, жиры 0.9 г/кг, углеводы - остаток
    const protein = Math.round(profile.weight_kg * 1.5);
    const fat = Math.round(profile.weight_kg * 0.9);
    const proteinCals = protein * 4;
    const fatCals = fat * 9;
    const carbs = Math.round((dailyCalories - (proteinCals + fatCals)) / 4);

    // Индивидуальные цели для каждого приёма пищи
    const mealTypes = ['Завтрак', 'Перекус', 'Обед', 'Полдник', 'Ужин'];
    const mealPercents = [0.25, 0.10, 0.35, 0.10, 0.20];
    const mealTargets = mealPercents.map(p => ({
      calories: Math.round(dailyCalories * p),
      protein: Math.round(protein * p),
      fat: Math.round(fat * p),
      carbs: Math.round(carbs * p)
    }));
    // --- Новый режим: фильтрация по типу диеты ---
    const dietTypeHierarchy = {
      vegan: ['vegan'],
      vegetarian: ['vegan', 'vegetarian'],
      vegetarian_egg: ['vegan', 'vegetarian', 'vegetarian_egg'],
      fish: ['vegan', 'vegetarian', 'vegetarian_egg', 'fish'],
      meat: ['vegan', 'vegetarian', 'vegetarian_egg', 'fish', 'meat'],
    };
    const allowedDietTypes = dietTypeHierarchy[dietType] || ['vegan'];
    // 2. Список всех рецептов из базы (с БЖУ, калориями, ингредиентами)
    const allRecipes = [];
    for (const [type, arr] of Object.entries(recipeUtils.recipes)) {
      for (const r of arr) {
        allRecipes.push({
          name: r.name,
          type: r.type,
          dietType: r.dietType,
          calories: r.calories,
          protein: r.protein,
          fat: r.fat,
          carbs: r.carbs,
          ingredients: r.ingredients,
          instructions: r.instructions
        });
      }
    }
    // Для каждого приема пищи подбираем 5 блюд с максимально близкой калорийностью и подходящим dietType
    const detailedMeals = mealTypes.map((type, idx) => {
      const recipes = allRecipes.filter(r => r.type === type && allowedDietTypes.includes(r.dietType));
      const sorted = [...recipes].sort((a, b) => Math.abs(a.calories - mealTargets[idx].calories) - Math.abs(b.calories - mealTargets[idx].calories));
      const target = mealTargets[idx];
      const options = sorted.slice(0, 5).map(r => scaleRecipeToTargets(r, target));
      return { type, options };
    });
    console.log('=== BEFORE DEBUG MEAL TARGETS ===');
    console.log('[DEBUG MEAL TARGETS]', mealTypes.map((type, idx) => ({ type, target: mealTargets[idx] })));
    console.log('=== AFTER DEBUG MEAL TARGETS ===');

    res.json({
      success: true,
      profile,
      dailyCalories: Math.round(dailyCalories),
      protein, fat, carbs,
      meals: detailedMeals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Проксирующий роут для /api/generate-recipe (перенаправляет на /api/recipes/generate-recipe)
import fetch from 'node-fetch';
router.post('/generate-recipe', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3001/api/recipes/generate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Заглушка для /api/get-today-plan (примерная структура)
router.post('/get-today-plan', async (req, res) => {
  // Здесь можно реализовать реальную логику, если потребуется
  res.status(501).json({ success: false, error: 'Эндпоинт не реализован' });
});

// --- AI-подбор меню по КБЖУ и базе рецептов с несколькими вариантами для каждого приёма пищи ---
router.post('/ai-meal-plan', async (req, res) => {
  console.log('=== AI MEAL PLAN ENDPOINT CALLED ===');
  try {
    const profile = req.body.profile || req.body;
    // --- Итоговая цель ---
    let numericGoal = Number(profile.goal);
    if (![3, 4, 5].includes(numericGoal)) {
      numericGoal = Number(profile.goal_weight_loss);
    }
    if (![3, 4, 5].includes(numericGoal)) {
      numericGoal = 4;
    }
    profile.goal = numericGoal;

    // 1. Расчёт суточной нормы КБЖУ
    const sex = profile.sex || 'female';
    const age = profile.age || 25;
    const weight = profile.weight_kg || 65;
    const height = profile.height_cm || 165;
    const activity = profile.activity_coef || 1.4;
    const goal = profile.goal_weight_loss || 'weight_loss';
    const dietType = profile.diet_flags || 'meat';

    let bmr;
    if (sex === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    let calories_before_goal = bmr * activity;
    let dailyCalories = calories_before_goal;
    // --- Новый расчёт дефицита по goal (3/4/5 кг в месяц) ---
    let deficit = 0;
    if ([3,4,5].includes(profile.goal)) {
      deficit = profile.goal * 7700 / 30;
      dailyCalories = Math.round(calories_before_goal - deficit);
    }
    // Формула Дианы: белки 1.5 г/кг, жиры 0.9 г/кг, углеводы - остаток
    const protein = Math.round(weight * 1.5);
    const fat = Math.round(weight * 0.9);
    const proteinCals = protein * 4;
    const fatCals = fat * 9;
    const carbs = Math.round((dailyCalories - (proteinCals + fatCals)) / 4);

    // Индивидуальные цели для каждого приёма пищи
    const mealTypes = ['Завтрак', 'Перекус', 'Обед', 'Полдник', 'Ужин'];
    const mealPercents = [0.25, 0.10, 0.35, 0.10, 0.20];
    const mealTargets = mealPercents.map(p => ({
      calories: Math.round(dailyCalories * p),
      protein: Math.round(protein * p),
      fat: Math.round(fat * p),
      carbs: Math.round(carbs * p)
    }));
    // --- Новый режим: фильтрация по типу диеты ---
    const dietTypeHierarchy = {
      vegan: ['vegan'],
      vegetarian: ['vegan', 'vegetarian'],
      vegetarian_egg: ['vegan', 'vegetarian', 'vegetarian_egg'],
      fish: ['vegan', 'vegetarian', 'vegetarian_egg', 'fish'],
      meat: ['vegan', 'vegetarian', 'vegetarian_egg', 'fish', 'meat'],
    };
    const allowedDietTypes = dietTypeHierarchy[dietType] || ['vegan'];
    // 2. Список всех рецептов из базы (с БЖУ, калориями, ингредиентами)
    const allRecipes = [];
    for (const [type, arr] of Object.entries(recipeUtils.recipes)) {
      for (const r of arr) {
        allRecipes.push({
          name: r.name,
          type: r.type,
          dietType: r.dietType,
          calories: r.calories,
          protein: r.protein,
          fat: r.fat,
          carbs: r.carbs,
          ingredients: r.ingredients,
          instructions: r.instructions
        });
      }
    }
    // Для каждого приема пищи подбираем 5 блюд с максимально близкой калорийностью и подходящим dietType
    const detailedMeals = mealTypes.map((type, idx) => {
      const recipes = allRecipes.filter(r => r.type === type && allowedDietTypes.includes(r.dietType));
      const sorted = [...recipes].sort((a, b) => Math.abs(a.calories - mealTargets[idx].calories) - Math.abs(b.calories - mealTargets[idx].calories));
      const target = mealTargets[idx];
      const options = sorted.slice(0, 5).map(r => scaleRecipeToTargets(r, target));
      return { type, options };
    });

    res.json({
      success: true,
      profile,
      dailyCalories: Math.round(dailyCalories),
      protein, fat, carbs,
      meals: detailedMeals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Маппинг типовых весов для овощей/фруктов/зелени ---
const defaultGramWeights = {
  'банан': 120,
  'яблоко': 150,
  'груша': 140,
  'апельсин': 160,
  'киви': 75,
  'огурец': 100,
  'помидор': 100,
  'томат': 100,
  'морковь': 80,
  'перец': 120,
  'картофель': 130,
  'лук': 80,
  'кабачок': 200,
  'баклажан': 200,
  'грейпфрут': 200,
  'мандари': 80,
  'слива': 40,
  'абрикос': 35,
  'виноград': 5,
  'черешня': 8,
  'вишня': 8,
  'клубника': 15,
  'малина': 4,
  'ежевика': 4,
  'голубика': 2,
  'смородина': 1,
  'арбуз': 2000,
  'дыня': 2000,
  'ананас': 900,
  'манго': 200,
  'гранат': 200,
  'авокадо': 140,
  'лимон': 80,
  'лайм': 60,
  'брокколи': 100,
  'шпинат': 30,
  'сельдерей': 40,
  'тыква': 200,
  'фасоль': 20,
  'горошек': 5,
  'кукуруза': 100,
  'редис': 15,
  'свекла': 120,
  'капуста': 100,
  'цветная капуста': 100,
  'брюссельская капуста': 20,
  'спаржа': 20,
  'зелень': 10,
  'укроп': 10,
  'петрушка': 10,
  'базилик': 10,
  'кинза': 10,
  'лук зеленый': 10,
  'салат': 20,
  'щавель': 10,
  'руккола': 10
};

function getDefaultGramWeight(name) {
  if (!name) return 100;
  const n = name.trim().toLowerCase();
  for (const key in defaultGramWeights) {
    if (n.includes(key)) return defaultGramWeights[key];
  }
  return 100; // fallback
}

function scaleRecipeToTargets(recipe, target) {
  if (!recipe || !target) return recipe;
  if (
    typeof recipe.calories !== 'number' ||
    typeof recipe.protein !== 'number' ||
    typeof recipe.fat !== 'number' ||
    typeof recipe.carbs !== 'number'
  ) {
    return recipe;
  }
  const scale = target.calories / recipe.calories;
  const breadKeywords = ['хлеб', 'батон', 'булка', 'багет', 'тост'];
  const breadTypicalWeight = 35;
  const NON_SCALABLE_INGREDIENTS = [
    'лимонный сок', 'соль', 'перец', 'паприка', 'корица', 'зира', 'тимьян', 'мускатный орех',
    'розмарин', 'базилик', 'укроп', 'петрушка', 'горчица', 'карри', 'куркума', 'приправа', 'специи',
    'соевый соус', 'чеснок', 'лук', 'зелень', 'лавровый лист', 'ваниль', 'сахарозаменитель', 'мёд', 'сироп', 'экстракт'
  ];
  // Масштабируем БЖУ и ингредиенты
  return {
    ...recipe,
    calories: Math.round(recipe.calories * scale),
    protein: Math.round(recipe.protein * scale),
    fat: Math.round(recipe.fat * scale),
    carbs: Math.round(recipe.carbs * scale),
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients
          .map(ing => {
            // --- Не масштабируем малые ингредиенты ---
            if (typeof ing.name === 'string' && NON_SCALABLE_INGREDIENTS.some(key => ing.name.toLowerCase().includes(key))) {
              // Для специй и приправ с unit 'щепотка' — всегда минимум 1
              if (["щепотка"].includes(ing.unit)) {
                let amt = Math.round(ing.amount * Math.min(scale, 2));
                if (!ing.amount || amt < 1) amt = 1;
                return { ...ing, amount: amt, unit: ing.unit };
              }
              // Для 'ч.л.', 'ст.л.', 'кусочек', 'ломтик', 'стебель', 'зубчик' — минимум 0.5
              if (["ч.л.", "ст.л.", "кусочек", "ломтик", "стебель", "зубчик"].includes(ing.unit)) {
                let amt = Math.round(ing.amount * Math.min(scale, 2) * 10) / 10;
                if (!ing.amount || amt < 0.5) amt = 0.5;
                return { ...ing, amount: amt, unit: ing.unit };
              }
              // Для unit 'шт' и name содержит 'яйцо' или 'лаваш' — всегда минимум 1
              if (ing.unit === 'шт' && (ing.name.toLowerCase().includes('яйцо') || ing.name.toLowerCase().includes('лаваш'))) {
                let amt = Math.round(ing.amount * Math.min(scale, 2));
                if (!ing.amount || amt < 1) amt = 1;
                return { ...ing, amount: amt, unit: ing.unit };
              }
              // Масштабируем максимум в 2 раза и ограничиваем верхний предел для жидкостей и специй
              let amt = Math.round(ing.amount * Math.min(scale, 2));
              if (ing.unit === 'мл' || ing.unit === 'г') {
                amt = Math.min(amt, 30);
              }
              if (amt < 0.5) amt = 0.5; // не допускаем 0 для специй
              return { ...ing, amount: amt, unit: ing.unit };
            }
            // Всегда в граммах для овощей/фруктов/зелени
            if (typeof ing.name === 'string' && isGramOnlyIngredient(ing.name)) {
              let baseAmount = ing.amount;
              if ((baseAmount === 1 || !baseAmount) && (!ing.unit || ing.unit === 'шт')) {
                baseAmount = getDefaultGramWeight(ing.name);
              }
              let grams = Math.round((baseAmount || 100) * scale);
              if (grams <= 0) grams = getDefaultGramWeight(ing.name);
              if (grams < 10) grams = getDefaultGramWeight(ing.name);
              return {
                ...ing,
                amount: grams,
                unit: 'г'
              };
            }
            // Для хлеба и подобных продуктов всегда граммы
            if (typeof ing.name === 'string' && breadKeywords.some(k => ing.name.toLowerCase().includes(k))) {
              let grams = 0;
              if (ing.unit && ['кусочек', 'ломтик', 'шт', 'piece', 'slice'].includes(ing.unit)) {
                grams = Math.round((ing.amount || 1) * breadTypicalWeight * scale);
              } else if (ing.unit === 'г' || !ing.unit) {
                grams = Math.round((ing.amount || breadTypicalWeight) * scale);
              }
              if (grams < 10) grams = breadTypicalWeight;
              return {
                ...ing,
                amount: grams,
                unit: 'г'
              };
            }
            // Для unit 'шт' (кроме "яйцо"/"лаваш") — минимум 1
            if (ing.unit === 'шт') {
              let amt = Math.round(ing.amount * scale * 10) / 10;
              if (!ing.amount || amt < 1) amt = 1;
              return { ...ing, amount: amt, unit: ing.unit };
            }
            // Для других ингредиентов с числовым amount
            if (typeof ing.amount === 'number') {
              let amt = Math.round(ing.amount * scale * 10) / 10;
              if (amt < 0.01) return null; // исключаем нули и отрицательные
              return { ...ing, amount: amt };
            }
            return ing;
          })
          .filter(ing => ing && ing.amount > 0) // фильтрация нулей и null
      : recipe.ingredients
  };
}

// --- Утилита: оставить только поле goal с числовым значением 3, 4 или 5 ---
function cleanQuizGoalFields(quiz) {
  if (!quiz || typeof quiz !== 'object') return { goal: 4 };
  // Если есть goal_weight_loss (3/4/5), то используем его как goal
  let parsedGoal = Number(quiz.goal);
  if (typeof quiz.goal_weight_loss !== 'undefined') {
    const gwl = Number(quiz.goal_weight_loss);
    if ([3, 4, 5].includes(gwl)) parsedGoal = gwl;
  }
  if (![3, 4, 5].includes(parsedGoal)) parsedGoal = 4;
  // Удаляем все варианты цели, кроме goal, но явно сохраняем age
  const { goal, goal_weight_loss, user_goal, target, age, ...rest } = quiz;
  return { ...rest, age, goal: parsedGoal };
}

// --- API: Получить ответы квиза и индивидуальные КБЖУ ---
router.get('/user/quiz-answers/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    let quiz = null;
    const userFile = path.join(__dirname, 'backup_files', 'users', `quiz_${userId}.json`);
    if (fs.existsSync(userFile)) {
      quiz = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
      console.log('[QUIZ OBJECT до cleanQuizGoalFields]', quiz);
    } else {
      quiz = {
        weight: 60,
        height: 165,
        age: 30,
        gender: 'female',
        activity_level: 'medium',
        goal: 4 // по умолчанию 4 кг
      };
    }
    // --- Оставляем только поле goal с числовым значением ---
    quiz = cleanQuizGoalFields(quiz);
    console.log('[QUIZ OBJECT после cleanQuizGoalFields]', quiz);
    // --- Расчёт КБЖУ с учётом цели похудения ---
    const weight = Number(quiz.weight) || Number(quiz.weight_kg) || 60;
    const height = Number(quiz.height) || Number(quiz.height_cm) || 165;
    const age = Number(quiz.age) || 30;
    const sex = (quiz.gender || quiz.sex || 'female').toLowerCase();
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += sex === 'male' || sex === 'муж' ? 5 : -161;
    const activityMap = {
      'low': 1.2,
      'medium': 1.375,
      'high': 1.55,
      'very_high': 1.725
    };
    const activity = quiz.activity_level || quiz.activity_coef || 'medium';
    const activityCoef = activityMap[activity] || Number(quiz.activity_coef) || 1.375;
    let calories_before_goal = Math.round(bmr * activityCoef);
    let calories = calories_before_goal;
    // --- Дефицит калорий по цели похудения (goal: 3, 4, 5) ---
    const goal = quiz.goal; // уже гарантировано 3, 4, 5
    const deficit = goal * 7700 / 30;
    calories = Math.round(calories_before_goal - deficit);
    const protein = Math.round(weight * 1.7);
    const fats = Math.round(weight * 0.9);
    const carbs = Math.round((calories - (protein*4 + fats*9)) / 4);
    // Возвращаем все исходные поля из файла + расчётные значения
    res.json({
      ...quiz,
      activityCoef,
      bmr,
      calories,
      calories_before_goal,
      protein,
      fats,
      carbs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API: Сохранение и обновление квиза пользователя ---
import bodyParser from 'body-parser';
router.use(bodyParser.json());

// PUT /api/user/quiz-answers/:userId — обновить ответы квиза
router.put('/user/quiz-answers/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const userFile = path.join(__dirname, 'backup_files', 'users', `quiz_${userId}.json`);
    let quiz = {};
    if (fs.existsSync(userFile)) {
      quiz = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
    }
    // Логируем, что реально приходит с фронта
    console.log('[QUIZ PUT BODY]', req.body);
    // Обновляем только переданные поля
    quiz = { ...quiz, ...req.body };
    quiz = cleanQuizGoalFields(quiz);
    fs.writeFileSync(userFile, JSON.stringify(quiz, null, 2), 'utf-8');
    console.log('[QUIZ UPDATED]', quiz);
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Патч: сохранять квиз при генерации плана (StoryQuiz) ---
// Для этого экспортируем функцию сохранения
export function saveQuizToFile(userId, quiz) {
  if (!userId) return;
  const userFile = path.join(__dirname, 'backup_files', 'users', `quiz_${userId}.json`);
  console.log('[QUIZ SAVE PATH]', userFile);
  fs.mkdirSync(path.dirname(userFile), { recursive: true });
  const cleanedQuiz = cleanQuizGoalFields(quiz);
  fs.writeFileSync(userFile, JSON.stringify(cleanedQuiz, null, 2), 'utf-8');
  console.log('[QUIZ SAVED]', userId, cleanedQuiz);
}

export default router;
