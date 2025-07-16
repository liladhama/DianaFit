# DianaFit - Универсальная система хранения данных

## Описание

DianaFit теперь поддерживает универсальную систему хранения данных:
- **Локальное тестирование**: данные сохраняются в файлы в папке `backup_files/users/`
- **Продакшн**: данные сохраняются в Firestore

## Запуск локально

### Вариант 1: Использование батника
```bash
# Запуск в локальном режиме
start-local.bat

# Запуск в продакшн режиме
start-production.bat
```

### Вариант 2: Использование npm скриптов
```bash
# Локальная разработка
npm run local

# Продакшн режим
npm run production

# Тестирование локально
npm run test-local
```

### Вариант 3: Прямой запуск с переменными окружения
```bash
# Локальное тестирование
NODE_ENV=development USE_LOCAL_STORAGE=true FORCE_LOCAL_FILES=true node index.js

# Продакшн
NODE_ENV=production USE_LOCAL_STORAGE=false node index.js
```

## Конфигурация

### Переменные окружения

- `NODE_ENV`: `development` для локального режима, `production` для продакшн
- `USE_LOCAL_STORAGE`: `true` для использования локальных файлов
- `FORCE_LOCAL_FILES`: `true` для принудительного использования файлов (игнорирует Firestore)
- `PORT`: порт сервера (по умолчанию 3001)

### Автоматическое определение режима

Система автоматически определяет режим работы:
- **Локальный режим**: когда `NODE_ENV=development` или `USE_LOCAL_STORAGE=true`
- **Продакшн режим**: когда `NODE_ENV=production` и есть доступ к Firestore

## Структура хранения данных

### Локальные файлы
```
backend/
├── backup_files/
│   └── users/
│       ├── 123456789.json    # Данные пользователя
│       ├── 987654321.json
│       └── ...
```

### Firestore
```
Dianafit_users/
├── 123456789/               # Документ пользователя
├── 987654321/
└── ...
```

## Логи и отладка

Система выводит подробные логи о том, какое хранилище используется:

```
🔧 Backend Configuration:
📍 Environment: LOCAL
💾 Storage: LOCAL FILES
🌐 API Base URL: http://localhost:3001
📁 Local Storage Path: C:\Users\user\Desktop\DianaFit\backend\backup_files\users
```

## Frontend конфигурация

Frontend автоматически определяет API URL:
- `localhost` → `http://localhost:3001`
- Остальные домены → `https://dianafit.onrender.com`

## Универсальность

Репозиторий теперь универсален:
- Разработчики могут тестировать локально с файлами
- Продакшн использует Firestore для масштабируемости
- Автоматическое переключение между режимами
- Fallback механизм: если Firestore недоступен, используются локальные файлы
