import subscriptionRouter from './routes/subscriptionRoutes.js';
import * as subscriptionManager from './utils/subscriptionManager.js';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import programApi from './programApi.js';
import cors from 'cors';
import { fileURLToPath } from 'url';
import UserProgressLogger from './userProgressLogger.js';
// import './tracing.js'; // Временно отключено - файл пустой
// Импортируем роутер рецептов
// --- Метрики prom-client ---
import client from 'prom-client';

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Создаём реестр метрик
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Создаём счетчик HTTP-запросов
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Общее количество HTTP-запросов',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestCounter);

// Middleware для учёта запросов
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode
    });
  });
  next();
});

// Эндпоинт для метрик Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
import recipeRouter from './routes/recipeRoutes.js';
import progressRouter from './routes/progressRoutes.js';
import mealPlanCalculator from './utils/mealPlanCalculator.js';
// Импортируем функции для работы с данными пользователя из Firestore
import { readUserData, writeUserData } from './userDataStorage.js';
// Импортируем систему управления подпиской
import './dailyTelegramNotifier.js';
import caloriesApi from './caloriesApi.js';
import notificationSettingsApi from './notificationSettingsApi.js';
import OpenAI from 'openai';
import admin from 'firebase-admin';
import { getFirebaseConfig } from './firestore-config.js';

dotenv.config();

// Инициализация Firebase Admin SDK (если еще не инициализирован)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getFirebaseConfig()),
  });
}

// Инициализация OpenAI клиента
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('🚀 Старт приложения...');

// ...удалено лишнее логирование...
// ...удалено лишнее логирование...
// ...удалено лишнее логирование...

// Разрешить CORS для всех источников (для локальной отладки и Telegram)
app.use(cors({
  origin: true, // Разрешить все origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/api', programApi);
app.use('/api/recipes', recipeRouter);
app.use('/api/progress', progressRouter);
app.use('/api/subscription', subscriptionRouter);
app.use(caloriesApi);
app.use(notificationSettingsApi);

// ...удалено лишнее логирование...
app.use('/api/subscription', subscriptionRouter);
// ...удалено лишнее логирование...
// ...удалено лишнее логирование...
app.use('/api', programApi);
app.use('/api/recipes', recipeRouter);
app.use('/api/progress', progressRouter);
// ...удалено лишнее логирование...

app.get('/', (req, res) => {
  res.send('Backend работает!');
});
// Получить конфиг слайдов теста
app.get('/api/quiz-config', (req, res) => {
  const configPath = path.join(process.cwd(), 'backend', 'quiz-config.json');
  fs.readFile(configPath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Config not found' });
    res.json(JSON.parse(data));
  });
});

// Принять ответы теста и вернуть план (теперь только по базе, без ИИ)
app.post('/api/calculate-plan', async (req, res) => {
  const answers = req.body;
  const userId = answers.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId (Telegram) is required' });
  }
  let saveResult = null;
  try {
    // ИСПРАВЛЕНО: используем UserProgressLogger вместо старых функций
    const logger = new UserProgressLogger(userId);
    const existingData = await logger.loadLog();
    // Сохраняем ответы квиза и связанные данные
    const updatedData = {
      ...existingData, // Сохраняем все существующие данные
      userId: userId,
      quiz: answers,
      trainingType: answers.trainingType,
      weeklySchedule: answers.weeklySchedule,
      weeklyPlan: answers.weeklyPlan
    };
    await logger.saveLog(updatedData);
    saveResult = { success: true };
    // ...удалено логирование...

    // 1. Расчет КБЖУ пользователя
    const macros = mealPlanCalculator.calculateUserMacros(answers);
    // 2. Распределение калорий по приемам пищи
    const mealCalories = mealPlanCalculator.distributeMealCalories(macros.calories);
    // 3. Для каждого приема пищи подобрать 5 вариантов из базы с масштабированием
    const mealTypes = ['Завтрак', 'Перекус', 'Обед', 'Полдник', 'Ужин'];
    const dietType = answers.diet_flags || 'meat';
    const days = [];
    for (let day = 1; day <= 7; day++) {
      const meals = mealTypes.map(type => {
        const options = mealPlanCalculator.getMealOptionsByTypeAndDiet(
          type,
          dietType,
          mealCalories[type],
          5
        );
        return {
          type,
          options,
          targetCalories: mealCalories[type]
        };
      });
      days.push({
        day,
        date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        isWorkoutDay: (day % 2 === 1),
        workout: (day % 2 === 1) ? { exercises: [], duration: 30, difficulty: answers.training_level || 'beginner' } : null,
        meals
      });
    }
    res.json({
      plan: {
        weeks: [{ week: 1, days }],
        macros
      },
      saveResult
    });
  } catch (e) {
    saveResult = { success: false, error: e.message };
    // ...удалено логирование...
    res.status(500).json({ error: 'Ошибка генерации плана', details: e.message });
  }
});

// Импортируем утилиты для работы с рецептами
import recipeUtils from './utils/recipeUtils.js';

// Функция для проверки и исправления повторяющихся блюд в дне
// Использует старую версию, которая просто переименовывает дубликаты
function checkAndFixMealDuplicates(plan) {
  // Используем новую улучшенную функцию с заменой на альтернативные рецепты
  return recipeUtils.checkAndFixMealDuplicatesWithAlternatives(plan);
}

// Функция резервного ответа, если Mistral API недоступен
async function getFallbackResponse(message) {
  const fallbackResponses = [
    "Привет! К сожалению, у меня сейчас технические проблемы с подключением к серверам. Попробуй, пожалуйста, немного позже. Я очень хочу тебе помочь!",
    "Привет! Извини, но мой сервис AI временно недоступен. Это техническое ограничение, которое скоро будет исправлено. Возвращайся через несколько минут!",
    "Здравствуй! У меня небольшие технические неполадки. Команда разработчиков уже работает над решением. Пожалуйста, попробуй снова через некоторое время.",
    "Привет! Прости, но я сейчас не могу полноценно обработать твой запрос из-за технических проблем. Это временно, попробуй позже!"
  ];
  
  // Выбираем случайный ответ из списка
  const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[randomIndex];
}

async function callMistralAI(messages) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return await getFallbackResponse();
  }
  try {
    let response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-medium',
        messages,
        temperature: 0.6,  // Увеличиваем температуру для большего разнообразия
        max_tokens: 2048   // Увеличиваем максимальное количество токенов для более подробных ответов
      })
    });
    
    // Если первая попытка не удалась, пробуем с моделью mistral-tiny
    if (!response.ok) {
      const errorText = await response.text();
      response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-tiny',  // Используем более доступную модель
          messages,
          temperature: 0.6,  // Увеличиваем температуру для большего разнообразия
          max_tokens: 2048   // Увеличиваем максимальное количество токенов для более подробных ответов
        })
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    // В случае ошибки вызываем резервный ответ
    return await getFallbackResponse();
  }
}

// Новый роут для поиска ответа через векторную базу и GPT
app.post('/ask', async (req, res) => {
  const question = req.body.question;
  if (!question) return res.status(400).json({ error: 'No question provided' });

  try {
    // Вызов Python-скрипта qa.py
    const { execSync } = await import('child_process');
    const pyOutput = execSync(`python qa.py "${question.replace(/"/g, '\"')}"`, { encoding: 'utf-8', cwd: __dirname });
    res.json({ answer: pyOutput.trim() });
  } catch (e) {
    res.status(500).json({ error: 'AI error', details: e.message });
  }
});

