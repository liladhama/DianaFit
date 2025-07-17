console.log('[dailyTelegramNotifier] Модуль загружен, старт инициализации...');
try {
console.log('[dailyTelegramNotifier] Модуль загружен, инициализация...');
try {
// Ежедневная рассылка персональных уведомлений в Telegram
import cron from 'node-cron';
import fetch from 'node-fetch';
import { readUserData } from './userDataStorage.js';
import admin from 'firebase-admin';
import { getFirebaseConfig } from './firestore-config.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Генерация уникального совета по питанию
const nutritionTips = [
  'Добавьте больше овощей в рацион!',
  'Пейте достаточно воды сегодня!',
  'Старайтесь не пропускать завтрак!',
  'Сделайте акцент на белках в каждом приеме пищи!',
  'Ограничьте быстрые углеводы — больше клетчатки!'
];

function getRandomTip() {
  return nutritionTips[Math.floor(Math.random() * nutritionTips.length)];
}

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getFirebaseConfig()),
  });
}
const db = admin.firestore();

// Основная функция рассылки
async function sendDailyNotifications() {
  const users = await getAllUserIds();
  console.log(`Найдено пользователей для рассылки: ${users.length}`);
  for (const user of users) {
    const tip = getRandomTip();
    const workout = user.todayWorkout || 'Пройдите 10 000 шагов';
    const calories = user.calories;
    const message = `Доброе утро!\n\nСегодня: ${workout}\n\nВаша норма калорий: ${calories} ккал\n${tip}`;
    try {
      const response = await fetch(TELEGRAM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.chatId,
          text: message
        })
      });
      const result = await response.json();
      if (result.ok) {
        console.log(`Успешно: сообщение отправлено пользователю ${user.userId} (chatId: ${user.chatId})`);
      } else {
        console.error(`Ошибка Telegram API для пользователя ${user.userId} (chatId: ${user.chatId}):`, result);
      }
    } catch (err) {
      console.error(`Ошибка отправки сообщения пользователю ${user.userId} (chatId: ${user.chatId}):`, err);
    }
  }
}

// Запускать каждую минуту для теста
cron.schedule('* * * * *', () => {
  console.log('ТЕСТ: Запуск рассылки каждую минуту...');
  sendDailyNotifications().then(() => {
    console.log('Рассылка завершена!');
  }).catch(err => {
    console.error('Ошибка рассылки:', err);
  });
});
} catch (err) {
  console.error('[dailyTelegramNotifier] Глобальная ошибка инициализации:', err);
}
} catch (err) {
  console.error('[dailyTelegramNotifier] Глобальная ошибка инициализации:', err);
}

// Для ручного теста
// sendDailyNotifications();

// Вспомогательная функция для получения всех userId
async function getAllUserIds() {
  const snapshot = await db.collection('Dianafit_users').get();
  const userIds = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.telegramChatId) {
      userIds.push({
        userId: doc.id,
        chatId: data.telegramChatId,
        todayWorkout: data.todayWorkout || '',
        calories: data.nutrition?.calories || 1800
      });
    }
  });
  return userIds;
}

export default sendDailyNotifications;
