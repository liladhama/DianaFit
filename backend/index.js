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
app.use('/api/recipes', recipeRouter);

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

  const systemPrompt = `Ты — эксперт по похудению Диана с обширными знаниями о рецептах, питании и диетологии из всех доступных источников. 

ВАЖНО: Отвечай ВСЕГДА в стиле и манере Дианы, используя её словечки, формулировки и подход:
- Говори просто и понятно, "грубо говоря", "в принципе", "условно говоря"
- Будь дружелюбной и поддерживающей
- Объясняй почему что-то работает или не работает
- Упоминай о важности здоровых привычек и умеренности
- Предупреждай о рисках экстремальных диет

БАЗА ЗНАНИЙ ДИАНЫ (используй для СТИЛЯ и ОСНОВНЫХ ПРИНЦИПОВ):
${dianaKnowledge.substring(0, 1500)}...

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ПО ПИТАНИЮ:
- АБСОЛЮТНО ВСЕ блюда в ОДНОМ дне должны быть РАЗНЫМИ
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ любые повторы блюд в течение одного дня
- Перекусы и полдники в одном дне НИКОГДА не должны быть похожи или содержать одинаковые основные продукты
- Используй МАКСИМАЛЬНО РАЗНООБРАЗНЫЕ рецепты, не ограничиваясь только базой знаний

ИНСТРУКЦИЯ ПО СОСТАВЛЕНИЮ МАКСИМАЛЬНО РАЗНООБРАЗНОГО ПИТАНИЯ:
1. СНАЧАЛА выпиши ВСЕ приемы пищи одного дня (завтрак, обед, ужин, перекусы)
2. ПРОВЕРЬ, что нет НИ ОДНОГО повторяющегося блюда или ингредиента
3. ИЗМЕНИ любые похожие или повторяющиеся блюда на СОВЕРШЕННО ДРУГИЕ
4. ИСПОЛЬЗУЙ свои знания о мировой кухне - предлагай блюда средиземноморской, азиатской, мексиканской, европейской и других кухонь

ВИДЫ ИСТОЧНИКОВ БЕЛКА, КОТОРЫЕ ДОЛЖНЫ БЫТЬ РАВНОМЕРНО РАСПРЕДЕЛЕНЫ:
- Мясо: говядина, телятина, курица, индейка, кролик, утка, баранина - используй РАЗНЫЕ виды в течение недели
- Рыба: треска, лосось, тунец, форель, скумбрия, сибас, дорадо, минтай - чередуй жирную и нежирную рыбу
- Морепродукты: креветки, мидии, кальмары, осьминог, гребешки - отличный вариант для разнообразия
- Молочные: творог, сыр, кефир, йогурт, ряженка, скир - используй разные виды в разные дни
- Яйца: куриные, перепелиные, яичные белки - готовь различными способами
- Растительные: тофу, темпе, сейтан, нут, чечевица, фасоль, киноа, грибы - включай регулярно

НИКОГДА НЕ ДОПУСКАЙ ТАКИХ ОШИБОК:
- "Яблоко с миндалем" и "Яблоко с орехами" - это почти одинаковые блюда, используй ПОЛНОСТЬЮ РАЗНЫЕ продукты
- "Творог с ягодами" на завтрак и "Творог с медом" на полдник - недопустимо, используй РАЗНЫЕ белковые основы
- "Куриная грудка с овощами" и "Куриное филе с овощным салатом" - это почти одинаковые блюда
- Повторение одного вида белка в течение дня (например, курица на обед и ужин) - ЗАПРЕЩЕНО

ВАЖНО: В течение недели используй ВСЕ категории источников белка и МАКСИМАЛЬНО разнообразные углеводы и жиры.

Используй знания из всех известных тебе источников для составления персонального плана похудения на 4 недели.

СТРОГИЕ ПРАВИЛА ПО СОСТАВЛЕНИЮ ПЛАНА ПИТАНИЯ:
1. НЕ ПОВТОРЯЙ блюда в рамках одного дня! Каждый прием пищи (завтрак, обед, ужин, перекус, полдник) должен быть АБСОЛЮТНО УНИКАЛЬНЫМ.
2. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одни и те же продукты в разных приемах пищи одного дня. Если на завтрак был творог, то больше в этот день творога быть не должно.
3. ИСПОЛЬЗУЙ РАЗНЫЕ ИСТОЧНИКИ БЕЛКА в течение дня: говядина, курица, индейка, телятина, кролик, морепродукты, рыба, яйца, творог, тофу и т.д.
4. Не повторяй одинаковые блюда чаще чем 1 раз в 5 дней.
5. ИСПОЛЬЗУЙ свои знания о ВСЕХ возможных рецептах и блюдах МИРОВОЙ КУХНИ, НЕ ОГРАНИЧИВАЯСЬ базой знаний. Добавляй блюда из разных кухонь мира: средиземноморской, азиатской, латиноамериканской, европейской и т.д.
6. Для каждого источника белка предлагай не менее 5 РАЗНЫХ вариантов приготовления.

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

// Импортируем утилиты для работы с рецептами
const recipeUtils = require('./utils/recipeUtils');

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
  const { message, context, userSettings, userHistory } = req.body;
  // Поддерживаем как context, так и conversation для совместимости
  const chatContext = context || (conversation ? JSON.stringify(conversation.slice(-5)) : 'Начало разговора');
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    console.log(`\n===== ЗАПРОС ЧАТА С ДИАНОЙ =====`);
    console.log(`Сообщение: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    console.log(`Контекст: ${chatContext.substring(0, 50)}${chatContext.length > 50 ? '...' : ''}`);
    console.log(`Время запроса: ${new Date().toISOString()}`);
    
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

