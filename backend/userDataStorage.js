// Универсальный слой для хранения данных пользователя: Firestore или локальный файл
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let admin = null;
let db = null;
let firestoreAvailable = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localDir = path.join(__dirname, 'backup_files', 'users');


// Попытка инициализации Firestore (через переменную окружения или локальный файл)
console.log('[Firestore] Попытка инициализации...');
console.log('[Firestore] FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'есть' : 'нет');
try {
  admin = await import('firebase-admin');
  let serviceAccount;
  const adm = admin.default;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('[Firestore] Используется ключ из переменной окружения');
  } else {
    console.log('[Firestore] Используется локальный файл ключа');
    serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'dianafit-firebase-adminsdk-fbsvc-e8d8736690.json'), 'utf-8'));
  }
  if (!adm.apps.length) {
    adm.initializeApp({
      credential: adm.credential.cert(serviceAccount)
    });
  }
  db = adm.firestore();
  firestoreAvailable = true;
  console.log('[Firestore] Firestore успешно инициализирован');
} catch (e) {
  firestoreAvailable = false;
  console.error('[Firestore] Ошибка инициализации:', e);
}

function getLocalPath(userId) {
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  return path.join(localDir, `${userId}.json`);
}

export async function readUserData(userId) {
  if (firestoreAvailable) {
    try {
      const doc = await db.collection('Dianafit_users').doc(userId).get();
      console.log(`[Firestore][readUserData] Чтение документа: Dianafit_users/${userId}`);
      if (doc.exists) {
        const data = doc.data();
        console.log(`[Firestore][readUserData] Документ найден:`, data);
        return {
          userId: data.userId,
          quiz: data.quiz,
          dailyProgress: data.dailyProgress,
          programData: data.programData,
          lastUpdate: data.lastUpdate
        };
      }
      console.warn(`[Firestore][readUserData] Документ не найден: userId=${userId}`);
      return { userId };
    } catch (e) {
      console.error(`[Firestore][readUserData] Ошибка чтения:`, e);
      // fallback на локальный файл
    }
  }
  // fallback: локальный файл
  const file = getLocalPath(userId);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return {
      userId: data.userId,
      quiz: data.quiz,
      dailyProgress: data.dailyProgress,
      programData: data.programData,
      lastUpdate: data.lastUpdate
    };
  }
  return { userId };
}

export async function writeUserData(userId, data) {
  // Сохраняем только userId, quiz, dailyProgress, programData, lastUpdate
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
    quiz: data.quiz,
    dailyProgress: data.dailyProgress,
    programData: data.programData,
    lastUpdate: new Date().toISOString()
  });
  if (firestoreAvailable) {
    try {
      await db.collection('Dianafit_users').doc(userId).set(saveData);
      console.log(`[Firestore][writeUserData] Данные успешно записаны: Dianafit_users/${userId}`);
      return;
    } catch (e) {
      console.error(`[Firestore][writeUserData] Ошибка записи:`, e);
      // fallback на локальный файл
    }
  }
  // fallback: локальный файл
  const file = getLocalPath(userId);
  fs.writeFileSync(file, JSON.stringify(saveData, null, 2), 'utf-8');
}
