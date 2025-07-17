// API endpoint для получения индивидуального калоража с фронта и сохранения в Firestore
import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

router.post('/api/user/calories', async (req, res) => {
  console.log('[CaloriesApi] POST /api/user/calories', req.body);
  const { userId, caloriesNorm } = req.body;
  if (!userId || !caloriesNorm) {
    console.log('[CaloriesApi] Не хватает userId или caloriesNorm');
    return res.status(400).json({ error: 'userId и caloriesNorm обязательны' });
  }
  try {
    const db = admin.firestore();
    await db.collection('Dianafit_users').doc(userId).set({
      quiz: { calories: caloriesNorm }
    }, { merge: true });
    console.log('[CaloriesApi] Calories записан для userId:', userId, 'calories:', caloriesNorm);
    res.json({ success: true });
  } catch (e) {
    console.error('Ошибка сохранения калоража:', e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
