// Слой для хранения данных пользователя только в Firestore
import { getFirebaseConfig, validateFirebaseConfig, getUsersCollection } from './firestore-config.js';

let admin = null;
let db = null;
let firestoreAvailable = false;

// Инициализация Firestore
console.log('[Firestore] Попытка инициализации...');
try {
  admin = await import('firebase-admin');
  const adm = admin.default;
  
  // Получаем конфигурацию Firebase
  const serviceAccount = getFirebaseConfig();
  
  // Валидируем конфигурацию
  validateFirebaseConfig(serviceAccount);
  
  if (!adm.apps.length) {
    adm.initializeApp({
      credential: adm.credential.cert(serviceAccount)
    });
  }
  
  db = adm.firestore();
  firestoreAvailable = true;
  console.log('[Firestore] Firestore успешно инициализирован');
  console.log('[Firestore] Проект:', serviceAccount.project_id);
  console.log('[Firestore] Коллекция пользователей:', getUsersCollection());
} catch (e) {
  firestoreAvailable = false;
  console.error('[Firestore] Ошибка инициализации:', e);
  throw new Error('Firestore недоступен. Проверьте переменную окружения FIREBASE_SERVICE_ACCOUNT или локальный файл конфигурации');
}

export async function readUserData(userId) {
  console.log(`[Firestore][readUserData] Попытка чтения данных для userId: ${userId}`);
  
  if (!firestoreAvailable) {
    throw new Error('Firestore недоступен. Проверьте конфигурацию Firebase');
  }
  
  try {
    const collection = getUsersCollection();
    console.log(`[Firestore][readUserData] Читаем из коллекции: ${collection}/${userId}`);
    const doc = await db.collection(collection).doc(userId).get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log(`[Firestore][readUserData] ✅ Документ найден в Firestore:`, {
        userId: data.userId,
        isPremium: data.isPremium || false,
        hasQuiz: !!data.quiz,
        hasDailyProgress: !!data.dailyProgress,
        hasProgramData: !!data.programData,
        hasDialogHistory: !!data.dialogHistory,
        hasProfileChanges: !!data.profileChanges,
        hasPlanExecution: !!data.planExecution,
        lastUpdate: data.lastUpdate
      });
      return {
        userId: data.userId,
        isPremium: data.isPremium || false,
        quiz: data.quiz,
        dailyProgress: data.dailyProgress,
        programData: data.programData,
        dialogHistory: data.dialogHistory,
        profileChanges: data.profileChanges,
        planExecution: data.planExecution,
        lastUpdate: data.lastUpdate
       ,subscription: data.subscription || {}
      };
    }
    
    console.log(`[Firestore][readUserData] Документ не найден в Firestore: userId=${userId}, создаем новый`);
    return { userId, isPremium: false };
  } catch (e) {
    console.error(`[Firestore][readUserData] ❌ Ошибка чтения из Firestore:`, e);
    throw e;
  }
}

export async function writeUserData(userId, data) {
  console.log(`[Firestore][writeUserData] Начинаем сохранение данных для userId: ${userId}`);
  console.log(`[Firestore][writeUserData] Данные для сохранения:`, {
    userId: data.userId,
    isPremium: data.isPremium || false,
    hasQuiz: !!data.quiz,
    hasDailyProgress: !!data.dailyProgress,
    hasProgramData: !!data.programData,
    hasDialogHistory: !!data.dialogHistory,
    hasProfileChanges: !!data.profileChanges,
    hasPlanExecution: !!data.planExecution
  });
  
  if (!firestoreAvailable) {
    throw new Error('Firestore недоступен. Проверьте конфигурацию Firebase');
  }
  
  // Очищаем объект от undefined
  function clean(obj) {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj[key] === undefined) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          clean(obj[key]);
        }
      }
    }
    return obj;
  }
  
  const saveData = clean({
    userId: data.userId,
    isPremium: data.isPremium || false,
    quiz: data.quiz,
    dailyProgress: data.dailyProgress,
    programData: data.programData,
    dialogHistory: data.dialogHistory,
    profileChanges: data.profileChanges,
    planExecution: data.planExecution,
    subscription: data.subscription,
    lastUpdate: new Date().toISOString()
  });
  
  console.log(`[Firestore][writeUserData] Очищенные данные для сохранения:`, {
    userId: saveData.userId,
    isPremium: saveData.isPremium,
    hasQuiz: !!saveData.quiz,
    hasDailyProgress: !!saveData.dailyProgress,
    hasProgramData: !!saveData.programData,
    hasDialogHistory: !!saveData.dialogHistory,
    hasProfileChanges: !!saveData.profileChanges,
    hasPlanExecution: !!saveData.planExecution,
    lastUpdate: saveData.lastUpdate
  });
  
  try {
    const collection = getUsersCollection();
    console.log(`[Firestore][writeUserData] Сохраняем в коллекцию: ${collection}/${userId}`);
    await db.collection(collection).doc(userId).set(saveData);
    console.log(`[Firestore][writeUserData] ✅ Данные успешно сохранены в Firestore: ${collection}/${userId}`);
  } catch (e) {
    console.error(`[Firestore][writeUserData] ❌ Ошибка записи в Firestore:`, e);
    if (e && e.stack) console.error(e.stack);
    throw e;
  }
}
