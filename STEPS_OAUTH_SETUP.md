# Настройка OAuth для получения данных о шагах

## Обзор
Приложение DianaFit теперь поддерживает автоматический подсчет шагов через OAuth авторизацию с Google Fit API (Android) и Apple HealthKit (iOS).

## Функциональность

### ✅ Что работает:
- **Автоматический запрос разрешений** - при открытии приложения пользователю предлагается дать разрешение
- **Google Fit интеграция** - для Android устройств через Google Fit API
- **iOS поддержка** - базовая интеграция с датчиками движения iOS
- **Веб-браузер поддержка** - ограниченная функциональность через Web API
- **Кэширование данных** - локальное сохранение данных о шагах
- **Автоматическое обновление** - синхронизация каждые 5 минут
- **Диагностические функции** - отладка в консоли браузера

### 🔧 Как это работает:

1. **При первом запуске**:
   - Проверяется наличие сохраненных разрешений
   - Если разрешений нет, показывается информационное сообщение
   - Пользователь может нажать "Разрешить доступ к шагам"

2. **Модал авторизации**:
   - Определяет платформу пользователя (Android/iOS/Web)
   - Запрашивает соответствующие разрешения
   - Сохраняет токены авторизации в localStorage

3. **Получение данных**:
   - **Android**: Через Google Fit API
   - **iOS**: Через датчики движения и HealthKit
   - **Web**: Через Web Sensors API (ограниченно)

4. **Автоматическая синхронизация**:
   - Данные обновляются каждые 5 минут
   - Кэширование предотвращает лишние запросы
   - Старые данные очищаются автоматически

## Настройка Google Fit API

### 1. Создание проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Fitness API:
   - Перейдите в "APIs & Services" > "Library"
   - Найдите "Fitness API" и включите его

### 2. Настройка OAuth consent screen

1. Перейдите в "APIs & Services" > "OAuth consent screen"
2. Выберите "External" и нажмите "Create"
3. Заполните обязательные поля:
   - App name: "DianaFit"
   - User support email: ваш email
   - Developer contact information: ваш email
4. Добавьте scopes:
   - `https://www.googleapis.com/auth/fitness.activity.read`
   - `https://www.googleapis.com/auth/fitness.body.read`

### 3. Создание OAuth 2.0 credentials

1. Перейдите в "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
3. Выберите "Web application"
4. Добавьте authorized origins:
   - `http://localhost:3000` (для разработки)
   - `https://yourdomain.com` (для production)
5. Скопируйте Client ID

### 4. Создание API Key

1. В том же разделе "Credentials"
2. Нажмите "Create Credentials" > "API Key"
3. Ограничьте API Key:
   - Application restrictions: HTTP referrers
   - API restrictions: Google Fitness API
4. Скопируйте API Key

### 5. Обновление переменных окружения

Обновите файл `frontend/.env`:

```env
REACT_APP_GOOGLE_API_KEY=ваш_api_key
REACT_APP_GOOGLE_CLIENT_ID=ваш_client_id
```

## Отладка

### Консольные команды для диагностики:

```javascript
// Диагностика всех компонентов шагомера
diagnoseStepCounter()

// Очистка всех данных о шагах
clearStepsData()

// Принудительный запрос разрешений
requestStepsPermission()

// Проверка программ в localStorage
checkPrograms()
```

### Типичные проблемы:

1. **"Пользователь отклонил авторизацию"**
   - Пользователь нажал "Отменить" в OAuth диалоге
   - Решение: повторный запрос разрешений

2. **"Google API не инициализирован"**
   - Неправильные ключи в .env файле
   - Решение: проверить API Key и Client ID

3. **"Не удалось загрузить Google API"**
   - Проблемы с сетью или блокировка скриптов
   - Решение: проверить интернет-соединение

## Безопасность

- **Токены хранятся локально** в localStorage
- **Автоматическая очистка** истекших токенов
- **Минимальные разрешения** - только чтение активности
- **Соответствие GDPR** - пользователь может отозвать разрешения

## Поддерживаемые платформы

| Платформа | Метод | Точность | Статус |
|-----------|-------|----------|--------|
| Android | Google Fit API | Высокая | ✅ Полностью |
| iOS | HealthKit + датчики | Средняя | ⚠️ Базовая |
| Web Desktop | Web Sensors | Низкая | ⚠️ Ограниченная |
| Telegram WebApp | Future API | Высокая | 🔮 Планируется |

## Будущие улучшения

- [ ] Интеграция с Apple HealthKit через WebView
- [ ] Поддержка Samsung Health API
- [ ] Интеграция с фитнес-браслетами (Fitbit, Garmin)
- [ ] Поддержка Telegram WebApp Health API (когда появится)
- [ ] Более точные алгоритмы подсчета шагов для веб-браузеров
