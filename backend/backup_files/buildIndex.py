import json
import os
import openai
import faiss
from tqdm import tqdm
import numpy as np

# Читаем API ключ из .env файла или переменной окружения
def load_api_key():
    # Сначала пробуем переменную окружения
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        return api_key
    
    # Если нет, читаем из .env файла
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('OPENAI_API_KEY='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    
    # Если ключ не найден, запрашиваем у пользователя
    print("OpenAI API ключ не найден!")
    print("1. Установите переменную окружения OPENAI_API_KEY")
    print("2. Или добавьте ключ в файл .env: OPENAI_API_KEY=your_key_here")
    return None

OPENAI_API_KEY = load_api_key()
if not OPENAI_API_KEY:
    print("Ошибка: OpenAI API ключ не найден")
    exit(1)

openai.api_key = OPENAI_API_KEY

CHUNKS_PATH = "knowledge_base_chunks.jsonl"
FAISS_INDEX_PATH = "kb_faiss.index"
META_PATH = "kb_meta.jsonl"
EMBEDDING_MODEL = "text-embedding-3-small"
MAX_TOKENS = 8000  # запас по лимиту

def split_text(text, max_len=8000):
    paragraphs = text.split('\n\n')
    result = []
    current = ""
    for p in paragraphs:
        if len(current) + len(p) < max_len:
            current += ("\n\n" if current else "") + p
        else:
            if current:
                result.append(current)
            if len(p) < max_len:
                current = p
            else:
                for i in range(0, len(p), max_len):
                    result.append(p[i:i+max_len])
                current = ""
    if current:
        result.append(current)
    return result

# Загрузка чанков
chunks = []
with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
    for line in f:
        chunks.append(json.loads(line))

# Генерация эмбеддингов
vectors = []
meta = []
for chunk in tqdm(chunks, desc="Embedding chunks"):
    text = chunk["text"]
    parts = split_text(text, MAX_TOKENS)
    for part in parts:
        response = openai.embeddings.create(
            input=part,
            model=EMBEDDING_MODEL
        )
        vector = response.data[0].embedding
        vectors.append(vector)
        meta.append({"text": part, "source": chunk.get("source", "")})

# Сохраняем FAISS-индекс
vecs_np = np.array(vectors).astype("float32")
index = faiss.IndexFlatL2(vecs_np.shape[1])
index.add(vecs_np)
faiss.write_index(index, FAISS_INDEX_PATH)

# Сохраняем метаинформацию
with open(META_PATH, "w", encoding="utf-8") as f:
    for m in meta:
        f.write(json.dumps(m, ensure_ascii=False) + "\n")

print("Готово! Индекс и метаинформация сохранены.")
