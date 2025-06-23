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
  origin: 'https://diana-fit.vercel.app',
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

  const systemPrompt = `Ты — эксперт по похудению Диана. Используй знания из базы и ответы пользователя для составления персонального плана похудения на 8 недель. Форматируй ответ в виде JSON с неделями, днями, меню, тренировками и советами.`;
  const userPrompt = `Ответы пользователя: ${JSON.stringify(answers)}\n\nРелевантные знания:\n${relevantChunks.map(c => c.text).join('\n---\n')}`;

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
  const apiKey = 'AqUS2WOIZAR0Np79SnK4Zq2YmeQpqEvh';
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

loadKnowledgeBase();

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
