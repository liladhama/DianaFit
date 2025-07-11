FROM node:20.18.0-slim
WORKDIR /app
COPY . .
# Установить зависимости для корня (если есть package.json)
RUN if [ -f package.json ]; then npm ci || true; fi
# Установить зависимости для backend
WORKDIR /app/backend
RUN if [ -f package.json ]; then npm install; fi
# Собрать фронт (если нужен SSR или статика)
WORKDIR /app/frontend
RUN if [ -f package.json ]; then npm install && npm run build || true; fi
# Вернуться в корень
WORKDIR /app
# Запуск backend (замени на свой стартовый скрипт, если другой)
CMD ["node", "backend/index.js"]
