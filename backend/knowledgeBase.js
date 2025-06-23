import fs from 'fs';

let knowledgeChunks = [];

// Загрузка базы при старте
function loadKnowledgeBase() {
  const filePath = './backend/knowledge_base_chunks.jsonl';
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  knowledgeChunks = lines.map(line => JSON.parse(line));
}

// Косинусное сходство
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

// Поиск top-N релевантных chunks
function findRelevantChunks(queryEmbedding, topN = 5) {
  return knowledgeChunks
    .map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

export { loadKnowledgeBase, findRelevantChunks };
