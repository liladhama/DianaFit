// API endpoint для сохранения настроек уведомлений пользователя (timezone, notifyHour)
import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

router.post('/api/user/notification-settings', async (req, res) => {
  const { userId, timezone, notifyHour } = req.body;
  if (!userId || !timezone || typeof notifyHour !== 'number') {
    return res.status(400).json({ error: 'userId, timezone и notifyHour обязательны' });
  }
  try {
    const db = admin.firestore();
    await db.collection('Dianafit_users').doc(userId).set({
      quiz: {
        timezone,
        notifyHour
      }
    }, { merge: true });
    res.json({ success: true });
  } catch (e) {
    console.error('Ошибка сохранения настроек уведомлений:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
