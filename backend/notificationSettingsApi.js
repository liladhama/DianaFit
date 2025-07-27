// API endpoint для сохранения настроек уведомлений пользователя (timezone, notifyHour)
import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

router.post('/api/user/notification-settings', async (req, res) => {
  let { userId, timezone, notifyHour } = req.body;
  userId = String(userId);
  
  console.log('🔧 [NotificationSettingsApi] Получен запрос:', { userId, timezone, notifyHour, typeOfNotifyHour: typeof notifyHour });
  
  if (!userId || !timezone || typeof notifyHour !== 'number') {
    console.log('❌ [NotificationSettingsApi] Ошибка валидации:', { 
      userIdMissing: !userId, 
      timezoneMissing: !timezone, 
      notifyHourInvalid: typeof notifyHour !== 'number',
      notifyHourValue: notifyHour,
      notifyHourType: typeof notifyHour
    });
    return res.status(400).json({ error: 'userId, timezone и notifyHour обязательны' });
  }
  try {
    const db = admin.firestore();
    const userRef = db.collection('Dianafit_users').doc(userId);
    const userDoc = await userRef.get();
    let quiz = {};
    if (userDoc.exists && userDoc.data().quiz) {
      quiz = userDoc.data().quiz;
      console.log('[NotificationSettingsApi] Текущий quiz:', quiz);
    } else {
      console.log('[NotificationSettingsApi] Документ пользователя не найден или quiz отсутствует');
    }
    // Обновляем только нужные поля
    quiz.timezone = timezone;
    quiz.notifyHour = notifyHour;
    console.log('[NotificationSettingsApi] Обновленный quiz:', quiz);
    await userRef.set({ quiz }, { merge: true });
    console.log('[NotificationSettingsApi] Настройки уведомлений успешно сохранены для userId:', userId);
    res.json({ success: true });
  } catch (e) {
    console.error('[NotificationSettingsApi] Ошибка сохранения настроек уведомлений:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
