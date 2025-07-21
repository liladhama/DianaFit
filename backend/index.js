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
// Импортируем роутер рецептов
import recipeRouter from './routes/recipeRoutes.js';
import progressRouter from './routes/progressRoutes.js';
import mealPlanCalculator from './utils/mealPlanCalculator.js';
// Импортируем функции для работы с данными пользователя из Firestore
import { readUserData, writeUserData } from './userDataStorage.js';
// Импортируем систему управления подпиской
import './dailyTelegramNotifier.js';
import caloriesApi from './caloriesApi.js';
import notificationSettingsApi from './notificationSettingsApi.js';

dotenv.config();

console.log('🚀 Старт приложения...');

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('📦 Express создан, PORT:', PORT);
console.log('🔍 subscriptionManager:', subscriptionManager);
console.log('🔍 subscriptionManager.default:', subscriptionManager.default);

// Разрешить CORS для всех источников (для локальной отладки и Telegram)
app.use(cors({
  origin: [
    'https://diana-fit.vercel.app',
    'https://dianafit.fly.dev',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    '*'
  ],
  credentials: true
}));

app.use(express.json());
app.use('/api', programApi);
app.use('/api/recipes', recipeRouter);
app.use('/api/progress', progressRouter);
app.use('/api/subscription', subscriptionRouter);
app.use(caloriesApi);
app.use(notificationSettingsApi);

