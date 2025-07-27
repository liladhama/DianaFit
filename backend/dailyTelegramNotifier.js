import cron from 'node-cron';
import fetch from 'node-fetch';
import { readUserData } from './userDataStorage.js';
import admin from 'firebase-admin';
import { getFirebaseConfig } from './firestore-config.js';


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

// ОПТИМИЗИРОВАННАЯ вспомогательная функция для получения пользователей по времени
async function getUsersForCurrentHour() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // ОПТИМИЗАЦИЯ: Рассылаем только в :00 минут каждого часа
  if (currentMinute !== 0) {
    return [];
  }
  
  // ОПТИМИЗАЦИЯ: Создаем Map для быстрого доступа к пользователям
  const snapshot = await db.collection('Dianafit_users').get();
  const usersToNotify = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const chatId = data.telegramChatId || doc.id;
    if (!chatId) return;
    
    // ОПТИМИЗАЦИЯ: Сначала проверяем время - если не подходит, пропускаем все остальные вычисления
    const timezone = data.quiz?.timezone || 'Europe/Moscow';
    const notifyHour = typeof data.quiz?.notifyHour === 'number' ? data.quiz.notifyHour : 9;
    
    try {
      const nowTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      if (nowTz.getHours() !== notifyHour) {
        return; // Пропускаем пользователя - не его время
      }
    } catch (e) {
      // Некорректный timezone - используем дефолтный час
      if (currentHour !== notifyHour) {
        return;
      }
    }
    
    // ОПТИМИЗАЦИЯ: Только если время подходит - делаем вычисления
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

    usersToNotify.push({
      userId: doc.id,
      chatId,
      todayWorkout: workout,
      workoutExercises,
      calories: userCalories,
      meals,
      ate,
      timezone,
      notifyHour
    });
  });
  
  return usersToNotify;
}

// ОПТИМИЗИРОВАННАЯ основная функция рассылки
async function sendDailyNotifications() {
    // ОПТИМИЗАЦИЯ: Получаем только пользователей, которым нужно отправить уведомления СЕЙЧАС
    const users = await getUsersForCurrentHour();
    
    if (users.length === 0) {
        return; // Нет пользователей для уведомления в данный час
    }
    
    console.log(`📱 [Notifications] Отправка уведомлений ${users.length} пользователям`);
    
    for (const user of users) {
      const tip = getRandomTip();
      const round10 = n => Math.round(n / 10) * 10;
      let message = '';
      message += `*Доброе утро!* ☀️\n\n`;
      // Тренировка
      message += `*Тренировка:*`;
      if (user.todayWorkout) {
        message += ` _${user.todayWorkout}_\n`;
        if (user.workoutExercises && user.workoutExercises.length > 0) {
          message += `\n*Упражнения:*`;
          user.workoutExercises.forEach((ex, idx) => {
            message += `\n${idx + 1}. _${ex}_`;
          });
        }
      } else {
        message += ` Сегодня нет тренировки.\n`;
      }
      message += `\n\n`;
      // Калории
      message += `*Калорийность:* _${user.calories > 0 ? round10(user.calories) : 'не указано'} ккал_`;
      message += `\n\n`;
      // План питания
      message += `*План питания на сегодня:*`;
      if (user.calories > 0) {
        const portions = [
          { type: 'Завтрак', percent: 0.25 },
          { type: 'Перекус', percent: 0.10 },
          { type: 'Обед', percent: 0.35 },
          { type: 'Полдник', percent: 0.10 },
          { type: 'Ужин', percent: 0.20 }
        ];
        portions.forEach(p => {
          const kcal = round10(user.calories * p.percent);
          message += `\n- *${p.type}:* _${kcal} ккал_`;
        });
      }
      message += `\n\n`;
      // Цитата-напоминание (ЛОГИКА СОХРАНЕНА)
      message += `> _${user.ate === true ? 'Вы уже отметили выполнение тренировок и приём пищи!' : 'Не забудьте отметить выполнение тренировок и приём пищи!'}_ ✅`;
      message += `\n> _Постарайтесь пройти *10 000 шагов* сегодня!_ 🚶‍♀️🚶‍♂️`;
      message += `\n> _${tip}_ 🥦🥕`;
      
      // ОПТИМИЗАЦИЯ: Добавляем небольшую задержку между отправками
      try {
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
        if (!result.ok) {
          console.error(`❌ [Notifications] Ошибка Telegram API для пользователя ${user.userId}:`, result);
        }
      } catch (err) {
        console.error(`❌ [Notifications] Ошибка отправки сообщения пользователю ${user.userId}:`, err.message);
      }
      
      // ОПТИМИЗАЦИЯ: Небольшая пауза между отправками для избежания rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // ОПТИМИЗИРОВАНО: Запускать каждые 5 минут вместо каждую минуту для снижения нагрузки
  cron.schedule('*/5 * * * *', () => {
    sendDailyNotifications().catch(err => {
      console.error('❌ [Notifications] Ошибка рассылки:', err.message);
    });
  });


export default sendDailyNotifications;