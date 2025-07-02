import express from 'express';
import fs from 'fs';
import path from 'path';
import { loadKnowledgeBase, findRelevantChunks } from './knowledgeBase.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import programApi from './programApi.js';
import cors from 'cors';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({
  origin: [
    'https://diana-fit.vercel.app',
    'https://dianafit.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use('/api', programApi);

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

// Принять ответы теста и вернуть план (заглушка)
app.post('/api/calculate-plan', async (req, res) => {
  const answers = req.body;
  const userEmbedding = answers.embedding || Array(1536).fill(0); // TODO: заменить на реальный embedding
  const relevantChunks = findRelevantChunks(userEmbedding, 5);

  // Загружаем базу знаний Дианы
  const dianaKnowledge = loadDianaKnowledge();

  const systemPrompt = `Ты — эксперт по похудению Диана. 

ВАЖНО: Отвечай ВСЕГДА в стиле и манере Дианы, используя её словечки, формулировки и подход:
- Говори просто и понятно, "грубо говоря", "в принципе", "условно говоря"
- Будь дружелюбной и поддерживающей
- Объясняй почему что-то работает или не работает
- Упоминай о важности здоровых привычек и умеренности
- Предупреждай о рисках экстремальных диет

БАЗА ЗНАНИЙ ДИАНЫ (используй эту информацию и стиль для ответов):
${dianaKnowledge.substring(0, 3000)}...

Используй знания из базы и ответы пользователя для составления персонального плана похудения на 4 недели.

СТРОГИЕ ПРАВИЛА ПО СОСТАВЛЕНИЮ ПЛАНА ПИТАНИЯ:
1. НЕ ПОВТОРЯЙ блюда в рамках одного дня! Каждый прием пищи (завтрак, обед, ужин, перекус, полдник) должен быть УНИКАЛЬНЫМ.
2. Разнообразь рацион - не используй одни и те же продукты в разных приемах пищи одного дня.
3. Старайся не повторять одинаковые блюда чаще чем 1 раз в 3 дня.
4. Используй максимально разнообразные рецепты и продукты в течение недели.

ОБЯЗАТЕЛЬНО учти тип питания пользователя:
- Если выбрал "vegetarian_eggs" (Вегетарианство 🥚) - включай яйца, молочные продукты, НО НЕ ВКЛЮЧАЙ мясо и рыбу
- Если выбрал "vegetarian_no_eggs" (Вегетарианство) - НЕ включай яйца, мясо, рыбу, но включай молочные продукты
- Если выбрал "vegan" (Веганство) - НЕ включай мясо, рыбу, яйца, молочные продукты
- Если выбрал "meat" (Мясная диета) - включай мясо, ограничь углеводы
- Если выбрал "fish" (Рыбная диета) - включай рыбу, морепродукты, ограничь красное мясо

Для каждого блюда ОБЯЗАТЕЛЬНО указывай:
1. Название блюда (уникальное в рамках дня)
2. Список ингредиентов с граммовками (amount и unit)
3. Калорийность

ВАЖНО ПРОВЕРИТЬ ПЕРЕД ОТВЕТОМ:
- Нет повторяющихся блюд в рамках одного дня
- Нет однотипных перекусов и полдников (например, если перекус - яблоко с миндалем, то полдник должен быть другим)
- Разнообразие типов блюд (не только каши или салаты)

Форматируй ответ строго в JSON:
{
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "isWorkoutDay": true/false,
          "workout": { ... если isWorkoutDay true },
          "meals": [
            {
              "type": "Завтрак",
              "meal": {
                "name": "Название блюда",
                "ingredients": [
                  {"name": "Ингредиент", "amount": 100, "unit": "г"},
                  {"name": "Ингредиент2", "amount": 200, "unit": "мл"}
                ]
              },
              "calories": 320,
              "time": "08:00"
            }
          ]
        }
      ]
    }
  ]
}`;
  const userPrompt = `Ответы пользователя: ${JSON.stringify(answers)}

Особенно важно учесть:
- Тип питания: ${answers.diet_flags || 'default'}
- Место тренировок: ${answers.gym_or_home || 'дом'}  
- Количество тренировок в неделю: ${answers.workouts_per_week || 3}
- Уровень подготовки: ${answers.training_level || 'beginner'}
- Цель по весу: ${answers.goal_weight_loss || 'weight_loss'}

КРИТИЧЕСКИ ВАЖНО:
- Разнообразь блюда в течение дня
- Избегай повторений одного и того же блюда на перекус и полдник
- Используй разные источники белка, углеводов и жиров
- Создай максимально разнообразный рацион для поддержания интереса к диете

Релевантные знания:\n${relevantChunks.map(c => c.text).join('\n---\n')}

ВАЖНО: Генерируй план на 4 недели (28 дней) с учетом указанного типа питания и граммовками для каждого ингредиента!`;

  try {
    const aiResponse = await callMistralAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    
    // Проверяем и исправляем повторяющиеся блюда в плане
    const fixedResponse = checkAndFixMealDuplicates(aiResponse);
    
    res.json({ plan: fixedResponse });
  } catch (e) {
    res.status(500).json({ error: 'AI error', details: e.message });
  }
});

// Функция для проверки и исправления повторяющихся блюд в дне
function checkAndFixMealDuplicates(plan) {
  try {
    // Пытаемся распарсить план, если он в виде строки
    const planObj = typeof plan === 'string' ? JSON.parse(plan) : plan;
    
    if (!planObj.weeks || !Array.isArray(planObj.weeks)) {
      console.log('❌ Неверный формат плана, не удалось найти недели');
      return plan; // Возвращаем исходный план, если формат неверный
    }
    
    // Перебираем все недели
    planObj.weeks.forEach(week => {
      if (!week.days || !Array.isArray(week.days)) return;
      
      // Перебираем все дни в неделе
      week.days.forEach(day => {
        if (!day.meals || !Array.isArray(day.meals)) return;
        
        // Создаем множество для отслеживания блюд в текущем дне
        const mealNames = new Set();
        const mealTypes = {};
        
        // Проверяем наличие дубликатов в текущем дне
        day.meals.forEach((meal, index) => {
          if (!meal.meal) return;
          
          const mealName = typeof meal.meal === 'string' 
            ? meal.meal 
            : (meal.meal.name || 'Без названия');
            
          // Сохраняем оригинальное название для логов
          const originalName = mealName;
          
          // Проверяем, есть ли уже такое блюдо в этом дне
          if (mealNames.has(mealName.toLowerCase())) {
            console.log(`⚠️ Обнаружен дубликат блюда в дне ${day.day}: "${mealName}"`);
            
            // Пытаемся модифицировать название, чтобы избежать дубликата
            let newMealName = `${mealName} (вариант ${index + 1})`;
            
            // Заменяем название блюда
            if (typeof meal.meal === 'string') {
              meal.meal = newMealName;
            } else if (meal.meal && typeof meal.meal === 'object') {
              meal.meal.name = newMealName;
            }
            
            console.log(`✅ Переименовано блюдо: "${originalName}" -> "${newMealName}"`);
          }
          
          // Отслеживаем типы приемов пищи (перекус, полдник и т.д.)
          if (meal.type) {
            if (!mealTypes[meal.type]) {
              mealTypes[meal.type] = [];
            }
            mealTypes[meal.type].push({index, name: mealName});
          }
          
          // Добавляем название блюда в множество (в нижнем регистре для сравнения)
          mealNames.add(mealName.toLowerCase());
        });
        
        // Особая проверка для перекусов и полдников
        if (mealTypes['Перекус'] && mealTypes['Полдник'] && 
            mealTypes['Перекус'].length === 1 && mealTypes['Полдник'].length === 1) {
          
          const snackName = mealTypes['Перекус'][0].name.toLowerCase();
          const afternoonSnackName = mealTypes['Полдник'][0].name.toLowerCase();
          
          // Если перекус и полдник одинаковые
          if (snackName === afternoonSnackName) {
            console.log(`⚠️ Перекус и полдник одинаковые в дне ${day.day}: "${snackName}"`);
            
            // Модифицируем полдник
            const afternoonSnackIndex = mealTypes['Полдник'][0].index;
            const meal = day.meals[afternoonSnackIndex];
            
            if (typeof meal.meal === 'string') {
              meal.meal = `${meal.meal} (альтернативный вариант)`;
            } else if (meal.meal && typeof meal.meal === 'object') {
              meal.meal.name = `${meal.meal.name} (альтернативный вариант)`;
            }
            
            console.log(`✅ Изменен полдник для разнообразия`);
          }
        }
      });
    });
    
    // Возвращаем исправленный план
    return typeof plan === 'string' ? JSON.stringify(planObj) : planObj;
    
  } catch (error) {
    console.error('❌ Ошибка при проверке дубликатов блюд:', error);
    return plan; // В случае ошибки возвращаем исходный план
  }
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
    throw new Error('MISTRAL_API_KEY не установлен в переменных окружения');
  }
  
  try {
    console.log('Вызов Mistral API...');
    
    // Используем ключ как есть, без префиксов - мы уже проверили, что он работает
    console.log(`Используемый API ключ: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log('Длина ключа:', apiKey.length, 'символов');
    
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
        temperature: 0.3
      })
    });
    
    // Если первая попытка не удалась, пробуем с моделью mistral-tiny
    if (!response.ok && (response.status === 401 || response.status === 403)) {
      console.log('Первая попытка не удалась, пробуем модель mistral-tiny...');
      response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-tiny',  // Используем более доступную модель
          messages,
          temperature: 0.3
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
  const { message, context, conversation } = req.body;
  // Поддерживаем как context, так и conversation для совместимости
  const chatContext = context || (conversation ? JSON.stringify(conversation.slice(-5)) : 'Начало разговора');
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    console.log(`Получен запрос на чат с Дианой: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    
    // Находим релевантные знания из векторной базы
    const userEmbedding = Array(1536).fill(0); // TODO: получить реальный embedding от сообщения
    const relevantChunks = findRelevantChunks(userEmbedding, 3);
    console.log(`Найдено ${relevantChunks.length} релевантных фрагментов знаний`);
    
    // Загружаем базу знаний для чата
    const dianaKnowledge = loadDianaKnowledge();
    console.log(`Загружена база знаний Дианы: ${dianaKnowledge.length} символов`);
    
    const systemPrompt = `Ты — персональный ИИ-тренер Диана, эксперт по похудению и здоровому образу жизни.

ВАЖНО: Отвечай ВСЕГДА в стиле и манере Дианы:
- Используй её характерные фразы: "грубо говоря", "в принципе", "условно говоря", "смотри"  
- Будь дружелюбной, понимающей и поддерживающей
- Объясняй просто и доступно, без сложных терминов
- Всегда объясняй ПОЧЕМУ что-то работает или не работает
- Подчеркивай важность здоровых привычек и терпения
- Предупреждай об опасности экстремальных диет и срывов
- Говори о важности адекватного дефицита калорий (не более 10-15%)
- Упоминай, что ниже 1400 калорий опускаться нельзя

ПРАВИЛА ПО РЕЦЕПТАМ И ПИТАНИЮ:
- Когда рекомендуешь блюда, ВСЕГДА предлагай РАЗНООБРАЗНЫЕ варианты
- НИКОГДА не рекомендуй одинаковые перекусы и полдники в один день
- Предлагай разные источники белка, углеводов и жиров
- Если пользователь спрашивает о рационе на день, составь план с разнообразными блюдами
- Если видишь, что пользователь повторяет одинаковые блюда, предложи альтернативы

БАЗА ЗНАНИЙ ДИАНЫ (используй этот стиль и информацию):
${dianaKnowledge.substring(0, 2000)}...

Ты помогаешь пользователям с вопросами о питании, тренировках, мотивации и здоровом образе жизни.
    
    Твой стиль общения:
    - Дружелюбный и поддерживающий
    - Профессиональный, но не формальный
    - Мотивирующий и позитивный
    - Конкретный и практичный
    
    Используй знания из базы данных для ответов. Если информации недостаточно, честно скажи об этом.
    Отвечай на русском языке.`;
    
    const userPrompt = `Вопрос пользователя: ${message}

Контекст разговора: ${chatContext}

Релевантные знания из базы:
${relevantChunks.map(c => c.text).join('\n---\n')}`;

    const aiResponse = await callMistralAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    
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
    
    // Загружаем основную базу знаний (разговоры, лекции)
    if (fs.existsSync(knowledgeBasePath)) {
      const knowledgeLines = fs.readFileSync(knowledgeBasePath, 'utf8').split('\n').filter(line => line.trim());
      knowledgeLines.forEach(line => {
        try {
          const chunk = JSON.parse(line);
          if (chunk.text && chunk.text.trim()) {
            knowledgeText += chunk.text + '\n\n';
          }
        } catch (e) {
          // Игнорируем строки с ошибками парсинга
        }
      });
    }
    
    // Загружаем данные о тренировках
    if (fs.existsSync(trainingDataPath)) {
      const trainingLines = fs.readFileSync(trainingDataPath, 'utf8').split('\n').filter(line => line.trim());
      trainingLines.forEach(line => {
        try {
          const chunk = JSON.parse(line);
          if (chunk.text && chunk.text.trim()) {
            knowledgeText += chunk.text + '\n\n';
          }
        } catch (e) {
          // Игнорируем строки с ошибками парсинга
        }
      });
    }
    
    return knowledgeText;
  } catch (error) {
    console.error('Ошибка загрузки базы знаний Дианы:', error);
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

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
