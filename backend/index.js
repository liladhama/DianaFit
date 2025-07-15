import express from 'express';
import fs from 'fs';
import path from 'path';
import { loadKnowledgeBase, findRelevantChunks } from './knowledgeBase.js';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    try {
      await logger.saveLog(updatedData);
      saveResult = { success: true };
      console.log('[CALCULATE-PLAN] Сохранены данные квиза для пользователя:', userId);
    } catch (saveErr) {
      saveResult = { success: false, error: saveErr.message };
      console.error('Ошибка сохранения квиза:', saveErr);
    }
  } catch (e) {
    console.error('Ошибка сохранения квиза:', e);
    saveResult = { success: false, error: e.message };
  }
  try {
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
  const { message, context, userSettings, userHistory, conversation, userId } = req.body;
  
  if (!message) return res.status(400).json({ error: 'No message provided' });
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    console.log(`\n===== ЗАПРОС ЧАТА С ДИАНОЙ =====`);
    console.log(`Пользователь: ${userId}`);
    console.log(`Тип userId: ${typeof userId}`);
    console.log(`userId === 'demo_user_local_test': ${userId === 'demo_user_local_test'}`);
    console.log(`Сообщение: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    console.log(`Время запроса: ${new Date().toISOString()}`);
    
    // Получаем историю пользователя из Firestore
    let userData = await readUserData(userId);
    console.log(`🔍 Данные пользователя для ${userId}:`, {
      hasQuiz: !!userData.quiz,
      quizName: userData.quiz?.name,
      quizGoal: userData.quiz?.goal,
      quizCalories: userData.quiz?.calories || 'не указано',
      hasChatHistory: !!userData.chatHistory,
      chatHistoryLength: userData.chatHistory?.length || 0,
      source: userId === 'demo_user_local_test' ? 'ЛОКАЛЬНЫЙ ФАЙЛ' : 'FIRESTORE'
    });
    
    if (!userData.chatHistory) {
      userData.chatHistory = [];
    }
    
    // Берём последние 10 сообщений для контекста
    const recentChatHistory = userData.chatHistory.slice(-10);
    console.log(`Загружена история чата: ${recentChatHistory.length} сообщений`);
    
    // Формируем контекст из истории чата
    const chatContext = recentChatHistory.length > 0 
      ? recentChatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : 'Начало разговора';
    
    // Находим релевантные знания из векторной базы
    const userEmbedding = Array(1536).fill(0); // TODO: получить реальный embedding от сообщения
    let relevantChunks = [];
    
    try {
      relevantChunks = findRelevantChunks(userEmbedding, 3);
      console.log(`Найдено ${relevantChunks.length} релевантных фрагментов знаний`);
    } catch (error) {
      console.error('❌ Ошибка при поиске релевантных знаний:', error);
      console.log('⚠️ Продолжаем без релевантных знаний');
    }
    
    // Загружаем базу знаний для чата
    let dianaKnowledge = '';
    try {
      dianaKnowledge = loadDianaKnowledge();
      console.log(`Загружена база знаний Дианы: ${dianaKnowledge.length} символов`);
    } catch (error) {
      console.error('❌ Ошибка при загрузке базы знаний Дианы:', error);
      console.log('⚠️ Продолжаем без базы знаний');
    }
    
    const systemPrompt = `Ты — Диана, персональный фитнес-тренер. Ты РУССКАЯ девушка, говоришь на чистом русском языке.

СТРОЖАЙШИЕ ПРАВИЛА:
1. Говори ТОЛЬКО на правильном русском языке, без ошибок
2. НИКОГДА не пиши [имя], [цель] или шаблоны в квадратных скобках
3. На приветствие отвечай максимум 2 предложения
4. НЕ предлагай планы питания на приветствие
5. Используй ТОЛЬКО данные о калориях из анализа пользователя

ПРАВИЛЬНЫЙ РУССКИЙ ЯЗЫК:
- "Как дела?" (а не "Как делаешь?")
- "Хочешь набрать мышечную массу?" (а не "Набрать мышечную массу?")
- "Твой вес 106 кг" (а не "Теперь повесите вес")
- Говори грамотно, как образованная русская девушка

СТИЛЬ:
- Коротко и по делу
- Фразы: "смотри", "в принципе", "грубо говоря"
- Дружелюбно, естественно
- Спрашивай о делах, самочувствии, тренировках

КАЛОРИИ:
- Используй ТОЛЬКО цифры из анализа пользователя
- НЕ выдумывай свои цифры калорий

КОГДА ПОЛЬЗОВАТЕЛЬ СПРАШИВАЕТ О ПИТАНИИ:
- Сначала узнай его цели, вес, рост, активность
- Потом предлагай варианты питания с разнообразными блюдами
- Объясняй ПОЧЕМУ это работает
- Используй знания из базы данных Дианы и свои знания о рецептах

БАЗА ЗНАНИЙ ДИАНЫ:
${dianaKnowledge.substring(0, 1500)}...

Отвечай естественно, как живой человек. Если не знаешь точного ответа - честно скажи об этом. Помогай с мотивацией и поддержкой.`;
    
    // Анализируем данные пользователя для персонального ответа
    const userAnalysis = analyzeUserData(userData);
    console.log(`👤 Анализ пользователя:`, userAnalysis);
    
    const userPrompt = `Вопрос пользователя: ${message}

ВАЖНАЯ ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:
${userAnalysis}

Контекст разговора: ${chatContext}

Релевантные знания из базы:
${relevantChunks.map(c => c.text).join('\n---\n')}

ИНСТРУКЦИЯ:
- Говори на чистом русском языке, как образованная русская девушка
- Используй ТОЛЬКО реальные данные пользователя из анализа
- НА ПРИВЕТСТВИЕ: "Привет, [имя]! Как дела с [тренировками/целью]?"
- ЗАПРЕЩЕНЫ квадратные скобки в финальном ответе
- Максимум 2 предложения на приветствие

ПРИМЕРЫ ПРАВИЛЬНОЙ РЕЧИ:
- "Привет, мчмчсмчсм! Как дела с тренировками?"
- "Как успехи с набором мышечной массы?"
- "Твоя норма 1890 ккал в день"
- "Смотри, у тебя цель набрать массу"`;

    const aiResponse = await callMistralAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    
    // Сохраняем сообщение пользователя и ответ Дианы в историю
    const timestamp = new Date().toISOString();
    userData.chatHistory.push({
      role: 'user',
      content: message,
      timestamp: timestamp
    });
    userData.chatHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: timestamp
    });
    
    // Ограничиваем историю чата 50 сообщениями (25 пар)
    if (userData.chatHistory.length > 50) {
      userData.chatHistory = userData.chatHistory.slice(-50);
    }
    
    // Сохраняем обновленную историю в Firestore
    console.log(`💾 Сохраняем историю чата для пользователя ${userId}...`);
    console.log(`💾 Размер chatHistory перед сохранением: ${userData.chatHistory.length} сообщений`);
    console.log(`💾 Последние 2 сообщения:`, userData.chatHistory.slice(-2));
    
    await writeUserData(userId, userData);
    console.log(`✅ История чата сохранена для пользователя ${userId}`);
    
    res.json({ response: aiResponse });
  } catch (e) {
    console.error('Chat error:', e);
    
    // Определяем тип ошибки для более точного ответа пользователю
    let errorType = 'unknown';
    if (e.message && e.message.includes('401')) {
      errorType = 'auth';
    } else if (e.message && (e.message.includes('timeout') || e.message.includes('ETIMEDOUT'))) {
      errorType = 'timeout';
    } else if (e.message && e.message.includes('429')) {
      errorType = 'rate_limit';
    }
    
    // Получаем резервный ответ в случае проблем с API
    try {
      const fallbackResponse = await getFallbackResponse(message, errorType);
      console.log('Используем резервный ответ из-за ошибки API');
      
      // Сохраняем сообщение пользователя и резервный ответ в историю
      const timestamp = new Date().toISOString();
      userData.chatHistory.push({
        role: 'user',
        content: message,
        timestamp: timestamp
      });
      userData.chatHistory.push({
        role: 'assistant',
        content: fallbackResponse,
        timestamp: timestamp
      });
      
      // Ограничиваем историю чата 50 сообщениями (25 пар)
      if (userData.chatHistory.length > 50) {
        userData.chatHistory = userData.chatHistory.slice(-50);
      }
      
      // Сохраняем обновленную историю в Firestore
      console.log(`💾 Сохраняем историю чата (fallback) для пользователя ${userId}...`);
      console.log(`💾 Размер chatHistory перед сохранением: ${userData.chatHistory.length} сообщений`);
      console.log(`💾 Последние 2 сообщения:`, userData.chatHistory.slice(-2));
      
      await writeUserData(userId, userData);
      console.log(`✅ История чата (fallback) сохранена для пользователя ${userId}`);
      
      res.json({ response: fallbackResponse });
    } catch (fallbackError) {
      console.error('Ошибка при получении резервного ответа:', fallbackError);
      res.json({ 
        response: "Извини, у меня сейчас технические проблемы. Я работаю над их устранением и скоро вернусь!" 
      });
    }
  }
});

loadKnowledgeBase();

// Функция для загрузки базы знаний Дианы
function loadDianaKnowledge() {
  try {
    // Загружаем транскрипты разговоров и лекций Дианы
    const knowledgeBasePath = path.join(__dirname, 'knowledge_base_chunks.jsonl');
    const trainingDataPath = path.join(__dirname, 'diana-trainings.jsonl');
    
    let knowledgeText = '';
    
    console.log('Загрузка базы знаний Дианы...');
    console.log(`Проверка существования файла: ${knowledgeBasePath}`);
    
    // Загружаем основную базу знаний (разговоры, лекции)
    if (fs.existsSync(knowledgeBasePath)) {
      console.log(`✅ Файл найден: ${knowledgeBasePath}`);
      const knowledgeContent = fs.readFileSync(knowledgeBasePath, 'utf8');
      const knowledgeLines = knowledgeContent.split('\n').filter(line => line.trim());
      console.log(`📚 Найдено ${knowledgeLines.length} строк в файле базы знаний`);
      
      let validChunks = 0;
      knowledgeLines.forEach(line => {
        try {
          const chunk = JSON.parse(line);
          if (chunk.text && chunk.text.trim()) {
            knowledgeText += chunk.text + '\n\n';
            validChunks++;
          }
        } catch (e) {
          console.error(`❌ Ошибка парсинга строки в базе знаний: ${e.message}`);
        }
      });
      console.log(`✅ Успешно загружено ${validChunks} фрагментов знаний из ${knowledgeLines.length}`);
    } else {
      console.error(`❌ Файл базы знаний не найден: ${knowledgeBasePath}`);
    }
    
    console.log(`Проверка существования файла тренировок: ${trainingDataPath}`);
    // Загружаем данные о тренировках
    if (fs.existsSync(trainingDataPath)) {
      console.log(`✅ Файл найден: ${trainingDataPath}`);
      const trainingContent = fs.readFileSync(trainingDataPath, 'utf8');
      const trainingLines = trainingContent.split('\n').filter(line => line.trim());
      console.log(`📚 Найдено ${trainingLines.length} строк в файле тренировок`);
      
      let validTrainings = 0;
      trainingLines.forEach(line => {
        try {
          const chunk = JSON.parse(line);
          if (chunk.text && chunk.text.trim()) {
            knowledgeText += chunk.text + '\n\n';
            validTrainings++;
          }
        } catch (e) {
          console.error(`❌ Ошибка парсинга строки в файле тренировок: ${e.message}`);
        }
      });
      console.log(`✅ Успешно загружено ${validTrainings} фрагментов тренировок из ${trainingLines.length}`);
    } else {
      console.error(`❌ Файл тренировок не найден: ${trainingDataPath}`);
    }
    
    console.log(`📊 Общий размер базы знаний: ${knowledgeText.length} символов`);
    if (knowledgeText.length === 0) {
      console.error('⚠️ ВНИМАНИЕ: База знаний пуста! Это приведет к некачественным ответам');
    }
    
    return knowledgeText;
  } catch (error) {
    console.error('❌ Ошибка загрузки базы знаний Дианы:', error);
    return '';
  }
}



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
  const recommendations = [];
  
  if (avgCompletion < 50) {
    recommendations.push({
      type: 'critical',
      title: 'Снижение нагрузки',
      text: 'Рекомендуем уменьшить количество упражнений и упростить план питания для лучшей выполнимости.'
    });
  }
  
  // Анализируем основные причины пропусков упражнений
  const topExerciseCategory = Object.keys(reasonStats.exercise).reduce((a, b) => 
    reasonStats.exercise[a]?.count > reasonStats.exercise[b]?.count ? a : b, 'time');
    
  if (reasonStats.exercise[topExerciseCategory]?.count > 2) {
    switch (topExerciseCategory) {
      case 'time':
        recommendations.push({
          type: 'schedule',
          title: 'Оптимизация времени',
          text: 'Попробуйте короткие 15-минутные тренировки утром или разбейте упражнения на части в течение дня.'
        });
        break;
      case 'energy':
        recommendations.push({
          type: 'energy',
          title: 'Работа с энергией',
          text: 'Рекомендуем пересмотреть режим сна и добавить энергизирующие упражнения.'
        });
        break;
      case 'motivation':
        recommendations.push({
          type: 'motivation',
          title: 'Поддержка мотивации',
          text: 'Найдите партнера по тренировкам или награждайте себя за выполнение целей.'
        });
        break;
    }
  }
  
  return recommendations;
}

function determineAdjustments(avgCompletion, reasonStats) {
  const adjustments = {
    difficulty: 'maintain', // maintain, reduce, increase
    goals: {},
    schedule: 'keep' // keep, flexible, strict
  };
  
  if (avgCompletion < 40) {
    adjustments.difficulty = 'reduce';
    adjustments.goals.exerciseReduction = 25; // уменьшить на 25%
    adjustments.goals.mealSimplification = true;
    adjustments.schedule = 'flexible';
  } else if (avgCompletion > 80) {
    adjustments.difficulty = 'increase';
    adjustments.goals.exerciseIncrease = 15; // увеличить на 15%
    adjustments.goals.newChallenges = true;
  }
  
  return adjustments;
}

function generateMotivationalMessage(avgCompletion) {
  if (avgCompletion >= 80) {
    return "🎉 Невероятно! Вы показываете потрясающие результаты. Продолжайте в том же духе!";
  } else if (avgCompletion >= 60) {
    return "💪 Отличная работа! Вы на правильном пути. Небольшие улучшения приведут к большим результатам.";
  } else if (avgCompletion >= 40) {
    return "🌱 Помните: прогресс важнее совершенства. Каждый маленький шаг приближает вас к цели.";
  } else {
    return "🤗 Не сдавайтесь! Мы скорректируем план, чтобы он лучше подходил под ваш ритм жизни.";
  }
}

// Endpoint для еженедельной аналитики
app.post('/api/weekly-analytics', async (req, res) => {
  try {
    const { weekStats, userId, programId } = req.body;
    
    console.log('📊 Получены данные для анализа недели:', { userId, programId, daysCount: weekStats.length });
    
    // Вычисляем основные метрики недели
    const weekSummary = calculateWeekSummary(weekStats);
    
    // Анализируем причины пропусков
    const skipReasons = analyzeSkipReasons(weekStats);
    
    // Генерируем рекомендации на основе данных
    const recommendations = generateWeeklyRecommendations(weekSummary, skipReasons);
    
    // Определяем корректировки для следующей недели
    const adjustments = calculateWeeklyAdjustments(weekSummary, skipReasons);
    
    // Генерируем мотивационное сообщение
    const motivationalMessage = generateMotivationalMessage(weekSummary.avgCompletion);
    
    const analysis = {
      weekSummary,
      skipReasons,
      recommendations,
      adjustments,
      motivationalMessage,
      generatedAt: new Date().toISOString()
    };
    
    console.log('✅ Анализ недели сгенерирован:', analysis);
    
    res.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Ошибка анализа недели:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при анализе недели'
    });
  }
});

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
            console.log(`⚠️ Найдено повторение блюда "${meal.meal.name}" в день ${day.day} недели ${week.week}`);
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
                    console.log(`⚠️ Найдено повторение источника белка "${ingredient.name}" в день ${day.day} недели ${week.week}`);
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
        let context = `Генерация плана питания с учетом:
- Текущий процент выполнения: ${progress.executionRate * 100}%
- Частые причины пропуска: ${progress.commonReasons.join(', ')}
- Тип диеты: ${userSettings.dietType}
- Исключенные продукты: ${userSettings.excludedProducts.join(', ')}
- Предпочитаемые продукты: ${userSettings.preferredProteins.join(', ')}`;

        // Запрос к Mistral с учетом контекста
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [
                    { 
                        role: "system", 
                        content: `Ты - Диана, эксперт по питанию. Генерируешь план на основе:\n${context}`
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
            throw new Error(`Mistral API error: ${response.status}`);
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

console.log('=== BACKEND INDEX.JS ЗАПУЩЕН ===');

export default app;

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
        const userFile = path.join(__dirname, 'backup_files', 'users', `quiz_${userId}.json`);
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

// Функция для расчета базального метаболизма (BMR)
function calculateBMR(quiz) {
  const { weight_kg, height_cm, age, sex } = quiz;
  
  if (!weight_kg || !height_cm || !age) {
    return 0;
  }
  
  // Формула Миффлина-Сан Жеора
  let bmr;
  if (sex === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
  
  return Math.round(bmr);
}

// Функция для анализа данных пользователя
function analyzeUserData(userData) {
  let analysis = [];
  
  // Анализ квиза
  if (userData.quiz) {
    const quiz = userData.quiz;
    analysis.push(`👤 ИМЯ ПОЛЬЗОВАТЕЛЯ: ${quiz.name || 'Имя не указано'} (ОБЯЗАТЕЛЬНО ИСПОЛЬЗУЙ В ОТВЕТЕ)`);
    analysis.push(`⚖️ Пол: ${quiz.sex === 'male' ? 'мужской' : 'женский'}, возраст: ${quiz.age || 'не указан'}`);
    analysis.push(`📏 Рост: ${quiz.height_cm || 'не указан'} см, вес: ${quiz.weight_kg || 'не указан'} кг`);
    
    if (quiz.goal) {
      const goals = {
        1: 'похудеть',
        2: 'поддерживать вес',
        3: 'набрать мышечную массу'
      };
      analysis.push(`🎯 Цель: ${goals[quiz.goal] || 'не указана'}`);
    }
    
    analysis.push(`🏃 Активность: ${quiz.activity_coef || 'не указана'}, тренировки: ${quiz.workouts_per_week || 0} раз в неделю`);
    analysis.push(`🏋️ Уровень: ${quiz.training_level || 'не указан'}, место: ${quiz.gym_or_home === 'home' ? 'дома' : 'зал'}`);
    
    // Расчет калорий на основе данных квиза
    if (quiz.weight_kg && quiz.height_cm && quiz.age) {
      const bmr = calculateBMR(quiz);
      const dailyCalories = Math.round(bmr * (quiz.activity_coef || 1.2));
      const targetCalories = Math.round(dailyCalories * 0.85); // дефицит 15%
      analysis.push(`🔥 Базовая норма калорий: ${dailyCalories} ккал`);
      analysis.push(`🎯 Целевые калории (с дефицитом): ${targetCalories} ккал - ЭТО НОРМА В ПРИЛОЖЕНИИ`);
    }
    
    if (quiz.diet_flags) {
      analysis.push(`🍽️ Диета: ${quiz.diet_flags}`);
    }
  } else {
    analysis.push(`❌ Квиз не пройден - данные о пользователе отсутствуют`);
  }
  
  // Анализ прогресса
  if (userData.dailyProgress) {
    const progressDays = Object.keys(userData.dailyProgress);
    const recentDays = progressDays.slice(-7); // последние 7 дней
    
    if (recentDays.length > 0) {
      analysis.push(`📊 Активность за последние ${recentDays.length} дней:`);
      
      let workoutCount = 0;
      let mealCount = 0;
      
      recentDays.forEach(day => {
        const dayData = userData.dailyProgress[day];
        if (dayData.tasks) {
          workoutCount += dayData.tasks.filter(t => t.type === 'workout' && t.done).length;
          mealCount += dayData.tasks.filter(t => t.type === 'meal' && t.done).length;
        }
      });
      
      analysis.push(`💪 Выполнено тренировок: ${workoutCount}`);
      analysis.push(`🍽️ Выполнено приемов пищи: ${mealCount}`);
    }
  }
  
  // Анализ истории чата
  if (userData.chatHistory && userData.chatHistory.length > 0) {
    const lastMessages = userData.chatHistory.slice(-4);
    analysis.push(`💬 Последние темы разговора: ${lastMessages.filter(m => m.role === 'user').map(m => m.content.substring(0, 30)).join(', ')}`);
  } else {
    analysis.push(`💬 Первое общение с Дианой`);
  }
  
  return analysis.join('\n');
}

