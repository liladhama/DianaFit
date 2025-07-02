import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let knowledgeChunks = [];
let knowledgeLoaded = false;

// Загрузка базы при старте
function loadKnowledgeBase() {
  if (knowledgeLoaded) {
    console.log('База знаний уже загружена, пропускаем загрузку');
    return;
  }
  
  try {
    const filePath = path.join(__dirname, 'knowledge_base_chunks.jsonl');
    console.log(`Загрузка базы знаний из: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Файл базы знаний не найден: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    console.log(`📚 Найдено ${lines.length} строк в файле базы знаний`);
    
    let successCount = 0;
    let errorCount = 0;
    
    knowledgeChunks = lines.map((line, index) => {
      try {
        const chunk = JSON.parse(line);
        successCount++;
        // Если embedding отсутствует, создаём пустой вектор
        if (!chunk.embedding) {
          chunk.embedding = Array(1536).fill(0);
          console.warn(`⚠️ Строка ${index + 1} не содержит embedding, используется пустой вектор`);
        }
        return chunk;
      } catch (e) {
        errorCount++;
        console.error(`❌ Ошибка парсинга строки ${index + 1}: ${e.message}`);
        // Возвращаем пустой chunk с пустым embedding чтобы не ломать работу
        return { text: "", embedding: Array(1536).fill(0) };
      }
    }).filter(chunk => chunk.text && chunk.text.trim());
    
    console.log(`✅ Успешно загружено ${successCount - errorCount} фрагментов из ${lines.length} строк`);
    console.log(`⚠️ Ошибок при парсинге: ${errorCount}`);
    console.log(`📊 Итоговый размер базы знаний: ${knowledgeChunks.length} фрагментов`);
    
    knowledgeLoaded = true;
  } catch (error) {
    console.error('❌ Критическая ошибка при загрузке базы знаний:', error);
  }
}

// Косинусное сходство
function cosineSimilarity(a, b) {
  try {
    // Проверка на пустые векторы
    if (!a || !b || a.length === 0 || b.length === 0) {
      return 0;
    }
    
    // Проверка на совпадение размерностей
    if (a.length !== b.length) {
      console.warn(`⚠️ Несовпадение размерностей векторов: ${a.length} vs ${b.length}`);
      return 0;
    }
    
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    
    // Проверка на нулевые нормы
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dot / (normA * normB);
  } catch (error) {
    console.error('❌ Ошибка при вычислении косинусного сходства:', error);
    return 0;
  }
}

// Поиск top-N релевантных chunks
function findRelevantChunks(queryEmbedding, topN = 5) {
  if (!knowledgeLoaded) {
    console.log('База знаний не загружена, пытаемся загрузить...');
    loadKnowledgeBase();
  }
  
  if (knowledgeChunks.length === 0) {
    console.warn('⚠️ База знаний пуста, возвращаем пустой результат');
    return [];
  }
  
  try {
    console.log(`Поиск ${topN} релевантных фрагментов в базе знаний (всего ${knowledgeChunks.length} фрагментов)`);
    
    // Проверка входных данных
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      console.warn('⚠️ Некорректный вектор запроса, используем пустой вектор');
      queryEmbedding = Array(1536).fill(0);
    }
    
    const results = knowledgeChunks
      .map(chunk => ({
        ...chunk,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding || Array(1536).fill(0))
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);
    
    console.log(`✅ Найдено ${results.length} релевантных фрагментов`);
    return results;
  } catch (error) {
    console.error('❌ Ошибка при поиске релевантных фрагментов:', error);
    return [];
  }
}

// Инициализация при импорте
loadKnowledgeBase();

export { loadKnowledgeBase, findRelevantChunks };
