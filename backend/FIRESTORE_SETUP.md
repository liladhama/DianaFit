# Настройка Firestore для DianaFit

## Описание

Все данные пользователей теперь хранятся только в Firestore. Локальные файлы больше не используются.

## Настройка

### 1. Переменная окружения (рекомендуется)

Создайте переменную окружения `FIREBASE_SERVICE_ACCOUNT` со значением JSON конфигурации Firebase:

```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"dianafit-432509","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@dianafit-432509.iam.gserviceaccount.com","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40dianafit-432509.iam.gserviceaccount.com"}
```

### 2. Локальный файл (fallback)

Если переменная окружения не задана, система будет использовать файл `dianafit-firebase-adminsdk-fbsvc-7953c18efc.json` в папке backend.

**Вставьте ваш JSON ключ от Firebase в этот файл.**

## Структура данных

Данные пользователей хранятся в коллекции `Dianafit_users` в Firestore:

```
Dianafit_users/
  ├── {userId}/
  │   ├── userId: string
  │   ├── isPremium: boolean
  │   ├── quiz: object
  │   ├── dailyProgress: object
  │   ├── programData: object
  │   ├── dialogHistory: array
  │   ├── profileChanges: object
  │   ├── planExecution: object
  │   └── lastUpdate: string (ISO date)
```

## Файлы системы

- `userDataStorage.js` - основной файл для работы с данными пользователей
- `firestore-config.js` - конфигурация и валидация Firebase
- `dianafit-firebase-adminsdk-fbsvc-7953c18efc.json` - локальный файл конфигурации Firebase
- `.env.example` - пример переменных окружения

## Важные изменения

1. **Только Firestore**: Все данные теперь хранятся только в Firestore
2. **Нет локальных файлов**: Система не создает локальные файлы пользователей
3. **Обязательная конфигурация**: Firestore должен быть настроен, иначе приложение не запустится
4. **Переменная окружения**: Приоритет отдается переменной окружения `FIREBASE_SERVICE_ACCOUNT`

## Отладка

Все логи системы имеют префикс `[Firestore]`. Следите за ними для диагностики проблем:

```
[Firestore] Попытка инициализации...
[Firestore] Firestore успешно инициализирован
[Firestore] Проект: dianafit-432509
[Firestore] Коллекция пользователей: Dianafit_users
```

## Безопасность

- Никогда не коммитьте файл с реальными ключами Firebase в git
- Используйте переменные окружения для продакшена
- Локальный файл только для разработки
