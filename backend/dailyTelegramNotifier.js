import cron from 'node-cron';
import fetch from 'node-fetch';
import { readUserData } from './userDataStorage.js';
import admin from 'firebase-admin';
import { getFirebaseConfig } from './firestore-config.js';

console.log('[dailyTelegramNotifier] Модуль загружен, старт инициализации...');

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getFirebaseConfig()),
  });
}
const db = admin.firestore();

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

// Вспомогательная функция для получения всех userId
async function getAllUserIds() {
  const snapshot = await db.collection('Dianafit_users').get();
  const userIds = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const chatId = data.telegramChatId || doc.id;
    if (!chatId) return;
    // Получаем сегодняшнюю дату в формате YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Получаем индекс дня в programData.days
    let dayIndex = null;
    if (data.programData && Array.isArray(data.programData.days)) {
      dayIndex = data.programData.days.findIndex(d => d.date === todayStr);
    }
    const todayDay = dayIndex !== -1 && dayIndex !== null ? data.programData.days[dayIndex] : null;

    // Получаем блюда и калории на сегодня
    let meals = [];
    let totalCalories = 0;
    if (todayDay && Array.isArray(todayDay.meals)) {
      meals = todayDay.meals.map(m => ({ type: m.type, calories: m.calories }));
      totalCalories = todayDay.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    }

    // Получаем тренировку на сегодня
    let workout = '';
    if (todayDay && todayDay.workout && todayDay.isWorkoutDay) {
      workout = todayDay.workout.title || 'Тренировка';
    }

    // Получаем статус выполнения из dailyProgress
    let ate = false;
    let progress = data.dailyProgress && data.dailyProgress[todayStr] ? data.dailyProgress[todayStr] : {};
    if (progress.ate !== undefined) ate = progress.ate;

    userIds.push({
      userId: doc.id,
      chatId,
      todayWorkout: workout,
      calories: totalCalories,
      meals,
      ate
    });
  });
  return userIds;
}

// Основная функция рассылки
async function sendDailyNotifications() {
    const users = await getAllUserIds();
    console.log(`Найдено пользователей для рассылки: ${users.length}`);
    for (const user of users) {
      const tip = getRandomTip();
      let message = `Доброе утро!\n`;
      // Тренировка
      if (user.todayWorkout) {
        message += `\nСегодня тренировка: ${user.todayWorkout}`;
      } else {
        message += `\nСегодня нет тренировки.`;
      }
      // Калории
      message += `\n\nВаша норма калорий: ${user.calories > 0 ? user.calories : 'не указано'} ккал`;
      // Блюда
      if (user.meals && user.meals.length > 0) {
        message += `\n\nПлан питания на сегодня:`;
        user.meals.forEach(m => {
          message += `\n- ${m.type}: ${m.calories} ккал`;
        });
      }
      // Статус выполнения
      if (user.ate === true) {
        message += `\n\nВы уже отметили прием пищи сегодня!`;
      } else if (user.ate === false) {
        message += `\n\nНе забудьте отметить прием пищи!`;
      }
      // Совет
      message += `\n\n${tip}`;
      try {
        const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
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

  console.log('[dailyTelegramNotifier] Инициализация завершена успешно');

export default sendDailyNotifications;