// Новый роут для чата с Дианой
app.post('/api/chat-diana', async (req, res) => {
  const { message, userId } = req.body;
  if (!message || !userId) return res.status(400).json({ error: 'No message or userId provided' });


  // Фильтрация приветствий и запросов рациона
  const greetings = [
    'привет', 'здравствуйте', 'добрый день', 'добрый вечер', 'доброе утро', 'хай', 'hello', 'hi'
  ];
  const lowerMsg = (message || '').trim().toLowerCase();
  const isGreeting = greetings.some(g => lowerMsg === g || lowerMsg.startsWith(g + ' '));
  const dietKeywords = [
    'рацион', 'питание', 'меню', 'рецепт', 'что поесть', 'подскажи рацион', 'дай рацион', 'план питания', 'еда', 'прием пищи', 'завтрак', 'обед', 'ужин'
  ];
  const isDietRequest = dietKeywords.some(k => lowerMsg.includes(k));

  // Проверяем лимит запросов к Диане
  const limitInfo = await subscriptionManager.default.checkDailyLimit(userId);

  // Загружаем данные пользователя (включая историю диалога)
  let userData = await readUserData(userId);
  if (!userData.dialogHistory) userData.dialogHistory = [];

  // Формируем контекст для ИИ из всего диалога
  let chatContext = userData.dialogHistory.map(m => `${m.role}: ${m.text}`).join('\n');

  // Для простых приветствий не тратим лимит
  if (isGreeting && !isDietRequest) {
    // Приветствие только если это первое сообщение пользователя
    const lastAssistantMsg = userData.dialogHistory.filter(m => m.role === 'assistant').slice(-1)[0];
    const lastWasGreeting = lastAssistantMsg && lastAssistantMsg.text.includes('Диана, твой тренер');
    userData.dialogHistory.push({ role: 'user', text: message, timestamp: new Date().toISOString() });
    if (!lastWasGreeting) {
      userData.dialogHistory.push({ role: 'assistant', text: 'Привет! Я Диана, твой тренер. Как настроение? Чем могу помочь сегодня?', timestamp: new Date().toISOString() });
      await writeUserData(userId, userData);
      return res.json({
        response: 'Привет! Я Диана, твой тренер. Как настроение? Чем могу помочь сегодня?',
        limitInfo: limitInfo
      });
    } else {
      await writeUserData(userId, userData);
      return res.json({
        response: 'Рада снова тебя видеть! Чем могу помочь?',
        limitInfo: limitInfo
      });
    }
  }

  // Проверяем лимит запросов для не-приветствий
  if (!limitInfo.canMakeRequest) {
    const limitMessage = subscriptionManager.default.formatLimitMessage(limitInfo);
    return res.json({
      response: `${limitMessage}`,
      limitExceeded: true,
      limitInfo: limitInfo
    });
  }

  try {
    // Находим релевантные знания из векторной базы
    const userEmbedding = Array(1536).fill(0); // TODO: получить реальный embedding от сообщения
    let relevantChunks = [];
    try {
      // relevantChunks = findRelevantChunks(userEmbedding, 3); // Временно отключено

    } catch (error) {
      // пропуск ошибок
    }
    // Загружаем базу знаний для чата
    let dianaKnowledge = '';
    try {
      // dianaKnowledge = loadDianaKnowledge(); // Временно отключено
    } catch (error) {
      // пропуск ошибок
    }

    // Получаем пол пользователя (sex) из userData.quiz или userData.profile
    let userSex = 'female';
    if (userData && userData.quiz && userData.quiz.sex) {
      userSex = userData.quiz.sex;
    } else if (userData && userData.sex) {
      userSex = userData.sex;
    }

    // Формируем инструкцию для пола
    let genderInstruction = '';
    if (userSex === 'male') {
      genderInstruction = '\nВАЖНО: Пользователь — мужчина. Всегда обращайся к нему в мужском роде, используй мужские окончания, местоимения и стиль общения. Не используй женский род.';
    } else {
      genderInstruction = '\nВАЖНО: Пользователь — женщина. Всегда обращайся к ней в женском роде, используй женские окончания, местоимения и стиль общения. Не используй мужской род.';
    }

    const systemPrompt =
      'Ты — персональный ИИ-тренер Диана, эксперт по похудению и здоровому образу жизни.\n' +
      genderInstruction +
      '\nВАЖНО: Если пользователь уже поздоровался, НЕ повторяй приветствие, а отвечай по сути вопроса. Не начинай ответ с приветствия, если это не первое сообщение!\n' +
      '\nВАЖНО: Отвечай ВСЕГДА в стиле и манере Дианы:\n' +
      '- Будь дружелюбной, понимающей и поддерживающей\n' +
      '- Объясняй просто и доступно, без сложных терминов\n' +
      '- Всегда объясняй ПОЧЕМУ что-то работает или не работает\n' +
      '- Подчеркивай важность здоровых привычек и терпения\n' +
      '- Предупреждай об опасности экстремальных диет и срывов\n' +
      '- Говори о важности адекватного дефицита калорий (не более 10-15%)\n' +
      '- Упоминай, что ниже 1400 калорий опускаться нельзя\n' +
      '\nКЛЮЧЕВЫЕ ПРИНЦИПЫ БЖУ И ПОХУДЕНИЯ ПО ДИАНЕ:\n' +
      '- Базальный метаболизм зависит от возраста, пола, роста и веса\n' +
      '- Дефицит 10-15% (а не 20%) для устойчивого результата\n' +
      '- Белки: 1.2-1.5 г на кг веса для строительства мышц\n' +
      '- Жиры: важны для гормонов, кожи, волос — не снижать ниже нормы\n' +
      '- Углеводы: минимум 120 г в день для энергии и наполнения мышц\n' +
      '- Коридор ±50 ккал от целевой калорийности считается нормой\n' +
      '- Поддержание БЖУ важнее для качества тела, дефицит калорий для снижения веса\n' +
      '\nПРАВИЛА ПО РЕЦЕПТАМ И ПИТАНИЮ:\n' +
      '- Когда рекомендуешь блюда, ВСЕГДА предлагай МАКСИМАЛЬНО РАЗНООБРАЗНЫЕ варианты, опираясь на свои знания о кухнях всего мира\n' +
      '- НИКОГДА не рекомендуй одинаковые источники белка в один день (например, если на завтрак был творог, предлагай на обед мясо или рыбу)\n' +
      '- ОБЯЗАТЕЛЬНО предлагай разные способы приготовления одного и того же продукта (например, для курицы: запеченная, на гриле, тушеная, в соусе и т.д.)\n' +
      '- Предлагай разные источники белка, углеводов и жиров, используя широкие знания о мировой кулинарии\n' +
      '- Если пользователь спрашивает о рационе на день, составь план с разнообразными блюдами из разных кулинарных традиций\n' +
      '- Если видишь, что пользователь повторяет одинаковые блюда, предложи интересные альтернативы с сохранением БЖУ\n' +
      '- Для разнообразия используй не только знания из базы Дианы, но и свои знания о рецептах и блюдах из всего мира\n' +
      '\nПРИМЕРЫ ИСТОЧНИКОВ БЕЛКА, КОТОРЫЕ НУЖНО ЧЕРЕДОВАТЬ:\n' +
      '1. Мясо: говядина, телятина, курица, индейка, кролик, утка, баранина (для не-вегетарианцев)\n' +
      '2. Рыба: треска, лосось, тунец, форель, скумбрия, сибас, дорадо, минтай\n' +
      '3. Морепродукты: креветки, мидии, кальмары, осьминог, гребешки\n' +
      '4. Молочные продукты: творог, сыр, кефир, йогурт, ряженка, скир\n' +
      '5. Яйцо: куриные, перепелиные, яичные белки\n' +
      '6. Растительные: тофу, темпе, сейтан, нут, чечевица, фасоль, киноа, грибы\n' +
      '\nБАЗА ЗНАНИЙ ДИАНЫ (используй этот стиль и информацию):\n' + dianaKnowledge.substring(0, 2000) + '...\n' +
      '\nТы помогаешь пользователям с вопросами о питании, тренировках, мотивации и здоровом образе жизни. При составлении рационов и рецептов ОБЯЗАТЕЛЬНО используй как знания Дианы для принципов БЖУ, так и свои знания о разнообразных блюдах мировой кухни.\n' +
      '\nТвой стиль общения:\n' +
      '- Дружелюбный и поддерживающий\n' +
      '- Профессиональный, но не формальный\n' +
      '- Мотивирующий и позитивный\n' +
      '- Конкретный и практичный\n' +
      '\nИспользуй знания из базы данных для ответов о принципах питания, а свои знания о мировой кухне для рецептов. Отвечай на русском языке.';

    const userPrompt =
      'Вопрос пользователя: ' + message + '\n' +
      'Контекст разговора: ' + chatContext + '\n' +
      (isGreeting ? 'Пользователь уже поздоровался, не повторяй приветствие!\n' : '') +
      'Релевантные знания из базы:\n' +
      relevantChunks.map(function(c) { return c.text; }).join('\n---\n');

    const aiResponse = await callMistralAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    
    // Увеличиваем счетчик запросов после успешного ответа
    console.log('🔢 Увеличиваем счетчик запросов для userId:', userId);
    const updatedLimitInfo = await subscriptionManager.default.incrementDailyRequests(userId);
    console.log('✅ Счетчик запросов увеличен, новая информация о лимитах:', updatedLimitInfo);
    
    // Сохраняем сообщение пользователя и ответ Дианы в историю
    userData.dialogHistory.push({ role: 'user', text: message, timestamp: new Date().toISOString() });
    userData.dialogHistory.push({ role: 'assistant', text: aiResponse, timestamp: new Date().toISOString() });
    await writeUserData(userId, userData);
    
    res.json({ 
      response: aiResponse,
      limitInfo: updatedLimitInfo,
      limitMessage: subscriptionManager.default.formatLimitMessage(updatedLimitInfo)
    });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка при обработке запроса' });
  }
});

// Вспомогательные функции для аналитики
function groupReasonsByCategory(reasons) {
  const categories = {};
  reasons.forEach(reason => {
    const category = reason.category || 'other';
    if (!categories[category]) {
      categories[category] = { count: 0, reasons: [] };
    }
    categories[category].count++;
    categories[category].reasons.push(reason.text);
  });
  return categories;
}