console.log('🔗 Подключаем роутер подписки...');
app.use('/api/subscription', subscriptionRouter);
console.log('✅ Роутер подписки подключён');
console.log('🔗 Подключаем остальные роутеры...');
app.use('/api', programApi);
app.use('/api/recipes', recipeRouter);
app.use('/api/progress', progressRouter);
console.log('✅ Остальные роутеры подключены');

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
    console.log('[CALCULATE-PLAN] Сохранены данные квиза для пользователя:', userId);

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
    console.error('Ошибка сохранения квиза или генерации плана:', e);
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
    console.error('MISTRAL_API_KEY не установлен в переменных окружения');
    return await getFallbackResponse();
  }
  
  try {
    console.log('Вызов Mistral API...');
    
    // Логируем информацию о запросе для отладки
    console.log(`Используемый API ключ: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log('Длина ключа:', apiKey.length, 'символов');
    console.log('Количество сообщений в запросе:', messages.length);
    console.log('Размер первого сообщения (bytes):', Buffer.from(messages[0].content).length);
    
    // Проверяем, не слишком ли большой размер запроса
    const totalMessageSize = messages.reduce((acc, msg) => acc + Buffer.from(msg.content).length, 0);
    console.log('Общий размер сообщений (bytes):', totalMessageSize);
    
    if (totalMessageSize > 100000) {
      console.warn('Предупреждение: размер запроса превышает 100KB, это может вызвать проблемы с API');
    }
    
    // Сначала пробуем использовать модель mistral-medium
    console.log('Используем модель mistral-medium...');
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
      console.error(`Ошибка с mistral-medium: ${response.status} ${response.statusText}`);
      console.error(`Детали ошибки: ${errorText}`);
      
      console.log('Пробуем модель mistral-tiny...');
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
      console.error(`Mistral API error: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      
      if (response.status === 401) {
        console.error('\n========== ОШИБКА АВТОРИЗАЦИИ ==========');
        console.error('Ваш API ключ не был принят сервером Mistral AI.');
        console.error('Возможные причины:');
        console.error('1. Ключ API введен с ошибкой или содержит лишние символы (пробелы, переносы строк)');
        console.error('2. Ключ API устарел или был отозван');
        console.error('3. У вашего аккаунта нет доступа к выбранной модели');
        console.error('4. Проблемы на стороне сервера Mistral AI');
        console.error('\nРекомендации:');
        console.error('- Создайте новый ключ API на https://console.mistral.ai/');
        console.error('- Убедитесь, что копируете ключ без лишних символов');
        console.error('- Проверьте баланс и статус вашего аккаунта');
        console.error('========================================\n');
      }
      
      throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Ошибка при вызове Mistral API:', error);
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

  // Формируем контекст для ИИ из последних 5 сообщений
  const lastMessages = userData.dialogHistory.slice(-5);
  let chatContext = lastMessages.map(m => `${m.role}: ${m.text}`).join('\n');

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
        response: 'Привет! Я Диана, твой тренер. Как настроение? Чем могу помочь сегодня?'
      });
    } else {
      await writeUserData(userId, userData);
      return res.json({
        response: 'Рада снова тебя видеть! Чем могу помочь?'
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
    console.log(`\n===== ЗАПРОС ЧАТА С ДИАНОЙ =====`);
    console.log(`Сообщение: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    console.log(`Контекст: ${chatContext.substring(0, 50)}${chatContext.length > 50 ? '...' : ''}`);
    console.log(`Время запроса: ${new Date().toISOString()}`);
    
    // Находим релевантные знания из векторной базы
    const userEmbedding = Array(1536).fill(0); // TODO: получить реальный embedding от сообщения
    let relevantChunks = [];
    
    try {
      // relevantChunks = findRelevantChunks(userEmbedding, 3); // Временно отключено
      console.log(`Найдено ${relevantChunks.length} релевантных фрагментов знаний`);
    } catch (error) {
      console.error('❌ Ошибка при поиске релевантных знаний:', error);
      console.log('⚠️ Продолжаем без релевантных знаний');
    }
    
    // Загружаем базу знаний для чата
    let dianaKnowledge = '';
    try {
      // dianaKnowledge = loadDianaKnowledge(); // Временно отключено
      console.log(`Загружена база знаний Дианы: ${dianaKnowledge.length} символов`);
    } catch (error) {
      console.error('❌ Ошибка при загрузке базы знаний Дианы:', error);
      console.log('⚠️ Продолжаем без базы знаний');
    }
    
    const systemPrompt =
      'Ты — персональный ИИ-тренер Диана, эксперт по похудению и здоровому образу жизни.\n' +
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
    await subscriptionManager.default.incrementDailyRequests(userId);
    
    // Сохраняем сообщение пользователя и ответ Дианы в историю
    userData.dialogHistory.push({ role: 'user', text: message, timestamp: new Date().toISOString() });
    userData.dialogHistory.push({ role: 'assistant', text: aiResponse, timestamp: new Date().toISOString() });
    await writeUserData(userId, userData);
    
    // Получаем обновленную информацию о лимитах
    const updatedLimitInfo = await subscriptionManager.default.checkDailyLimit(userId);
    
    res.json({ 
      response: aiResponse,
      limitInfo: updatedLimitInfo,
      limitMessage: subscriptionManager.default.formatLimitMessage(updatedLimitInfo)
    });
  } catch (e) {
    console.error('❌ Ошибка в чате с Дианой:', e);
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
      console.log('⚠️ План питания не имеет нужной структуры для проверки разнообразия');
      return mealPlan;
    }
    
    // Парсим JSON-план
    let plan;
    try {
      plan = JSON.parse(mealPlan);
    } catch (e) {
      console.error('❌ Ошибка парсинга JSON плана питания:', e);
      return mealPlan;
    }

    // Если структура отличается от ожидаемой, возвращаем оригинал
    if (!plan.weeks || !Array.isArray(plan.weeks)) {
      console.log('⚠️ План питания не содержит массив недель');
      return mealPlan;
    }

    console.log('🔍 Проверка разнообразия плана питания...');
    
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
            console.log('Найдено повторение блюда "' + meal.meal.name + '" в день ' + day.day + ' недели ' + week.week);
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
                    console.log('Найдено повторение источника белка "' + ingredient.name + '" в день ' + day.day + ' недели ' + week.week);
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
      console.log('⚠️ Обнаружены повторения в плане питания. Запрашиваем повторную генерацию с акцентом на разнообразие...');
      return null; // Сигнал для повторной генерации
    } else {
      console.log('✅ План питания имеет хорошее разнообразие блюд');
      return mealPlan;
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке разнообразия рациона:', error);
    return mealPlan; // В случае ошибки возвращаем оригинальный план
  }
}

// Массив для хранения последних логов
const recentLogs = [];
const MAX_LOGS = 100;

// Перехватываем стандартный вывод и ошибки для сохранения в массив
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function() {
  const message = Array.from(arguments).map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  
  recentLogs.push({
    timestamp: new Date().toISOString(),
    type: 'log',
    message
  });
  
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }
  
  originalConsoleLog.apply(console, arguments);
};

console.error = function() {
  const message = Array.from(arguments).map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  
  recentLogs.push({
    timestamp: new Date().toISOString(),
    type: 'error',
    message
  });
  
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }
  
  originalConsoleError.apply(console, arguments);
};

console.warn = function() {
  const message = Array.from(arguments).map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  
  recentLogs.push({
    timestamp: new Date().toISOString(),
    type: 'warn',
    message
  });
  
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }
  
  originalConsoleWarn.apply(console, arguments);
};

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
    console.log('📊 Получение аналитики по неделе...');
    
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
    console.error('❌ Ошибка получения аналитики по неделе:', error);
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
    console.log('🔄 Перегенерация плана питания с акцентом на разнообразие...');
    
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
    console.error('❌ Ошибка перегенерации плана:', error);
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
        console.error('Error getting user progress:', error, userHistory);
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
        console.error('Error getting user progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для получения прогресса пользователя по userId
app.get('/api/user/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('[DIAGNOSTIC] /api/user/progress/:userId userId:', userId);
        const logger = new UserProgressLogger(userId);
        const progressData = logger.loadLog();
        console.log('[DIAGNOSTIC] progressData:', progressData);
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
        console.error('Error updating quiz answers:', error);
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
        console.error('Error logging meal execution:', error);
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
        console.error('Error generating weekly plan:', error);
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
  
  console.log('[DEBUG] calculateWorkoutProgress - начинаем расчет');
  console.log('[DEBUG] dailyProgress:', Object.keys(dailyProgress));
  
  // Проходим по всем дням за неделю
  Object.entries(dailyProgress).forEach(([date, dayData]) => {
    const dayDate = new Date(date);
    console.log('[DEBUG] Проверяем день:', date, 'parsed:', dayDate.toISOString(), 'в диапазоне:', dayDate >= weekAgo && dayDate <= now);
    
    if (dayDate >= weekAgo && dayDate <= now) {
      const tasks = dayData.tasks || [];
      // Считаем все задания кроме приемов пищи (упражнения, шаги и т.д.)
      const activityTasks = tasks.filter(task => 
        task.type !== 'meal'
      );
      
      console.log('[DEBUG] Активности дня:', date, 'activities:', activityTasks.length, 'tasks:', activityTasks.map(t => ({ name: t.name, type: t.type, done: t.done })));
      
      totalActivities += activityTasks.length;
      completedActivities += activityTasks.filter(task => task.done).length;
    }
  });
  
  console.log('[DEBUG] totalActivities:', totalActivities, 'completedActivities:', completedActivities);
  
  const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  console.log('[DEBUG] Итоговый прогресс тренировок:', progress, '%');
  
  return progress;
}

function calculateNutritionProgress(userHistory) {
  // Считаем процент выполненных приёмов пищи за последние 7 дней из dailyProgress
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dailyProgress = userHistory.dailyProgress || {};
  
  let totalMeals = 0;
  let completedMeals = 0;
  
  console.log('[DEBUG] calculateNutritionProgress - начинаем расчет');
  console.log('[DEBUG] dailyProgress:', Object.keys(dailyProgress));
  console.log('[DEBUG] now:', now.toISOString());
  console.log('[DEBUG] weekAgo:', weekAgo.toISOString());
  
  // Проходим по всем дням за неделю
  Object.entries(dailyProgress).forEach(([date, dayData]) => {
    const dayDate = new Date(date);
    console.log('[DEBUG] Проверяем день:', date, 'parsed:', dayDate.toISOString(), 'в диапазоне:', dayDate >= weekAgo && dayDate <= now);
    
    if (dayDate >= weekAgo && dayDate <= now) {
      const tasks = dayData.tasks || [];
      // Считаем только приемы пищи
      const mealTasks = tasks.filter(task => task.type === 'meal');
      
      console.log('[DEBUG] Задания дня:', date, 'meals:', mealTasks.length, 'tasks:', tasks.map(t => ({ name: t.name, type: t.type, done: t.done })));
      
      totalMeals += mealTasks.length;
      completedMeals += mealTasks.filter(task => task.done).length;
    }
  });
  
  console.log('[DEBUG] totalMeals:', totalMeals, 'completedMeals:', completedMeals);
  
  // Всегда считаем от недельной нормы 35 приемов пищи (5 приемов × 7 дней)
  const expectedMealsPerWeek = 35;
  
  const progress = Math.round((completedMeals / expectedMealsPerWeek) * 100);
  console.log('[DEBUG] Итоговый прогресс питания:', progress, '% (', completedMeals, 'из', expectedMealsPerWeek, ')');
  
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
        console.error('Error getting day status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для получения КБЖУ пользователя
app.get('/api/user/nutrition/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userFile = path.join(__dirname, 'backup_files', 'users', 'quiz_' + userId + '.json');
        console.log('[DIAGNOSTIC] /api/user/nutrition/:userId userId:', userId);
        console.log('[DIAGNOSTIC] userFile:', userFile);
        if (!fs.existsSync(userFile)) {
            console.log('[DIAGNOSTIC] userFile not found:', userFile);
            return res.status(404).json({ error: 'User data not found' });
        }
        const userData = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
        // Расчет BMR и КБЖУ как в programApi.js
        const age = userData.age || 25;
        const weight = userData.weight_kg || 65;
        const height = userData.height_cm || 165;
        const sex = userData.sex || 'female';
        const activity = userData.activity_coef || 1.375;
        const goal = userData.goal || 4;
        
        let bmr;
        if (sex === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
        
        // Итоговые калории с учётом цели
        let dailyCalories;
        let deficit = 0;
        if ([3,4,5].includes(goal)) {
            deficit = goal * 7700 / 30;
            dailyCalories = Math.round(bmr * activity - deficit);
        } else {
            dailyCalories = Math.round(bmr * activity);
        }
        
        // Минимум 1400 ккал для всех (по базе Дианы)
        dailyCalories = Math.max(1400, dailyCalories);
        
        // Расчёт БЖУ
        const protein = Math.round(weight * 1.8);
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
        console.error('Error getting user nutrition:', error);
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
    console.error('Ошибка получения информации о подписке:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/quiz-answers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = await readUserData(userId);
        if (!userData.quiz) {
            return res.status(404).json({ error: 'Quiz data not found' });
        }
        res.json(userData.quiz);
    } catch (error) {
        console.error('Error getting user quiz answers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Эндпоинт для сохранения ответов квиза пользователя
app.post('/api/user/quiz-answers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const quizData = req.body;
        let userData = await readUserData(userId);
        userData.quiz = quizData;
        await writeUserData(userId, userData);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving user quiz answers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint для активации премиума
app.post('/api/activate-premium', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    console.log(`🎯 Активация премиума для пользователя: ${userId}`);
    
    // Загружаем данные пользователя
    let userData = await readUserData(userId);
    
    // Активируем премиум
    userData.isPremium = true;
    userData.premiumActivatedAt = new Date().toISOString();
    
    // Сохраняем обновленные данные
    await writeUserData(userId, userData);
    
    console.log(`✅ Премиум активирован для пользователя: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Premium activated successfully',
      isPremium: true
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
    
    console.log(`[TEST-PREMIUM] Активирована тестовая премиум подписка для пользователя ${userId}`);
    
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

// Эндпоинт для админской панели - статистика по квизу
app.get('/api/admin/stats', async (req, res) => {
  try {
    console.log('[ADMIN] Запрос статистики админ панели');
    
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
    
    console.log(`[ADMIN] Найдено пользователей: ${allUsers.length}`);
    
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
          console.log(`[ADMIN] Пользователь ${user.id} премиум до ${expiresAt.toISOString()}`);
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
    
    console.log('[ADMIN] Анализируем прогресс пользователей...');
    
    for (const user of allUsers) {
      let hasAnyProgress = false;
      
      // Анализируем данные из dailyProgress
      if (user.dailyProgress && Object.keys(user.dailyProgress).length > 0) {
        hasAnyProgress = true;
        console.log(`[ADMIN] Пользователь ${user.id} имеет dailyProgress:`, Object.keys(user.dailyProgress).length, 'дней');
        
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
          console.log(`[ADMIN] Пользователь ${user.id} упражнения: ${userExerciseCompleted}/${userExerciseTotal} = ${userExercisePercent.toFixed(1)}%`);
        }
        
        if (userNutritionTotal > 0) {
          usersWithNutritionData++;
          const userNutritionPercent = (userNutritionCompleted / userNutritionTotal) * 100;
          nutritionCompletionSum += userNutritionPercent;
          console.log(`[ADMIN] Пользователь ${user.id} питание: ${userNutritionCompleted}/${userNutritionTotal} = ${userNutritionPercent.toFixed(1)}%`);
        }
        
        if (userStepsTotal > 0) {
          usersWithStepsData++;
          const userStepsPercent = (userStepsCompleted / userStepsTotal) * 100;
          stepsCompletionSum += userStepsPercent;
          console.log(`[ADMIN] Пользователь ${user.id} шаги: ${userStepsCompleted}/${userStepsTotal} = ${userStepsPercent.toFixed(1)}%`);
        }
      }
      
      // Анализируем данные из programData
      if (user.programData && user.programData.days && Array.isArray(user.programData.days)) {
        hasAnyProgress = true;
        console.log(`[ADMIN] Пользователь ${user.id} имеет programData:`, user.programData.days.length, 'дней');
        
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
          
          // Шаги
          if (day.dailyStepsGoal && typeof day.dailySteps === 'number') {
            userStepsTotal++;
            if (day.dailySteps >= day.dailyStepsGoal) userStepsCompleted++;
          }
        });
        
        if (userExerciseTotal > 0 && usersWithExerciseData === 0) {
          usersWithExerciseData++;
          const userExercisePercent = (userExerciseCompleted / userExerciseTotal) * 100;
          exerciseCompletionSum += userExercisePercent;
          console.log(`[ADMIN] Пользователь ${user.id} упражнения (programData): ${userExerciseCompleted}/${userExerciseTotal} = ${userExercisePercent.toFixed(1)}%`);
        }
        
        if (userNutritionTotal > 0 && usersWithNutritionData === 0) {
          usersWithNutritionData++;
          const userNutritionPercent = (userNutritionCompleted / userNutritionTotal) * 100;
          nutritionCompletionSum += userNutritionPercent;
          console.log(`[ADMIN] Пользователь ${user.id} питание (programData): ${userNutritionCompleted}/${userNutritionTotal} = ${userNutritionPercent.toFixed(1)}%`);
        }
        
        if (userStepsTotal > 0 && usersWithStepsData === 0) {
          usersWithStepsData++;
          const userStepsPercent = (userStepsCompleted / userStepsTotal) * 100;
          stepsCompletionSum += userStepsPercent;
          console.log(`[ADMIN] Пользователь ${user.id} шаги (programData): ${userStepsCompleted}/${userStepsTotal} = ${userStepsPercent.toFixed(1)}%`);
        }
      }
      
      if (hasAnyProgress) {
        usersWithProgress++;
      }
    }
    
    // Вычисляем средние проценты выполнения
    const avgExerciseCompletion = usersWithExerciseData > 0 ? Math.round(exerciseCompletionSum / usersWithExerciseData) : 0;
    const avgNutritionCompletion = usersWithNutritionData > 0 ? Math.round(nutritionCompletionSum / usersWithNutritionData) : 0;
    const avgStepsCompletion = usersWithStepsData > 0 ? Math.round(stepsCompletionSum / usersWithStepsData) : 0;
    
    console.log(`[ADMIN] Итоговые средние проценты: упражнения ${avgExerciseCompletion}%, питание ${avgNutritionCompletion}%, шаги ${avgStepsCompletion}%`);
    console.log(`[ADMIN] Пользователей с данными: всего с прогрессом ${usersWithProgress}, упражнения ${usersWithExerciseData}, питание ${usersWithNutritionData}, шаги ${usersWithStepsData}`);
    
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
    
    console.log('[ADMIN] Статистика по квизу рассчитана:', stats);
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

// Проверка статуса уведомления (нужно ли показать)
app.get('/api/diana-notification-status', async (req, res) => {
  try {
    const { userId, date, dayOfWeek } = req.query;
    
    if (!userId || !date || !dayOfWeek) {
      return res.status(400).json({ error: 'Требуются параметры userId, date, dayOfWeek' });
    }
    
    console.log(`🔔 Проверка статуса уведомления для пользователя ${userId}, день ${dayOfWeek}, дата ${date}`);
    
    // Импортируем Firebase Admin
    const admin = await import('firebase-admin');
    const db = admin.default.firestore();
    
    const userRef = db.collection('Dianafit_users').doc(userId);
    const userDoc = await userRef.get();
    console.log(`[DEBUG][NOTIF] Проверяем документ: Dianafit_users/${userId}`);
    if (!userDoc.exists) {
      console.log(`[DEBUG][NOTIF] Документ не найден: Dianafit_users/${userId}`);
    } else {
      console.log(`[DEBUG][NOTIF] Документ найден:`, userDoc.data());
    }
    
    if (!userDoc.exists) {
      console.log(`🔔 Пользователь ${userId} не найден, показываем уведомление`);
      return res.json({ shouldShow: true });
    }
    
    const userData = userDoc.data();
    const notificationField = `Daynotification${dayOfWeek}`;
    const lastShownDate = userData[notificationField];
    
    // Если уведомление уже показывалось сегодня, не показывать снова
    if (lastShownDate === date) {
      console.log(`🔔 Уведомление ${notificationField} уже показано ${date}, пропускаем`);
      return res.json({ shouldShow: false });
    }
    
    console.log(`🔔 Уведомление ${notificationField} можно показать (последний показ: ${lastShownDate})`);
    res.json({ shouldShow: true });
    
  } catch (error) {
    console.error('🔔 Ошибка проверки статуса уведомления:', error);
    res.status(500).json({ error: 'Ошибка проверки статуса уведомления' });
  }
});

// Отметка, что уведомление показано
app.post('/api/diana-notification-mark-shown', async (req, res) => {
  try {
    const { userId, date, dayOfWeek } = req.body;
    
    if (!userId || !date || !dayOfWeek) {
      return res.status(400).json({ error: 'Требуются параметры userId, date, dayOfWeek' });
    }
    
    console.log(`🔔 Отмечаем уведомление как показанное для пользователя ${userId}, день ${dayOfWeek}, дата ${date}`);
    
    // Импортируем Firebase Admin
    const admin = await import('firebase-admin');
    const db = admin.default.firestore();
    
    const userRef = db.collection('Dianafit_users').doc(userId);
    console.log(`[DEBUG][NOTIF] Обновляем документ: Dianafit_users/${userId}`);
    
    // Лог до обновления
    const beforeDoc = await userRef.get();
    if (beforeDoc.exists) {
      console.log(`[DEBUG][NOTIF] До обновления:`, beforeDoc.data());
    } else {
      console.log(`[DEBUG][NOTIF] До обновления: Документ не найден`);
    }
    
    const notificationField = `Daynotification${dayOfWeek}`;
    
    // Обновляем поле с датой последнего показа (создаем документ если его нет)
    await userRef.set({
      [notificationField]: date
    }, { merge: true });
    
    // Лог после обновления
    const afterDoc = await userRef.get();
    if (afterDoc.exists) {
      console.log(`[DEBUG][NOTIF] После обновления:`, afterDoc.data());
    } else {
      console.log(`[DEBUG][NOTIF] После обновления: Документ не найден`);
    }
    
    console.log(`🔔 Обновлено поле ${notificationField} = ${date} для пользователя ${userId}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('🔔 Ошибка отметки показа уведомления:', error);
    res.status(500).json({ error: 'Ошибка отметки показа уведомления' });
  }
});

console.log('🎯 Все эндпоинты настроены, запуск сервера...');

// Запуск сервера (перенесён в конец файла)
app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Server running on port ' + PORT);
});

console.log('=== BACKEND INDEX.JS ЗАПУЩЕН ===');
