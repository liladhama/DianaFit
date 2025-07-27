// Слой для хранения данных пользователя только в Firestore
import { getFirebaseConfig, validateFirebaseConfig, getUsersCollection } from './firestore-config.js';

let admin = null;
let db = null;
let firestoreAvailable = false;

// Инициализация Firestore
// ...удалено лишнее логирование...
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
  // ...удалено лишнее логирование...
  // ...удалено логирование Firestore...
} catch (e) {
  firestoreAvailable = false;
  console.error('[Firestore] Ошибка инициализации:', e);
  throw new Error('Firestore недоступен. Проверьте переменную окружения FIREBASE_SERVICE_ACCOUNT или локальный файл конфигурации');
}

export async function readUserData(userId) {
  // ОПТИМИЗИРОВАНО: Стандартизируем userId как строку сразу
  userId = String(userId);
  
  if (!firestoreAvailable) {
    throw new Error('Firestore недоступен. Проверьте конфигурацию Firebase');
  }
  
  try {
    const collection = getUsersCollection();
    
    // ОПТИМИЗИРОВАНО: Убираем тройной поиск, ищем только по строковому ID
    const doc = await db.collection(collection).doc(userId).get();
    
    if (doc.exists) {
      const data = doc.data();
      return {
        userId: data.userId,
        isPremium: data.isPremium || false,
        quiz: data.quiz,
        dailyProgress: data.dailyProgress,
        programData: data.programData,
        dialogHistory: data.dialogHistory,
        profileChanges: data.profileChanges,
        planExecution: data.planExecution,
        lastUpdate: data.lastUpdate,
        subscription: data.subscription || {},
        progressHistory: data.progressHistory || []
      };
    }
    
    // Возвращаем базовый объект для нового пользователя
    return { userId, isPremium: false };
  } catch (e) {
    console.error(`❌ [Firestore][readUserData] Ошибка чтения:`, e.message);
    throw e;
  }
}

export async function writeUserData(userId, data) {
  userId = String(userId);
  // ...удалено логирование Firestore...
  // удалено: вывод промежуточных данных
  
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
  
  // удалено: вывод промежуточных данных
  
  try {
    const collection = getUsersCollection();
    // ...удалено логирование Firestore...
    await db.collection(collection).doc(userId).set(saveData, { merge: true });
    // ...удалено логирование Firestore...
  } catch (e) {
    console.error(`[Firestore][writeUserData] ❌ Ошибка записи в Firestore:`, e);
    if (e && e.stack) console.error(e.stack);
    throw e;
  }
}