function generateRecommendations(avgCompletion, reasonStats, weekStats) {
  const result = [];
  if (avgCompletion < 50) {
    result.push({ type: 'critical', text: 'Очень низкое выполнение. Нужно срочно пересмотреть план.' });
  }
  // ...дополнительная логика...
  return result;
}

function calculateWeekSummary(weekStats) {
  const totalDays = weekStats.length;
  const avgCompletion = weekStats.reduce((sum, day) => sum + (day.completionPercentage || 0), 0) / totalDays;
  const completedDays = weekStats.filter(day => (day.completionPercentage || 0) >= 70).length;
  const strugglingDays = weekStats.filter(day => (day.completionPercentage || 0) < 40).length;
  
  const totalExercises = weekStats.reduce((sum, day) => sum + (day.totalExercises || 0), 0);
  const completedExercises = weekStats.reduce((sum, day) => sum + (day.completedExercises || 0), 0);
  const exerciseCompletion = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
  
  const totalMeals = weekStats.reduce((sum, day) => sum + (day.totalMeals || 0), 0);
  const completedMeals = weekStats.reduce((sum, day) => sum + (day.completedMeals || 0), 0);
  const mealCompletion = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0;
  
  const stepsCompletedDays = weekStats.filter(day => day.stepsCompleted).length;
  const stepsCompletion = (stepsCompletedDays / totalDays) * 100;
  
  return {
    totalDays,
    avgCompletion: Math.round(avgCompletion),
    completedDays,
    strugglingDays,
    exerciseCompletion: Math.round(exerciseCompletion),
    mealCompletion: Math.round(mealCompletion),
    stepsCompletion: Math.round(stepsCompletion)
  };
}

function analyzeSkipReasons(weekStats) {
  const exerciseReasons = {};
  const mealReasons = {};
  
  weekStats.forEach(day => {
    // Анализируем причины пропуска упражнений
    if (day.exerciseReasons) {
      Object.values(day.exerciseReasons).forEach(reason => {
        if (reason && reason.id) {
          exerciseReasons[reason.id] = (exerciseReasons[reason.id] || 0) + 1;
        }
      });
    }
    
    // Анализируем причины пропуска приемов пищи
    if (day.mealReasons) {
      Object.values(day.mealReasons).forEach(reason => {
        if (reason && reason.id) {
          mealReasons[reason.id] = (mealReasons[reason.id] || 0) + 1;
        }
      });
    }
  });
  
  return { exerciseReasons, mealReasons };
}

function generateWeeklyRecommendations(weekSummary, skipReasons) {
  const recommendations = [];
  
  // Рекомендации на основе общего процента выполнения
  if (weekSummary.avgCompletion < 50) {
    recommendations.push({
      type: 'critical',
      icon: '⚠️',
      title: 'Снижение нагрузки',
      text: 'Рекомендуем упростить план: меньше упражнений, проще рацион питания для лучшей выполнимости.',
      priority: 'high'
    });
  }
  
  // Рекомендации на основе упражнений
  if (weekSummary.exerciseCompletion < 60) {
    const topExerciseReason = Object.keys(skipReasons.exerciseReasons).reduce((a, b) => 
      skipReasons.exerciseReasons[a] > skipReasons.exerciseReasons[b] ? a : b, 'no_time');
      
    switch (topExerciseReason) {
      case 'no_time':
        recommendations.push({
          type: 'schedule',
          icon: '⏰',
          title: 'Оптимизация времени',
          text: 'Попробуйте короткие 15-минутные тренировки или разбейте упражнения на части в течение дня.',
          priority: 'high'
        });
        break;
      case 'too_tired':
        recommendations.push({
          type: 'energy',
          icon: '😴',
          title: 'Управление энергией',
          text: 'Пересмотрите режим сна и добавьте легкие энергизирующие упражнения утром.',
          priority: 'medium'
        });
        break;
      case 'motivation':
        recommendations.push({
          type: 'motivation',
          icon: '💪',
          title: 'Поддержка мотивации',
          text: 'Найдите партнера по тренировкам или создайте систему наград за выполнение целей.',
          priority: 'medium'
        });
        break;
    }
  }
  
  // Рекомендации на основе питания
  if (weekSummary.mealCompletion < 70) {
    const topMealReason = Object.keys(skipReasons.mealReasons).reduce((a, b) => 
      skipReasons.mealReasons[a] > skipReasons.mealReasons[b] ? a : b, 'no_time');
      
    switch (topMealReason) {
      case 'no_time':
        recommendations.push({
          type: 'meal_prep',
          icon: '🍱',
          title: 'Подготовка еды заранее',
          text: 'Готовьте блюда на несколько дней вперед или используйте простые рецепты.',
          priority: 'high'
        });
        break;
      case 'no_products':
        recommendations.push({
          type: 'shopping',
          icon: '🛒',
          title: 'Планирование покупок',
          text: 'Составляйте список покупок на неделю и делайте запасы основных продуктов.',
          priority: 'medium'
        });
        break;
    }
  }
  
  return recommendations;
}

function calculateWeeklyAdjustments(weekSummary, skipReasons) {
  const adjustments = {
    difficulty: 'maintain', // maintain, reduce, increase
    exerciseGoal: 0, // процент изменения
    mealComplexity: 'same', // same, simpler, more_complex
    schedule: 'keep', // keep, more_flexible, stricter
    focusAreas: []
  };
  
  // Корректировки на основе общего выполнения
  if (weekSummary.avgCompletion < 40) {
    adjustments.difficulty = 'reduce';
    adjustments.exerciseGoal = -25; // уменьшить на 25%
    adjustments.mealComplexity = 'simpler';
    adjustments.schedule = 'more_flexible';
    adjustments.focusAreas.push('stress_reduction');
  } else if (weekSummary.avgCompletion > 85) {
    adjustments.difficulty = 'increase';
    adjustments.exerciseGoal = 15; // увеличить на 15%
    adjustments.mealComplexity = 'more_complex';
    adjustments.focusAreas.push('new_challenges');
  }
  
  // Специфичные корректировки
  if (weekSummary.exerciseCompletion < 50) {
    adjustments.focusAreas.push('exercise_motivation');
  }
  
  if (weekSummary.mealCompletion < 60) {
    adjustments.focusAreas.push('meal_planning');
  }
  
  if (weekSummary.stepsCompletion < 40) {
    adjustments.focusAreas.push('daily_activity');
  }
  
  return adjustments;
}

// Функция для проверки и улучшения разнообразия блюд в рационе
function ensureDietDiversity(mealPlan) {
  try {
    // Если это не JSON или не имеет нужной структуры, возвращаем оригинал
    if (!mealPlan || typeof mealPlan !== 'string' || !mealPlan.includes('weeks')) {
      return mealPlan;
    }
    // Парсим JSON-план
    let plan;
    try {
      plan = JSON.parse(mealPlan);
    } catch (e) {
      return mealPlan;
    }
    // Если структура отличается от ожидаемой, возвращаем оригинал
    if (!plan.weeks || !Array.isArray(plan.weeks)) {
      return mealPlan;
    }
    // Для каждой недели проверяем повторяющиеся продукты в течение дня
    let duplicatesFound = false;
    plan.weeks.forEach((week, weekIndex) => {
      if (!week.days || !Array.isArray(week.days)) return;
      week.days.forEach((day, dayIndex) => {
        if (!day.meals || !Array.isArray(day.meals)) return;
        // Собираем все источники белка за день
        const proteinSources = [];
        const mealNames = [];
        day.meals.forEach(meal => {
          if (!meal.meal || !meal.meal.name) return;
          // Проверяем на повторение названий блюд
          if (mealNames.includes(meal.meal.name)) {
            duplicatesFound = true;
          }
          mealNames.push(meal.meal.name);
          // Ищем повторяющиеся источники белка
          if (meal.meal.ingredients && Array.isArray(meal.meal.ingredients)) {
            meal.meal.ingredients.forEach(ingredient => {
              // Проверяем, является ли ингредиент источником белка
              const proteinKeywords = ['курица', 'индейка', 'говядина', 'телятина', 'мясо', 'творог', 'рыба', 
                                       'треска', 'лосось', 'креветки', 'яйцо', 'яйцо', 'тунец', 'форель'];
              for (const keyword of proteinKeywords) {
                if (ingredient.name.toLowerCase().includes(keyword)) {
                  if (proteinSources.some(source => source.toLowerCase().includes(keyword))) {
                    duplicatesFound = true;
                  }
                  proteinSources.push(ingredient.name);
                  break;
                }
              }
            });
          }
        });
      });
    });
    if (duplicatesFound) {
      return null; // Сигнал для повторной генерации
    } else {
      return mealPlan;
    }
  } catch (error) {
    return mealPlan; // В случае ошибки возвращаем оригинальный план
  }
}

// Массив для хранения последних логов
const recentLogs = [];
const MAX_LOGS = 100;

// ...удалено переопределение console.log/error/warn...

