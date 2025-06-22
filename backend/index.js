import express from 'express';
import fs from 'fs';
import path from 'path';
import { loadKnowledgeBase, findRelevantChunks } from './knowledgeBase.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

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
  // Пример: получить embedding пользователя (заглушка)
  // В реальности: отправить prompt в AI API и получить embedding
  const userEmbedding = answers.embedding || Array(1536).fill(0); // TODO: заменить на реальный embedding

  // Найти релевантные chunks
  const relevantChunks = findRelevantChunks(userEmbedding, 5);

  // Сформировать системный prompt и сообщения для OpenAI
  const systemPrompt = `Ты — эксперт по похудению Диана. Используй знания из базы и ответы пользователя для составления персонального плана похудения на 8 недель. Форматируй ответ в виде JSON с неделями, днями, меню, тренировками и советами.`;
  const userPrompt = `Ответы пользователя: ${JSON.stringify(answers)}\n\nРелевантные знания:\n${relevantChunks.map(c => c.text).join('\n---\n')}`;

  try {
    const aiResponse = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    res.json({
      plan: aiResponse
    });
  } catch (e) {
    res.status(500).json({ error: 'AI error', details: e.message });
  }
});

async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature: 0.3
    })
  });
  if (!response.ok) throw new Error('OpenAI API error');
  const data = await response.json();
  return data.choices[0].message.content;
}

// Загрузка базы знаний при старте
loadKnowledgeBase();

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
