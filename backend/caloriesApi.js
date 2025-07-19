// API endpoint для получения индивидуального калоража с фронта и сохранения в Firestore
import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

router.post('/api/user/calories', async (req, res) => {
  let { userId, caloriesNorm, timezone } = req.body;
  userId = String(userId);
  if (!userId || !caloriesNorm) {
    return res.status(400).json({ error: 'userId и caloriesNorm обязательны' });
  }
  try {
    const db = admin.firestore();
    const userRef = db.collection('Dianafit_users').doc(userId);
    const userDoc = await userRef.get();
    let quiz = {};
    if (userDoc.exists && userDoc.data().quiz) {
      quiz = userDoc.data().quiz;
    }
    quiz.calories = caloriesNorm;
    if (timezone) quiz.timezone = timezone;
    await userRef.set({ quiz }, { merge: true });
    res.json({ success: true });
  } catch (e) {
    console.error('Ошибка сохранения калоража:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