// Эндпоинт для просмотра логов (только в dev-среде или с паролем)
app.get('/api/logs', (req, res) => {
  const { password } = req.query;
  
  // Очень простая защита (в реальном приложении сделайте более надежную)
  if (process.env.NODE_ENV !== 'production' || password === 'diana123') {
    res.json({
      logs: recentLogs,
      count: recentLogs.length,
      message: 'Логи загружены'
    });
  } else {
    res.status(403).json({
      message: 'Доступ запрещен'
    });
  }
});

// Новый эндпоинт для получения аналитики по неделе
app.post('/api/analytics/week', async (req, res) => {
  const { weekData } = req.body;
  
  if (!weekData || !Array.isArray(weekData)) {
    return res.status(400).json({ error: 'Invalid week data' });
  }
  
  try {
    // Пример аналитики: процент выполненных упражнений и приемов пищи
    const totalDays = weekData.length;
    const completedDays = weekData.filter(day => day.completionPercentage >= 70).length;
    const strugglingDays = weekData.filter(day => day.completionPercentage < 40).length;
    const totalExercises = weekData.reduce((sum, day) => sum + (day.totalExercises || 0), 0);
    const completedExercises = weekData.reduce((sum, day) => sum + (day.completedExercises || 0), 0);
    const exerciseCompletion = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
    const totalMeals = weekData.reduce((sum, day) => sum + (day.totalMeals || 0), 0);
    const completedMeals = weekData.reduce((sum, day) => sum + (day.completedMeals || 0), 0);
    const mealCompletion = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0;
    res.json({
      success: true,
      analytics: {
        totalDays,
        completedDays,
        strugglingDays,
        exerciseCompletion: Math.round(exerciseCompletion),
        mealCompletion: Math.round(mealCompletion)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения аналитики' });
  }
});

// Эндпоинт для перегенерации плана питания с акцентом на разнообразие
app.post('/api/regenerate-plan', async (req, res) => {
  const { currentPlan } = req.body;
  
  if (!currentPlan) {
    return res.status(400).json({ error: 'No current plan provided' });
  }
  
  try {
    // Вызываем функцию для проверки и улучшения разнообразия блюд
    const diversifiedPlan = ensureDietDiversity(currentPlan);
    if (!diversifiedPlan) {
      return res.status(500).json({ error: 'Не удалось перегенерировать план, обратитесь к администратору' });
    }
    res.json({
      success: true,
      plan: diversifiedPlan
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка перегенерации плана' });
  }
});

// Получить прогресс пользователя
app.get('/api/user-progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Используем UserProgressLogger для чтения истории
        const logger = new UserProgressLogger(userId);
        const userHistory = logger.loadLog();
        // Расчет процента выполнения тренировок
        const workoutProgress = calculateWorkoutProgress(userHistory);
        // Расчет процента успехов в питании
        const nutritionProgress = calculateNutritionProgress(userHistory);
        // Детальная статистика по категориям
        const detailedStats = {
            meals: {
                breakfast: calculateMealAdherence(userHistory, 'breakfast'),
                lunch: calculateMealAdherence(userHistory, 'lunch'),
                dinner: calculateMealAdherence(userHistory, 'dinner'),
                snacks: calculateMealAdherence(userHistory, 'snacks')
            },
            weeklyProgress: calculateWeeklyProgress(userHistory),
            commonIssues: analyzeCommonIssues(userHistory),
            improvements: calculateImprovements(userHistory)
        };
        res.json({
            workouts: workoutProgress,
            nutrition: nutritionProgress,
            details: detailedStats,
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        // ...удалено логирование...
        res.status(500).json({ error: 'Internal server error', details: error.message, userHistory });
    }
});

// Эндпоинт для получения прогресса пользователя
app.get('/api/user/progress', async (req, res) => {
    try {
        const userId = req.user.id; // Предполагаем, что у нас есть middleware аутентификации
        const logger = new UserProgressLogger(userId);
        
        const progress = logger.analyzeWeeklyProgress();
        const recommendations = logger.generateRecommendations();
        
        res.json({ progress, recommendations });
    } catch (error) {
        // ...удалено логирование...
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для получения прогресса пользователя по userId
app.get('/api/user/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // ...удалено диагностическое логирование...
        const logger = new UserProgressLogger(userId);
        const progressData = logger.loadLog();
        res.json(progressData);
    } catch (error) {
        console.error('Error getting user progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для обновления ответов квиза
app.post('/api/user/update-quiz-answers', async (req, res) => {
    try {
        const userId = req.user.id;
        const changes = req.body;
        
        // Логируем изменения
        const logger = new UserProgressLogger(userId);
        await logger.logProfileChange(changes);
        
        // Обновляем настройки пользователя в БД
        await updateUserSettings(userId, changes);
        
        res.json({ success: true });
    } catch (error) {
        // ...удалено логирование...
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для логирования выполнения плана
app.post('/api/user/log-execution', async (req, res) => {
    try {
        // Исправлено: userId теперь берём из body, а не из req.user
        const { userId, mealType, executed, reason } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        const logger = new UserProgressLogger(userId);
        await logger.logPlanExecution(mealType, executed, reason);
        res.json({ success: true });
    } catch (error) {
        // ...удалено логирование...
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обновляем обработчик генерации недельного плана
app.post('/api/generate-weekly-plan', async (req, res) => {
    try {
        const userId = req.user.id;
        const logger = new UserProgressLogger(userId);
        
        // Получаем историю и анализ
        const progress = logger.analyzeWeeklyProgress();
        const recommendations = logger.generateRecommendations();
        
        // Получаем текущие настройки пользователя
        const userSettings = await getUserSettings(userId);
        
        // Формируем контекст для Mistral
        let context =
          'Генерация плана питания с учетом:\n' +
          '- Текущий процент выполнения: ' + (progress.executionRate * 100) + '%\n' +
          '- Частые причины пропуска: ' + progress.commonReasons.join(', ') + '\n' +
          '- Тип диеты: ' + userSettings.dietType + '\n' +
          '- Исключенные продукты: ' + userSettings.excludedProducts.join(', ') + '\n' +
          '- Предпочитаемые продукты: ' + userSettings.preferredProteins.join(', ');

        // Запрос к Mistral с учетом контекста
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": 'Bearer ' + process.env.MISTRAL_API_KEY
            },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [
                    { 
                        role: "system", 
                        content: 'Ты - Диана, эксперт по питанию. Генерируешь план на основе:\n' + context
                    },
                    { 
                        role: "user", 
                        content: "Составь план питания на неделю с учетом моей истории и настроек" 
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error('Mistral API error: ' + response.status);
        }

        const data = await response.json();
        const plan = data.choices[0].message.content;

        // Если процент выполнения низкий, добавляем рекомендации
        if (progress.executionRate < 0.7) {
            res.json({ 
                plan,
                recommendations,
                showWarning: true
            });
        } else {
            res.json({ plan });
        }

    } catch (error) {
        // ...удалено логирование...
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Реальные функции расчёта прогресса на основе planExecution ---
function calculateWorkoutProgress(userHistory) {
  // Считаем процент выполненных упражнений и активностей за последние 7 дней из dailyProgress
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dailyProgress = userHistory.dailyProgress || {};
  
  let totalActivities = 0;
  let completedActivities = 0;
  
  // ...удалено логирование...
  
  // Проходим по всем дням за неделю
  Object.entries(dailyProgress).forEach(([date, dayData]) => {
    const dayDate = new Date(date);
    // ...удалено логирование...
    
    if (dayDate >= weekAgo && dayDate <= now) {
      const tasks = dayData.tasks || [];
      // Считаем все задания кроме приемов пищи (упражнения, шаги и т.д.)
      const activityTasks = tasks.filter(task => 
        task.type !== 'meal'
      );
      
      // ...удалено логирование...
      
      totalActivities += activityTasks.length;
      completedActivities += activityTasks.filter(task => task.done).length;
    }
  });
  
  // ...удалено логирование...
  
  const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  // ...удалено логирование...
  
  return progress;
}

function calculateNutritionProgress(userHistory) {
  // Считаем процент выполненных приёмов пищи за последние 7 дней из dailyProgress
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dailyProgress = userHistory.dailyProgress || {};
  
  let totalMeals = 0;
  let completedMeals = 0;
  
  // ...удалено логирование...
  
  // Проходим по всем дням за неделю
  Object.entries(dailyProgress).forEach(([date, dayData]) => {
    const dayDate = new Date(date);
    // ...удалено логирование...
    
    if (dayDate >= weekAgo && dayDate <= now) {
      const tasks = dayData.tasks || [];
      // Считаем только приемы пищи
      const mealTasks = tasks.filter(task => task.type === 'meal');
      
      // ...удалено логирование...
      
      totalMeals += mealTasks.length;
      completedMeals += mealTasks.filter(task => task.done).length;
    }
  });
  
  // ...удалено логирование...
  
  // Всегда считаем от недельной нормы 35 приемов пищи (5 приемов × 7 дней)
  const expectedMealsPerWeek = 35;
  
  const progress = Math.round((completedMeals / expectedMealsPerWeek) * 100);
  // ...удалено логирование...
  
  return progress;
}

function calculateMealAdherence(userHistory, mealType) {
  // Процент выполнения по каждому приёму пищи за неделю из dailyProgress
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dailyProgress = userHistory.dailyProgress || {};
  
  let totalMealsOfType = 0;
  let completedMealsOfType = 0;
  
  // Проходим по всем дням за неделю
  Object.entries(dailyProgress).forEach(([date, dayData]) => {
    const dayDate = new Date(date);
    if (dayDate >= weekAgo && dayDate <= now) {
      const tasks = dayData.tasks || [];
      // Ищем конкретный тип приема пищи
      const mealTasks = tasks.filter(task => 
        task.type === 'meal' && 
        task.name && 
        task.name.toLowerCase().includes(mealType.toLowerCase())
      );
      
      totalMealsOfType += mealTasks.length;
      completedMealsOfType += mealTasks.filter(task => task.done).length;
    }
  });
  
  return totalMealsOfType > 0 ? Math.round((completedMealsOfType / totalMealsOfType) * 100) : 0;
}

function calculateWeeklyProgress(userHistory) {
  // Можно реализовать детальный недельный прогресс, если потребуется
  return [];
}

function analyzeCommonIssues(userHistory) {
  // Анализируем причины невыполнения за неделю
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const planExecution = userHistory.planExecution || [];
  const failures = planExecution.filter(e => !e.executed && e.reason && new Date(e.timestamp) > weekAgo);
  const reasons = failures.map(e => e.reason);
  const reasonCounts = reasons.reduce((acc, reason) => {
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(reasonCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([reason]) => reason);
}

function calculateImprovements(userHistory) {
  // Можно реализовать тренды по неделям, если потребуется
  return { weekOverWeek: 0, trend: 'up' };
}

// Получить статусы выполнения приёмов пищи и тренировок за день
app.get('/api/user/day-status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { date } = req.query;
        const logger = new UserProgressLogger(userId);
        const userHistory = logger.loadLog();
        const planExecution = userHistory.planExecution || [];
        // Фильтруем по дате (только YYYY-MM-DD)
        const dayEntries = planExecution.filter(e => e.timestamp && e.timestamp.startsWith(date));
        // Собираем статусы по типу приёма пищи
        const mealStatus = {};
        const completedMealsArr = [];
        const completedExercises = [];
        dayEntries.forEach(e => {
            if (e.mealType === 'workout') {
                completedExercises.push(e.executed);
            } else {
                mealStatus[e.mealType] = e.executed;
                completedMealsArr.push(e.executed);
            }
        });
        res.json({ mealStatus, completedMealsArr, completedExercises });
    } catch (error) {
        // ...удалено логирование...
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для получения КБЖУ пользователя из Firestore
app.get('/api/user/nutrition/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Получаем данные пользователя из Firestore
        const userDoc = await db.collection('Dianafit_users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User data not found' });
        }
        
        const userData = userDoc.data();
        const quiz = userData.quiz || {};
        
        // Единая формула КБЖУ (как в programApi.js)
        const age = Number(quiz.age) || 25;
        const weight = Number(quiz.weight) || Number(quiz.weight_kg) || 65;
        const height = Number(quiz.height) || Number(quiz.height_cm) || 165;
        const sex = quiz.sex || 'female';
        const activity = Number(quiz.activity) || Number(quiz.activity_coef) || 1.375;
        const goal = Number(quiz.goal) || 4;
        
        // Единая формула BMR (Harris-Benedict как в programApi.js)
        let bmr;
        if (sex === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
        
        // Итоговые калории с учётом цели (единая формула как в programApi.js)
        let dailyCalories;
        let deficit = 0;
        if ([3,4,5].includes(goal)) {
            deficit = goal * 7700 / 30;
            dailyCalories = Math.round(bmr * activity - deficit);
        } else {
            dailyCalories = Math.round(bmr * activity);
        }
        
        // Минимум 1400 ккал для всех
        dailyCalories = Math.max(1400, dailyCalories);
        
        // Единая формула БЖУ (как в programApi.js)
        const protein = Math.round(weight * 1.5); // Исправлено: была 1.8, теперь 1.5 как везде
        const fat = Math.round(weight * 0.9);
        const carbs = Math.round((dailyCalories - (protein * 4 + fat * 9)) / 4);
        
        res.json({
            calories: dailyCalories,
            protein: protein,
            fats: fat,
            carbs: carbs,
            bmr: Math.round(bmr),
            deficit: Math.round(deficit)
        });
    } catch (error) {
        // ...удалено логирование...
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для получения ответов квиза пользователя
app.get('/api/user/subscription-info/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const subscriptionStatus = await subscriptionManager.default.getSubscriptionStatus(userId);
    
    // Получаем сырые данные пользователя для доступа к датам
    const userData = await readUserData(userId);
    const subscription = userData?.subscription || {};
    
    res.json({
      isActive: subscriptionStatus.isPremium,
      startDate: subscription.premiumActivatedAt,
      endDate: subscription.premiumExpiresAt,
      type: 'premium',
      daysLeft: subscriptionStatus.daysLeft
    });
  } catch (error) {
    // ...удалено логирование...
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/quiz-answers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // ОПТИМИЗИРОВАНО: Убираем избыточное логирование
        const userData = await readUserData(userId);
        
        if (!userData.quiz) {
            return res.status(404).json({ error: 'Quiz data not found' });
        }
        
        // ОПТИМИЗИРОВАНО: Возвращаем только нужные поля вместо всего документа
        res.json({
            userId: userData.userId,
            quiz: userData.quiz,
            dialogHistory: userData.dialogHistory || [],
            lastUpdate: userData.lastUpdate
        });
    } catch (error) {
        console.error('❌ [quiz-answers] Error getting user quiz answers:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Эндпоинт для сохранения ответов квиза пользователя - ОПТИМИЗИРОВАНО
app.post('/api/user/quiz-answers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const quizData = req.body;
        
        // ОПТИМИЗИРОВАНО: Валидация данных
        if (!quizData || typeof quizData !== 'object') {
            return res.status(400).json({ error: 'Invalid quiz data' });
        }
        
        let userData = await readUserData(userId);
        userData.quiz = quizData;
        userData.lastUpdate = new Date().toISOString();
        await writeUserData(userId, userData);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ [quiz-answers] Error saving user quiz answers:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/user/quiz-answers/:userId — частичное обновление quiz - ОПТИМИЗИРОВАНО
app.patch('/api/user/quiz-answers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const patchData = req.body;
        
        // ОПТИМИЗИРОВАНО: Валидация данных
        if (!patchData || typeof patchData !== 'object') {
            return res.status(400).json({ error: 'Invalid patch data' });
        }
        
        let userData = await readUserData(userId);
        if (!userData.quiz) userData.quiz = {};
        userData.quiz = { ...userData.quiz, ...patchData };
        userData.lastUpdate = new Date().toISOString();
        await writeUserData(userId, userData);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ [quiz-answers] Error patching user quiz answers:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint для активации премиума
app.post('/api/activate-premium', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    console.log('🎉 Активируем премиум для userId:', userId);
    
    // Используем subscriptionManager для активации премиума
    const activationResult = await subscriptionManager.default.activatePremium(userId);
    
    console.log('✅ Премиум активирован:', activationResult);
    res.json({ 
      success: true, 
      message: 'Premium activated successfully',
      isPremium: true,
      ...activationResult
    });
  } catch (error) {
    console.error('❌ Ошибка активации премиума:', error);
    res.status(500).json({ error: 'Failed to activate premium' });
  }
});

// API endpoint для активации тестовой премиум подписки
app.post('/api/activate-test-premium', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'No userId provided' });

  try {
    const activationResult = await subscriptionManager.default.activatePremium(userId);
    // ...лог убран...
    
    res.json({
      success: true,
      message: '🎉 Тестовая премиум подписка активирована на 30 дней!',
      ...activationResult
    });
  } catch (error) {
    console.error('Ошибка активации тестовой премиум подписки:', error);
    res.status(500).json({ error: 'Ошибка при активации премиум подписки' });
  }
});

// Роут для получения информации о лимитах
app.get('/api/diana-limits/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'No userId provided' });

  try {
    const limitInfo = await subscriptionManager.default.checkDailyLimit(userId);
    const subscriptionStatus = await subscriptionManager.default.getSubscriptionStatus(userId);
    
    res.json({
      ...limitInfo,
      subscriptionStatus,
      message: subscriptionManager.default.formatLimitMessage(limitInfo)
    });
  } catch (error) {
    console.error('Ошибка получения лимитов Дианы:', error);
    res.status(500).json({ error: 'Ошибка при получении лимитах' });
  }
});

// Тестовый эндпоинт для установки даты создания программы в прошлое (для тестирования)
app.post('/api/test-set-program-date/:userId', async (req, res) => {
  const { userId } = req.params;
  const { daysAgo } = req.body;
  if (!userId) return res.status(400).json({ error: 'No userId provided' });

  try {
    const userData = await readUserData(userId);
    
    if (!userData.programData) {
      return res.status(404).json({ error: 'Program not found for this user' });
    }

    // Устанавливаем дату создания программы на N дней назад
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - (daysAgo || 4));
    
    userData.programData.createdAt = pastDate.toISOString();
    await writeUserData(userId, userData);
    
    res.json({
      success: true,
      message: `Дата создания программы установлена на ${daysAgo || 4} дней назад`,
      programCreatedAt: userData.programData.createdAt,
      daysAgo: daysAgo || 4
    });
  } catch (error) {
    console.error('Ошибка установки даты программы:', error);
    res.status(500).json({ error: 'Ошибка при установке даты программы' });
  }
});

// Тестовый эндпоинт для симуляции нажатия кнопки "Подключить премиум" в модальном окне
app.post('/api/modal-premium-button/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'No userId provided' });

  try {
    // Проверяем доступ к программе (как в модальном окне)
    const subscriptionStatus = await subscriptionManager.default.getSubscriptionStatus(userId);
    
    if (subscriptionStatus.isPremium) {
      return res.json({
        action: 'already_premium',
        message: 'Пользователь уже имеет премиум',
        redirectTo: 'program'
      });
    }

    // Получаем данные пользователя для проверки пробного периода
    const userData = await readUserData(userId);
    
    if (!userData.programData || !userData.programData.createdAt) {
      return res.json({
        action: 'no_program',
        message: 'Программа не создана, модальное окно не должно появляться',
        redirectTo: 'quiz'
      });
    }

    const programCreatedAt = new Date(userData.programData.createdAt);
    const now = new Date();
    const daysPassed = Math.floor((now - programCreatedAt) / (1000 * 60 * 60 * 24));
    
    if (daysPassed >= 3) {
      // Симулируем логику кнопки в модальном окне
      return res.json({
        action: 'redirect_to_payment',
        message: 'Кнопка "Подключить премиум" нажата - переход на страницу оплаты',
        modalClosed: true,
        testWeekClosed: true,
        paymentPageOpened: true,
        trialExpired: true,
        daysPassed,
        redirectTo: 'payment'
      });
    } else {
      return res.json({
        action: 'trial_active',
        message: 'Пробный период еще активен, модальное окно не должно появляться',
        daysLeft: 3 - daysPassed,
        redirectTo: 'program'
      });
    }

  } catch (error) {
    console.error('Ошибка симуляции кнопки модального окна:', error);
    res.status(500).json({ error: 'Ошибка при обработке запроса' });
  }
});

// Роут для проверки доступа к программе (проверка 3-дневного пробного периода)
app.get('/api/program-access/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'No userId provided' });

  try {
    // Проверяем статус премиум подписки
    const subscriptionStatus = await subscriptionManager.default.getSubscriptionStatus(userId);
    
    // Если есть премиум - доступ разрешен
    if (subscriptionStatus.isPremium) {
      return res.json({
        hasAccess: true,
        isPremium: true,
        reason: 'premium_access',
        message: 'Доступ разрешен (Premium подписка)'
      });
    }

    // Получаем данные пользователя для проверки даты создания программы
    const userData = await readUserData(userId);
    
    // Если нет программы - пользователь еще не начинал
    if (!userData.programData || !userData.programData.createdAt) {
      return res.json({
        hasAccess: true,
        isPremium: false,
        reason: 'no_program_yet',
        message: 'Программа еще не создана'
      });
    }

    // Проверяем сколько дней прошло с момента создания программы
    const programCreatedAt = new Date(userData.programData.createdAt);
    const now = new Date();
    const daysPassed = Math.floor((now - programCreatedAt) / (1000 * 60 * 60 * 24));
    
    console.log(`🔒 [PROGRAM ACCESS] userId: ${userId}, программа создана: ${userData.programData.createdAt}, дней прошло: ${daysPassed}`);

    // Если прошло больше 3 дней - требуется премиум
    if (daysPassed >= 3) {
      return res.json({
        hasAccess: false,
        isPremium: false,
        reason: 'trial_expired',
        daysPassed,
        trialDays: 3,
        message: 'Пробный период (3 дня) истек. Необходимо подключить Premium для продолжения.'
      });
    }

    // Пробный период еще действует
    return res.json({
      hasAccess: true,
      isPremium: false,
      reason: 'trial_period',
      daysPassed,
      daysLeft: 3 - daysPassed,
      trialDays: 3,
      message: `Пробный период. Осталось дней: ${3 - daysPassed}`
    });

  } catch (error) {
    console.error('Ошибка проверки доступа к программе:', error);
    res.status(500).json({ error: 'Ошибка при проверке доступа' });
  }
});

// Эндпоинт для админской панели - статистика по квизу
app.get('/api/admin/stats', async (req, res) => {
  try {
    // ...лог убран...
    
    // Импортируем необходимые модули для работы с Firestore
    const { getUsersCollection } = await import('./firestore-config.js');
    const admin = await import('firebase-admin');
    const db = admin.default.firestore();
    const usersCollection = getUsersCollection();
    
    // Получаем всех пользователей
    const snapshot = await db.collection(usersCollection).get();
    const allUsers = [];
    
    snapshot.forEach(doc => {
      allUsers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // ...лог убран...
    
    // Базовая статистика
    const totalUsers = allUsers.length;
    
    // Премиум пользователи - проверяем subscription.premiumExpiresAt
    let premiumUsers = 0;
    for (const user of allUsers) {
      if (user.subscription && user.subscription.premiumExpiresAt) {
        const expiresAt = new Date(user.subscription.premiumExpiresAt);
        const now = new Date();
        if (expiresAt > now) {
          premiumUsers++;
          // ...лог убран...
        }
      }
    }
    
    // Статистика по полу - данные берем из quiz.sex
    const maleCount = allUsers.filter(user => user.quiz && user.quiz.sex === 'male').length;
    const femaleCount = allUsers.filter(user => user.quiz && user.quiz.sex === 'female').length;
    const unknownGenderCount = totalUsers - maleCount - femaleCount;
    
    // Статистика по возрасту (в процентах)
    const ageGroups = {
      '14-20': 0,
      '21-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61+': 0,
      'неизвестно': 0
    };
    
    allUsers.forEach(user => {
      const age = user.quiz ? parseInt(user.quiz.age) : NaN;
      if (isNaN(age)) {
        ageGroups['неизвестно']++;
      } else if (age >= 14 && age <= 20) {
        ageGroups['14-20']++;
      } else if (age >= 21 && age <= 30) {
        ageGroups['21-30']++;
      } else if (age >= 31 && age <= 40) {
        ageGroups['31-40']++;
      } else if (age >= 41 && age <= 50) {
        ageGroups['41-50']++;
      } else if (age >= 51 && age <= 60) {
        ageGroups['51-60']++;
      } else if (age >= 61) {
        ageGroups['61+']++;
      } else {
        ageGroups['неизвестно']++;
      }
    });
    
    // Преобразуем в проценты
    const ageGroupsPercent = {};
    Object.keys(ageGroups).forEach(group => {
      ageGroupsPercent[group] = totalUsers > 0 ? Math.round((ageGroups[group] / totalUsers) * 100) : 0;
    });
    
    // Статистика по весу - данные берем из quiz.weight_kg
    const highWeightCount = allUsers.filter(user => {
      const weight = user.quiz ? parseInt(user.quiz.weight_kg) : NaN;
      return !isNaN(weight) && weight >= 90; // считаем большим весом 90+ кг
    }).length;
    
    // Статистика по количеству тренировок в неделю - данные из quiz
    const workoutsPerWeekStats = {};
    allUsers.forEach(user => {
      const workouts = user.quiz ? user.quiz.workouts_per_week : null;
      const workoutsKey = workouts ? `${workouts} тренировок` : 'неизвестно';
      workoutsPerWeekStats[workoutsKey] = (workoutsPerWeekStats[workoutsKey] || 0) + 1;
    });
    
    // Статистика по целям похудения - данные из quiz (исправленные значения)
    const goalStats = {};
    allUsers.forEach(user => {
      const goal = user.quiz ? user.quiz.goal : null;
      let goalText = 'неизвестно';
      // Исправляем сопоставление целей согласно реальным данным
      if (goal === 3) goalText = 'Похудеть на 3 кг в месяц';
      else if (goal === 4) goalText = 'Похудеть на 4 кг в месяц';  
      else if (goal === 5) goalText = 'Похудеть на 5 кг в месяц';
      else if (goal === 1) goalText = 'Похудеть немного (1-5 кг)';
      else if (goal === 2) goalText = 'Похудеть умеренно (5-15 кг)';
      goalStats[goalText] = (goalStats[goalText] || 0) + 1;
    });
    
    // Статистика по месту тренировок - данные из quiz
    const gymOrHomeStats = {};
    allUsers.forEach(user => {
      const place = user.quiz ? user.quiz.gym_or_home : null;
      const placeText = place === 'home' ? 'Дома' : 
                       place === 'gym' ? 'В спортзале' : 
                       'неизвестно';
      gymOrHomeStats[placeText] = (gymOrHomeStats[placeText] || 0) + 1;
    });
    
    // Статистика по уровню подготовки - данные из quiz
    const trainingLevelStats = {};
    allUsers.forEach(user => {
      const level = user.quiz ? user.quiz.training_level : null;
      const levelText = level === 'beginner' ? 'Новичок' : 
                       level === 'intermediate' ? 'Средний' : 
                       level === 'advanced' ? 'Продвинутый' : 
                       'неизвестно';
      trainingLevelStats[levelText] = (trainingLevelStats[levelText] || 0) + 1;
    });
    
    // Статистика по типу питания - данные из quiz
    const dietStats = {};
    allUsers.forEach(user => {
      const diet = user.quiz ? user.quiz.diet_flags : null;
      const dietText = diet === 'vegetarian_eggs' ? 'Вегетарианство с яйцом' : 
                      diet === 'vegetarian_no_eggs' ? 'Вегетарианство (без яиц)' : 
                      diet === 'meat' ? 'Мясной' : 
                      diet === 'fish' ? 'Рыбный' : 
                      diet === 'vegan' ? 'Веганство' : 
                      'неизвестно';
      dietStats[dietText] = (dietStats[dietText] || 0) + 1;
    });
    
    // Анализируем выполнение упражнений и питания на основе реальных данных
    let exerciseCompletionSum = 0;
    let nutritionCompletionSum = 0;
    let stepsCompletionSum = 0;
    let usersWithProgress = 0;
    let usersWithExerciseData = 0;
    let usersWithNutritionData = 0;
    let usersWithStepsData = 0;
    
    // ...лог убран...
    
    for (const user of allUsers) {
      let hasAnyProgress = false;
      
      // Анализируем данные из dailyProgress
      if (user.dailyProgress && Object.keys(user.dailyProgress).length > 0) {
        hasAnyProgress = true;
        // ...лог убран...
        
        let userExerciseTotal = 0;
        let userExerciseCompleted = 0;
        let userNutritionTotal = 0;
        let userNutritionCompleted = 0;
        let userStepsTotal = 0;
        let userStepsCompleted = 0;
        
        Object.values(user.dailyProgress).forEach(dayData => {
          if (dayData.tasks && Array.isArray(dayData.tasks)) {
            dayData.tasks.forEach(task => {
              if (task.type === 'workout') {
                userExerciseTotal++;
                if (task.done === true) userExerciseCompleted++;
              } else if (task.type === 'meal') {
                userNutritionTotal++;
                if (task.done === true) userNutritionCompleted++;
              } else if (task.type === 'steps') {
                userStepsTotal++;
                if (task.done === true || task.status === 'completed' || 
                    (task.steps_estimated && task.goal && task.steps_estimated >= task.goal)) {
                  userStepsCompleted++;
                }
              }
            });
          }
        });
        
        if (userExerciseTotal > 0) {
          usersWithExerciseData++;
          const userExercisePercent = (userExerciseCompleted / userExerciseTotal) * 100;
          exerciseCompletionSum += userExercisePercent;
          // ...лог убран...
        }
        
        if (userNutritionTotal > 0) {
          usersWithNutritionData++;
          const userNutritionPercent = (userNutritionCompleted / userNutritionTotal) * 100;
          nutritionCompletionSum += userNutritionPercent;
          // ...лог убран...
        }
        
        if (userStepsTotal > 0) {
          usersWithStepsData++;
          const userStepsPercent = (userStepsCompleted / userStepsTotal) * 100;
          stepsCompletionSum += userStepsPercent;
          // ...лог убран...
        }
      }
      
      // Анализируем данные из programData
      if (user.programData && user.programData.days && Array.isArray(user.programData.days)) {
        hasAnyProgress = true;
        // ...лог убран...
        
        let userExerciseTotal = 0;
        let userExerciseCompleted = 0;
        let userNutritionTotal = 0;
        let userNutritionCompleted = 0;
        let userStepsTotal = 0;
        let userStepsCompleted = 0;
        
        user.programData.days.forEach(day => {
          // Упражнения
          if (day.completedExercises && Array.isArray(day.completedExercises)) {
            day.completedExercises.forEach(completed => {
              userExerciseTotal++;
              if (completed === true) userExerciseCompleted++;
            });
          }
          
          // Питание
          if (day.completedMealsArr && Array.isArray(day.completedMealsArr)) {
            day.completedMealsArr.forEach(completed => {
              userNutritionTotal++;
              if (completed === true) userNutritionCompleted++;
            });
          }
          
  // ...удалён ошибочный дублирующийся блок async/await...
          // ...удалено лишнее логирование...
        });
      }
      
      if (hasAnyProgress) {
        usersWithProgress++;
      }
    }
    
    // Вычисляем средние проценты выполнения
    const avgExerciseCompletion = usersWithExerciseData > 0 ? Math.round(exerciseCompletionSum / usersWithExerciseData) : 0;
    const avgNutritionCompletion = usersWithNutritionData > 0 ? Math.round(nutritionCompletionSum / usersWithNutritionData) : 0;
    const avgStepsCompletion = usersWithStepsData > 0 ? Math.round(stepsCompletionSum / usersWithStepsData) : 0;
    // ...лог убран...
    
    const stats = {
      totalUsers,
      premiumUsers,
      maleCount,
      femaleCount,
      unknownGenderCount,
      ageGroupsPercent,
      highWeightCount,
      workoutsPerWeekStats,
      goalStats,
      gymOrHomeStats,
      trainingLevelStats,
      dietStats,
      avgExerciseCompletion,
      avgNutritionCompletion,
      avgStepsCompletion,
      usersWithProgress,
      timestamp: new Date().toISOString()
    };
    
    // ...лог убран...
    res.json(stats);
    
  } catch (error) {
    console.error('[ADMIN] Ошибка получения статистики:', error);
    res.status(500).json({ 
      error: 'Ошибка получения статистики', 
      details: error.message 
    });
  }
});

// === ЭНДПОИНТЫ ДЛЯ УВЕДОМЛЕНИЙ ДИАНЫ ===

// Эндпоинт для AI анализа недели пользователя (для 7-го дня)
app.post('/api/openai-diana-analyze', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Требуется параметр userId' });
    }
    
    // ...лог убран...
    
    // Проверяем, не анализировали ли мы уже сегодня
    const today = new Date().toISOString().split('T')[0];
    const admin = await import('firebase-admin');
    const db = admin.default.firestore();
    const userRef = db.collection('Dianafit_users').doc(userId);
    
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const lastAnalysisDate = userDoc.data()?.lastWeeklyAnalysis;
      if (lastAnalysisDate === today) {
        // ...лог убран...
        return res.status(429).json({ alreadyShown: true });
      }
    }
    
    // Загружаем данные пользователя для анализа
    const userData = await readUserData(userId);
    
    if (!userData || !userData.dailyProgress || Object.keys(userData.dailyProgress).length === 0) {
      // ...лог убран...
      return res.json({ 
        message: 'Поздравляю с завершением недели! Пока мало данных для подробного анализа, но ты уже на правильном пути! 🎉' 
      });
    }
    
    // Определяем пол пользователя для правильного обращения
    const userGender = userData?.quiz?.sex || 'unknown';
    const genderInstruction = userGender === 'male' 
      ? 'Пользователь — мужчина. Обращайся соответственно: "ты молодец", "ты справился", "у тебя получилось" и т.п.'
      : userGender === 'female'
      ? 'Пользователь — женщина. Обращайся соответственно: "ты молодец", "ты справилась", "у тебя получилось" и т.п.'
      : 'Пол пользователя неизвестен. Используй нейтральные формы обращения без гендерной привязки.';

    // Формируем промпт для анализа
    const dianaPrompt = `Ты — фитнес-тренер Диана из приложения для похудения. Проанализируй прошедшую неделю пользователя: тренировки, питание, шаги, причины пропусков. Делай анализ для себя, но пользователю выдай только выводы и рекомендации — кратко, без перечислений и подробной статистики.

${genderInstruction}

Говори от первого лица — как Диана. Не используй нейтральные и безличные фразы, не пиши от имени команды или приложения. Стиль — спокойный, живой, поддерживающий.

Не пиши подробные отчёты. Не указывай конкретные даты, количество пропущенных приёмов пищи, шагов, тренировок и т.п. Просто делай вежливые, логичные выводы, например: «заметила, что не все тренировки удалось выполнить», «возможно, неделя была сложной», «можно немного снизить нагрузку». То же самое — по питанию и шагам. Только выводы и рекомендации, никаких чисел.

Обязательно:
- Напомни, что тренировки — это видеоуроки, которые можно выбирать самостоятельно (3–5 раз в неделю);
- Питание — по рассчитанному калоражу, отмечается вручную;
- Цель по шагам — 10 000 шагов в день (примерно 1,5 часа ходьбы);
- Дай рекомендации по активности: прогулки, лестницы, больше движения в течение дня;
- Если были сложности — предложи снизить количество тренировок;
- В конце обязательно напомни, что сегодня последний день перед новой неделей, когда можно изменить настройки: количество тренировок и диету.

Не допускай орфографических и смысловых ошибок. Не используй "с уважением", "до встречи", "спасибо за старания", "повери", "вы ощущаетесь" и т.п. Пиши цельно, без "продолжение следует".

Твоя цель — помочь человеку подвести итоги недели, сделать выводы и адаптировать план на следующую неделю, чтобы продолжать путь без перегрузки и с максимальным комфортом.

Данные пользователя за неделю:
${JSON.stringify(userData, null, 2)}`;

    // Вызов OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты — персональный фитнес-тренер Диана. Анализируй данные пользователя за неделю и давай персональные рекомендации в дружелюбном тоне."
        },
        {
          role: "user",
          content: dianaPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    const analysisMessage = completion.choices[0].message.content;
    
    // Отмечаем, что анализ выполнен сегодня
    await userRef.set({
      lastWeeklyAnalysis: today
    }, { merge: true });
    
    // ...лог убран...
    res.json({ message: analysisMessage });
    
  } catch (error) {
    console.error('🤖 Ошибка AI анализа недели:', error);
    res.status(500).json({ 
      error: 'Ошибка анализа недели',
      message: 'Поздравляю с завершением недели! К сожалению, не удалось получить подробный анализ, но ты точно большая молодец! 🎉'
    });
  }
});

// Эндпоинт для AI анализа недели пользователя (POST версия для frontend)
app.post('/api/openai-diana-analyze', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Требуется параметр userId' });
    }
    
    // Проверяем, не анализировали ли мы уже сегодня
    const today = new Date().toISOString().split('T')[0];
    const admin = await import('firebase-admin');
    const db = admin.default.firestore();
    const userRef = db.collection('Dianafit_users').doc(userId);
    
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const lastAnalysisDate = userDoc.data()?.lastWeeklyAnalysis;
      if (lastAnalysisDate === today) {
        return res.status(429).json({ alreadyShown: true });
      }
    }
    
    // Загружаем данные пользователя для анализа
    const userData = await readUserData(userId);
    
    if (!userData || !userData.dailyProgress || Object.keys(userData.dailyProgress).length === 0) {
      return res.json({ 
        analysis: 'Поздравляю с завершением недели! Пока мало данных для подробного анализа, но ты уже на правильном пути! 🎉' 
      });
    }
    
    // Определяем пол пользователя для правильного обращения
    const userGender = userData?.quiz?.sex || 'unknown';
    const genderInstruction = userGender === 'male' 
      ? 'Пользователь — мужчина. Обращайся соответственно: "ты молодец", "ты справился", "у тебя получилось" и т.п.'
      : userGender === 'female'
      ? 'Пользователь — женщина. Обращайся соответственно: "ты молодец", "ты справилась", "у тебя получилось" и т.п.'
      : 'Пол пользователя неизвестен. Используй нейтральные формы обращения без гендерной привязки.';

    // Формируем промпт для анализа (тот же что и в GET версии)
    const dianaPrompt = `Ты — фитнес-тренер Диана из приложения для похудения. Проанализируй прошедшую неделю пользователя: тренировки, питание, шаги, причины пропусков. Делай анализ для себя, но пользователю выдай только выводы и рекомендации — кратко, без перечислений и подробной статистики.

${genderInstruction}

Говори от первого лица — как Диана. Не используй нейтральные и безличные фразы, не пиши от имени команды или приложения. Стиль — спокойный, живой, поддерживающий.

Не пиши подробные отчёты. Не указывай конкретные даты, количество пропущенных приёмов пищи, шагов, тренировок и т.п. Просто делай вежливые, логичные выводы, например: «заметила, что не все тренировки удалось выполнить», «возможно, неделя была сложной», «можно немного снизить нагрузку». То же самое — по питанию и шагам. Только выводы и рекомендации, никаких чисел.

Обязательно:
- Напомни, что тренировки — это видеоуроки, которые можно выбирать самостоятельно (3–5 раз в неделю);
- Питание — по рассчитанному калоражу, отмечается вручную;
- Цель по шагам — 10 000 шагов в день (примерно 1,5 часа ходьбы);
- Дай рекомендации по активности: прогулки, лестницы, больше движения в течение дня;
- Если были сложности — предложи снизить количество тренировок;
- В конце обязательно напомни, что сегодня последний день перед новой неделей, когда можно изменить настройки: количество тренировок и диету.

Не допускай орфографических и смысловых ошибок. Не используй "с уважением", "до встречи", "спасибо за старания", "повери", "вы ощущаетесь" и т.п. Пиши цельно, без "продолжение следует".

Твоя цель — помочь человеку подвести итоги недели, сделать выводы и адаптировать план на следующую неделю, чтобы продолжать путь без перегрузки и с максимальным комфортом.

Данные пользователя за неделю:
${JSON.stringify(userData, null, 2)}`;

    // Вызов OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты — персональный фитнес-тренер Диана. Анализируй данные пользователя за неделю и давай персональные рекомендации в дружелюбном тоне."
        },
        {
          role: "user",
          content: dianaPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    const analysisMessage = completion.choices[0].message.content;
    
    // Отмечаем, что анализ выполнен сегодня
    await userRef.set({
      lastWeeklyAnalysis: today
    }, { merge: true });
    
    res.json({ analysis: analysisMessage });
    
  } catch (error) {
    console.error('🤖 Ошибка AI анализа недели (POST):', error);
    res.status(500).json({ 
      error: 'Ошибка анализа недели',
      analysis: 'Поздравляю с завершением недели! К сожалению, не удалось получить подробный анализ, но ты точно большая молодец! 🎉'
    });
  }
});

// Проверка статуса уведомления (нужно ли показать)
app.get('/api/diana-notification-status', async (req, res) => {
  try {
    const { userId, date, dayOfWeek } = req.query;
    
    if (!userId || !date || !dayOfWeek) {
      return res.status(400).json({ error: 'Требуются параметры userId, date, dayOfWeek' });
    }
    
    // ...лог убран...
    
    // Импортируем Firebase Admin
    const admin = await import('firebase-admin');
    const db = admin.default.firestore();
    
    const userRef = db.collection('Dianafit_users').doc(userId);
    const userDoc = await userRef.get();
    // ...лог убран...
    if (!userDoc.exists) {
      // ...лог убран...
    } else {
      // ...лог убран...
    }
    
    if (!userDoc.exists) {
      // ...лог убран...
      return res.json({ shouldShow: true });
    }
    
    const userData = userDoc.data();
    const notificationField = `Daynotification${dayOfWeek}`;
    const lastShownDate = userData[notificationField];
    
    // Если уведомление уже показывалось сегодня, не показывать снова
    if (lastShownDate === date) {
      // ...лог убран...
      return res.json({ shouldShow: false });
    }
    
    // ...лог убран...
    // ...лог убран...
    res.json({ shouldShow: true });
    
  } catch (error) {
    console.error('🔔 Ошибка проверки статуса уведомления:', error);
    res.status(500).json({ error: 'Ошибка проверки статуса уведомления' });
  }
});

// Отметка, что уведомление показано
// КРИТИЧЕСКАЯ ОПТИМИЗАЦИЯ: diana-notification-mark-shown - убираем блокирующие операции
app.post('/api/diana-notification-mark-shown', async (req, res) => {
  try {
    const { userId, date, dayOfWeek } = req.body;
    
    if (!userId || !date || !dayOfWeek) {
      return res.status(400).json({ error: 'Требуются параметры userId, date, dayOfWeek' });
    }
    
    // ОПТИМИЗИРОВАНО: Используем уже инициализированный admin вместо динамического импорта
    const db = admin.firestore();
    const userRef = db.collection('Dianafit_users').doc(userId);
    
    // ОПТИМИЗИРОВАНО: Убираем лишний get запрос, сразу делаем set с merge
    const notificationField = `Daynotification${dayOfWeek}`;
    
    await userRef.set({
      [notificationField]: date
    }, { merge: true });
    
    res.json({ success: true, field: notificationField, date });
  } catch (error) {
    console.error('❌ [diana-notification] Ошибка отметки показа:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('🎯 Все эндпоинты настроены, запуск сервера...');

// Запуск сервера (перенесён в конец файла)
app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Server running on port ' + PORT);
});

// Эндпоинт для получения всех userId (для тестирования)
app.get('/api/all-user-ids', async (req, res) => {
  try {
    const { getUsersCollection } = await import('./firestore-config.js');
    const admin = await import('firebase-admin');
    const db = admin.default.firestore();
    const usersCollection = getUsersCollection();

    const snapshot = await db.collection(usersCollection).get();
    const userIds = [];
    snapshot.forEach(doc => {
      userIds.push(doc.id);
    });
    res.json({ userIds, count: userIds.length });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения userId', details: error.message });
  }
});

console.log('=== BACKEND INDEX.JS ЗАПУЩЕН ===');
