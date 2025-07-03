import sys
import io
import json
import os
import openai
import faiss
import numpy as np
import argparse

# Установка кодировки stdout в utf-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Укажите свой OpenAI API ключ
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or "sk-..."
openai.api_key = OPENAI_API_KEY

FAISS_INDEX_PATH = "kb_faiss.index"
META_PATH = "kb_meta.jsonl"
EMBEDDING_MODEL = "text-embedding-3-small"
GPT_MODEL = "gpt-3.5-turbo"
TOP_K = 10  # увеличено для большего контекста

parser = argparse.ArgumentParser()
parser.add_argument('question', nargs='?', default=None)
parser.add_argument('--plan', action='store_true', help='Генерировать недельный план')
args = parser.parse_args()

if args.plan:
    # Генерация недельного плана на основе embedding профиля
    profile = json.loads(args.question)
    # Получаем embedding профиля (конкатенируем ответы)
    profile_text = '\n'.join([f"{k}: {v}" for k, v in profile.items()])
    emb = openai.embeddings.create(
        input=profile_text,
        model=EMBEDDING_MODEL
    ).data[0].embedding
    # Загружаем FAISS-индекс и метаинформацию
    index = faiss.read_index(FAISS_INDEX_PATH)
    meta = []
    with open(META_PATH, "r", encoding="utf-8") as f:
        for line in f:
            meta.append(json.loads(line))
    D, I = index.search(np.array([emb]).astype("float32"), TOP_K)
    retrieved = [meta[i] for i in I[0]]
    # Ограничиваем длину контекста
    max_context_len = 12000
    context = ""
    for chunk in retrieved:
        if len(context) + len(chunk["text"]) > max_context_len:
            break
        context += chunk["text"] + "\n---\n"
    # Формируем prompt для генерации плана
    plan_prompt = (
        "Ты — Диана, эксперт по похудению. На основе приведённых материалов и профиля пользователя сгенерируй подробный персональный план похудения на неделю.\n"
        "План должен быть в формате JSON: массив дней недели, для каждого дня — меню (завтрак, обед, ужин с рецептами и количеством продуктов), тренировка (название, упражнения, подходы, советы), рекомендации.\n"
        "Говори в своём стиле, но строго соблюдай формат JSON.\n"
        f"Профиль пользователя:\n{profile_text}\n\nМатериалы:\n{context}\n\nПлан:"
    )
    response = openai.chat.completions.create(
        model=GPT_MODEL,
        messages=[{"role": "user", "content": plan_prompt}],
        temperature=0.2,
        max_tokens=1500
    )
    plan_text = response.choices[0].message.content.strip()
    # Пытаемся распарсить JSON из ответа
    try:
        plan_json = json.loads(plan_text)
        print(json.dumps(plan_json, ensure_ascii=False))
    except Exception:
        # Если невалидный JSON — возвращаем как есть
        print(json.dumps({"days": [], "raw": plan_text}, ensure_ascii=False))
    sys.exit(0)

if not args.plan:
    question = args.question if args.question else input("Вопрос: ")

    # Получаем embedding вопроса
    emb = openai.embeddings.create(
        input=question,
        model=EMBEDDING_MODEL
    ).data[0].embedding

    # Загружаем FAISS-индекс
    index = faiss.read_index(FAISS_INDEX_PATH)

    # Загружаем метаинформацию
    meta = []
    with open(META_PATH, "r", encoding="utf-8") as f:
        for line in f:
            meta.append(json.loads(line))

    # Ищем похожие чанки
    D, I = index.search(np.array([emb]).astype("float32"), TOP_K)
    retrieved = [meta[i] for i in I[0]]

    # Ограничиваем суммарную длину контекста для prompt, чтобы не превышать лимит модели GPT
    max_context_len = 12000  # символов
    context = ""
    for chunk in retrieved:
        if len(context) + len(chunk["text"]) > max_context_len:
            break
        context += chunk["text"] + "\n---\n"

    # Формируем prompt для GPT
    prompt = (
        "Ты — Диана, эксперт по похудению. Отвечай только на основе приведённых материалов, говори в своём стиле.\n"
        "Если вопрос про еду, обязательно дай подробный рецепт или пример меню, укажи продукты, количество и способ приготовления.\n"
        "Если в материалах есть конкретные блюда или рецепты — обязательно приведи их полностью, с ингредиентами и пошаговым описанием приготовления.\n"
        "Если можешь — добавь советы по питанию и объясни, почему этот завтрак полезен для похудения.\n\n"
        f"Материалы:\n{context}\n\nВопрос: {question}\n\nОтвет:"
    )

    # Получаем ответ от GPT
    response = openai.chat.completions.create(
        model=GPT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=512
    )
    answer = response.choices[0].message.content.strip()

    print(answer)
