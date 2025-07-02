// Заглушка API для генерации и выдачи недельного плана
import express from 'express';
const router = express.Router();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

// В памяти (для примера)
const programs = {};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Удалена загрузка knowledge_base_full.jsonl, так как она не используется

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
  return titles[((dayNumber - 1) % 5) + 1];
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
  const goal = profile.goal_weight_loss || 'weight_loss';
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

// Генерация плана питания
function generateMeals(goal, profile) {
  const sex = profile.sex || 'female';
  const age = profile.age || 25;
  const weight = profile.weight_kg || 65;
  const height = profile.height_cm || 165;
  const activity = profile.activity_coef || 1.4;
  
  // Базовый метаболизм
  let bmr;
  if (sex === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  let dailyCalories = bmr * activity;
  
  // Корректировка по цели
  if (goal === 'weight_loss') {
    dailyCalories *= 0.85; // дефицит 15%
  } else if (goal === 'muscle_gain') {
    dailyCalories *= 1.15; // профицит 15%
  }
  
  return [
    { 
      type: 'Завтрак', 
      menu: getBreakfastOption(goal), 
      calories: Math.round(dailyCalories * 0.25),
      time: '08:00'
    },
    { 
      type: 'Перекус', 
      menu: getSnackOption(goal, 1), 
      calories: Math.round(dailyCalories * 0.10),
      time: '11:00'
    },
    { 
      type: 'Обед', 
      menu: getLunchOption(goal), 
      calories: Math.round(dailyCalories * 0.35),
      time: '14:00'
    },
    { 
      type: 'Полдник', 
      menu: getSnackOption(goal, 2), 
      calories: Math.round(dailyCalories * 0.10),
      time: '17:00'
    },
    { 
      type: 'Ужин', 
      menu: getDinnerOption(goal), 
      calories: Math.round(dailyCalories * 0.20),
      time: '19:00'
    }
  ];
}

// Опции завтраков
function getBreakfastOption(goal) {
  const breakfasts = {
    weight_loss: [
      'Овсянка с ягодами и корицей',
      'Творог с фруктами',
      'Омлет с овощами',
      'Греческий йогурт с орехами'
    ],
    muscle_gain: [
      'Овсянка с бананом и арахисовой пастой',
      'Творог с медом и орехами',
      'Омлет с сыром и авокадо',
      'Протеиновый коктейль с овсянкой'
    ],
    maintenance: [
      'Овсянка с ягодами',
      'Творог с фруктами',
      'Омлет с зеленью',
      'Йогурт с мюсли'
    ]
  };
  
  const options = breakfasts[goal] || breakfasts.weight_loss;
  return options[Math.floor(Math.random() * options.length)];
}

// Опции перекусов
function getSnackOption(goal, snackNumber) {
  const snacks = {
    weight_loss: [
      'Яблоко',
      'Кефир',
      'Горсть орехов',
      'Овощной салат'
    ],
    muscle_gain: [
      'Протеиновый батончик',
      'Творог с медом',
      'Банан с арахисовой пастой',
      'Греческий йогурт'
    ],
    maintenance: [
      'Фрукт',
      'Йогурт',
      'Орехи',
      'Овощи'
    ]
  };
  
  const options = snacks[goal] || snacks.weight_loss;
  return options[(snackNumber - 1) % options.length];
}

// Опции обедов
function getLunchOption(goal) {
  const lunches = {
    weight_loss: [
      'Куриная грудка с овощами',
      'Рыба с салатом',
      'Индейка с гречкой',
      'Овощное рагу с белком'
    ],
    muscle_gain: [
      'Курица с рисом и овощами',
      'Говядина с картофелем',
      'Рыба с макаронами',
      'Индейка с киноа'
    ],
    maintenance: [
      'Курица с гарниром',
      'Рыба с овощами',
      'Мясо с крупой',
      'Белок с салатом'
    ]
  };
  
  const options = lunches[goal] || lunches.weight_loss;
  return options[Math.floor(Math.random() * options.length)];
}

// Опции ужинов
function getDinnerOption(goal) {
  const dinners = {
    weight_loss: [
      'Творог с зеленью',
      'Запеченная рыба с салатом',
      'Омлет с овощами',
      'Кефир с отрубями'
    ],
    muscle_gain: [
      'Творог с орехами и медом',
      'Мясо с овощами',
      'Рыба с гарниром',
      'Протеиновый коктейль'
    ],
    maintenance: [
      'Легкий белок с овощами',
      'Творог с фруктами',
      'Рыба с салатом',
      'Омлет с зеленью'
    ]
  };
  
  const options = dinners[goal] || dinners.weight_loss;
  return options[Math.floor(Math.random() * options.length)];
}

// Цель по шагам
function getDailyStepsGoal(profile) {
  const level = profile.training_level || 'beginner';
  const activity = profile.activity_coef || 1.4;
  
  if (level === 'beginner') return 8000;
  if (level === 'intermediate') return 10000;
  if (level === 'advanced') return 12000;
  
  return activity < 1.4 ? 10000 : 8000;
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

export default router;