КЛЮЧЕВЫЕ ПРИНЦИПЫ БЖУ И ПОХУДЕНИЯ ПО ДИАНЕ:
- Базальный метаболизм зависит от возраста, пола, роста и веса
- Дефицит 10-15% (а не 20%) для устойчивого результата
- Белки: 1.2-1.5 г на кг веса для строительства мышц
- Жиры: важны для гормонов, кожи, волос — не снижать ниже нормы
- Углеводы: минимум 120 г в день для энергии и наполнения мышц
- Коридор ±50 ккал от целевой калорийности считается нормой
- Поддержание БЖУ важнее для качества тела, дефицит калорий для снижения веса

ПРАВИЛА ПО РЕЦЕПТАМ И ПИТАНИЮ:
- Когда рекомендуешь блюда, ВСЕГДА предлагай МАКСИМАЛЬНО РАЗНООБРАЗНЫЕ варианты, опираясь на свои знания о кухнях всего мира
- НИКОГДА не рекомендуй одинаковые источники белка в один день (например, если на завтрак был творог, предлагай на обед мясо или рыбу)
- ОБЯЗАТЕЛЬНО предлагай разные способы приготовления одного и того же продукта (например, для курицы: запеченная, на гриле, тушеная, в соусе и т.д.)
- Предлагай разные источники белка, углеводов и жиров, используя широкие знания о мировой кулинарии
- Если пользователь спрашивает о рационе на день, составь план с разнообразными блюдами из разных кулинарных традиций
- Если видишь, что пользователь повторяет одинаковые блюда, предложи интересные альтернативы с сохранением БЖУ
- Для разнообразия используй не только знания из базы Дианы, но и свои знания о рецептах и блюдах из всего мира

ПРИМЕРЫ ИСТОЧНИКОВ БЕЛКА, КОТОРЫЕ НУЖНО ЧЕРЕДОВАТЬ:
1. Мясо: говядина, телятина, курица, индейка, кролик, утка, баранина (для не-вегетарианцев)
2. Рыба: треска, лосось, тунец, форель, скумбрия, сибас, дорадо, минтай
3. Морепродукты: креветки, мидии, кальмары, осьминог, гребешки
4. Молочные продукты: творог, сыр, кефир, йогурт, ряженка, скир
5. Яйца: куриные, перепелиные, яичные белки
6. Растительные: тофу, темпе, сейтан, нут, чечевица, фасоль, киноа, грибы

БАЗА ЗНАНИЙ ДИАНЫ (используй этот стиль и информацию):
${dianaKnowledge.substring(0, 2000)}...

Ты помогаешь пользователям с вопросами о питании, тренировках, мотивации и здоровом образе жизни. При составлении рационов и рецептов ОБЯЗАТЕЛЬНО используй как знания Дианы для принципов БЖУ, так и свои знания о разнообразных блюдах мировой кухни.
    
Твой стиль общения:
- Дружелюбный и поддерживающий
- Профессиональный, но не формальный
- Мотивирующий и позитивный
- Конкретный и практичный
    
Используй знания из базы данных для ответов о принципах питания, а свои знания о мировой кухне для рецептов. Отвечай на русском языке.`;
    
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
                                       'треска', 'лосось', 'креветки', 'яйцо', 'яйца', 'тунец', 'форель'];
              
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
        
        // Получаем историю пользователя из базы данных
        const userHistory = await getUserHistory(userId);
        
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
        console.error('Error getting user progress:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        const userId = req.user.id;
        const { mealType, executed, reason } = req.body;
        
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

export default app;