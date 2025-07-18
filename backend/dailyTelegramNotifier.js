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

    // Получаем блюда на сегодня
    let meals = [];
    if (todayDay && Array.isArray(todayDay.meals)) {
      meals = todayDay.meals.map(m => ({ type: m.type, calories: m.calories }));
    }

    // Получаем индивидуальную норму калорий
    // Берём калории только из quiz.calories
    let userCalories = null;
    if (data.quiz && typeof data.quiz.calories === 'number') {
      userCalories = data.quiz.calories;
    }

    // Получаем тренировку на сегодня и упражнения
    let workout = '';
    let workoutExercises = [];
    if (todayDay && todayDay.workout && todayDay.isWorkoutDay) {
      workout = todayDay.workout.title || 'Тренировка';
      if (Array.isArray(todayDay.workout.exercises)) {
        workoutExercises = todayDay.workout.exercises.map(ex => ex.name).filter(Boolean);
      }
    }

    // Получаем статус выполнения из dailyProgress
    let ate = false;
    let progress = data.dailyProgress && data.dailyProgress[todayStr] ? data.dailyProgress[todayStr] : {};
    if (progress.ate !== undefined) ate = progress.ate;

    userIds.push({
      userId: doc.id,
      chatId,
      todayWorkout: workout,
      workoutExercises,
      calories: userCalories
    });
      // Форматирование для Telegram Markdown
      let message = `*Доброе утро!* ☀️\n\n`;
      message += `---\n`;
      // Тренировка
      if (user.todayWorkout) {
        message += `*### Тренировка:* _${user.todayWorkout}_\n`;
        if (user.workoutExercises && user.workoutExercises.length > 0) {
          message += `\n*Упражнения:*`;
          user.workoutExercises.forEach((ex, idx) => {
            message += `\n${idx + 1}. _${ex}_`;
          });
        }
      } else {
        message += `Сегодня нет тренировки.`;
      }
      message += `\n---`;
      // Калории
      const round10 = n => Math.round(n / 10) * 10;
      message += `\n*### Калорийность:* _${user.calories > 0 ? round10(user.calories) : 'не указано'} ккал_`;
      message += `\n---`;
      // Разбивка калорий по приемам пищи (25/10/35/10/20)
      if (user.calories > 0) {
        const portions = [
          { type: 'Завтрак', percent: 0.25 },
          { type: 'Перекус', percent: 0.10 },
          { type: 'Обед', percent: 0.35 },
          { type: 'Полдник', percent: 0.10 },
          { type: 'Ужин', percent: 0.20 }
        ];
        message += `\n*### План питания на сегодня:*`;
        portions.forEach(p => {
          const kcal = round10(user.calories * p.percent);
          message += `\n- *${p.type}:* _${kcal} ккал_`;
        });
      }
      message += `\n---`;
      // Статус выполнения и напоминания
      let quote = '';
      if (user.ate === true) {
        quote += `> _Вы уже отметили выполнение тренировок и приём пищи!_ ✅`;
      } else {
        quote += `> _Не забудьте отметить выполнение тренировок и приём пищи!_ ✅`;
      }
      quote += `\n> _Постарайтесь пройти *10 000 шагов* сегодня!_ 🚶‍♀️🚶‍♂️`;
      quote += `\n> _${tip}_ 🥦🥕`;
    for (const user of users) {
      const tz = user.timezone || 'Europe/Moscow';
      const hour = typeof user.notifyHour === 'number' ? user.notifyHour : 9;
      const nowTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      // Проверяем, что сейчас notifyHour:00 по timezone пользователя
      // if (nowTz.getHours() !== hour || nowTz.getMinutes() !== 0) {
      //   continue;
      // }
      const tip = getRandomTip();
      // Форматирование для Telegram Markdown
      let message = `*Доброе утро!* ☀️\n\n`;
      message += `---\n`;
      // Тренировка
      if (user.todayWorkout) {
        message += `*### Тренировка:* _${user.todayWorkout}_\n`;
        if (user.workoutExercises && user.workoutExercises.length > 0) {
          message += `\n*Упражнения:*`;
          user.workoutExercises.forEach((ex, idx) => {
            message += `\n${idx + 1}. _${ex}_`;
          });
        }
      } else {
        message += `Сегодня нет тренировки.`;
      }
      message += `\n---`;
      // Калории
      const round10 = n => Math.round(n / 10) * 10;
      message += `\n*### Калорийность:* _${user.calories > 0 ? round10(user.calories) : 'не указано'} ккал_`;
      message += `\n---`;
      // Разбивка калорий по приемам пищи (25/10/35/10/20)
      if (user.calories > 0) {
        const portions = [
          { type: 'Завтрак', percent: 0.25 },
          { type: 'Перекус', percent: 0.10 },
          { type: 'Обед', percent: 0.35 },
          { type: 'Полдник', percent: 0.10 },
          { type: 'Ужин', percent: 0.20 }
        ];
        message += `\n*### План питания на сегодня:*`;
        portions.forEach(p => {
          const kcal = round10(user.calories * p.percent);
          message += `\n- *${p.type}:* _${kcal} ккал_`;
        });
      }
      message += `\n---`;
      // Статус выполнения и напоминания
      let quote = '';
      if (user.ate === true) {
        quote += `> _Вы уже отметили выполнение тренировок и приём пищи!_ ✅`;
      } else {
        quote += `> _Не забудьте отметить выполнение тренировок и приём пищи!_ ✅`;
      }
      quote += `\n> _Постарайтесь пройти *10 000 шагов* сегодня!_ 🚶‍♀️🚶‍♂️`;
      quote += `\n> _${tip}_ 🥦🥕`;
      message += `\n${quote}`;

      try {
        console.log(`[Рассылка] Отправка сообщения пользователю ${user.userId} (chatId: ${user.chatId})`);
        console.log('[Рассылка] Текст сообщения:', message);
        const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.chatId,
            text: message,
            parse_mode: 'Markdown'
          })
        });
        const result = await response.json();
        console.log('[Рассылка] Ответ Telegram API:', result);
        if (!result.ok) {
          console.error(`[Рассылка] Ошибка Telegram API для пользователя ${user.userId} (chatId: ${user.chatId}):`, result);
        }
      } catch (err) {
        console.error(`[Рассылка] Ошибка отправки сообщения пользователю ${user.userId} (chatId: ${user.chatId}):`, err);
      