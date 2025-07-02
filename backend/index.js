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

  const systemPrompt = `Ты — эксперт по похудению Диана. Используй знания из базы и ответы пользователя для составления персонального плана похудения на 4 недели.

ОБЯЗАТЕЛЬНО учти тип питания пользователя:
- Если выбрал "Вегетарианство (с яйцами)" - включай яйца, молочные продукты, НО НЕ ВКЛЮЧАЙ мясо и рыбу
- Если выбрал "Вегетарианство (без яиц)" - НЕ включай яйца, мясо, рыбу, но включай молочные продукты
- Если выбрал "Веганство" - НЕ включай мясо, рыбу, яйца, молочные продукты
- Если выбрал "Мясная диета" - включай мясо, но ограничь углеводы
- Если выбрал "Рыбная диета" - включай рыбу, морепродукты, ограничь красное мясо

Для каждого блюда ОБЯЗАТЕЛЬНО указывай:
1. Название блюда
2. Список ингредиентов с граммовками (amount и unit)
3. Калорийность

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

Релевантные знания:\n${relevantChunks.map(c => c.text).join('\n---\n')}

ВАЖНО: Генерируй план на 4 недели (28 дней) с учетом указанного типа питания и граммовками для каждого ингредиента!`;

  try {
    const aiResponse = await callMistralAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    res.json({ plan: aiResponse });
  } catch (e) {
    res.status(500).json({ error: 'AI error', details: e.message });
  }
});

async function callMistralAI(messages) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY не установлен в переменных окружения');
  }
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
  if (!response.ok) throw new Error('Mistral API error');
  const data = await response.json();
  return data.choices[0].message.content;
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
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    // Находим релевантные знания из векторной базы
    const userEmbedding = Array(1536).fill(0); // TODO: получить реальный embedding от сообщения
    const relevantChunks = findRelevantChunks(userEmbedding, 3);
    
    const systemPrompt = `Ты — персональный ИИ-тренер Диана, эксперт по похудению и здоровому образу жизни. 
    Ты помогаешь пользователям с вопросами о питании, тренировках, мотивации и здоровом образе жизни.
    
    Твой стиль общения:
    - Дружелюбный и поддерживающий
    - Профессиональный, но не формальный
    - Мотивирующий и позитивный
    - Конкретный и практичный
    
    Используй знания из базы данных для ответов. Если информации недостаточно, честно скажи об этом.
    Отвечай на русском языке.`;
    
    const userPrompt = `Вопрос пользователя: ${message}

Контекст разговора: ${context || 'Начало разговора'}

Релевантные знания из базы:
${relevantChunks.map(c => c.text).join('\n---\n')}`;

    const aiResponse = await callMistralAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    
    res.json({ response: aiResponse });
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ error: 'AI error', details: e.message });
  }
});

loadKnowledgeBase();

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
