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
  const userIdStr = String(userId); // Преобразуем в строку для Firestore
  console.log(`[Firestore][readUserData] Попытка чтения данных для userId: ${userIdStr} (исходный: ${userId}, тип: ${typeof userId})`);
  if (firestoreAvailable) {
    try {
      console.log(`[Firestore][readUserData] Firestore доступен, читаем из коллекции: Dianafit_users/${userIdStr}`);
      const doc = await db.collection('Dianafit_users').doc(userIdStr).get();
      if (doc.exists) {
        const data = doc.data();
        console.log(`[Firestore][readUserData] ✅ Документ найден в Firestore:`, {
          userId: data.userId,
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
          quiz: data.quiz,
          dailyProgress: data.dailyProgress,
          programData: data.programData,
          dialogHistory: data.dialogHistory,
          profileChanges: data.profileChanges,
          planExecution: data.planExecution,
          lastUpdate: data.lastUpdate
        };
      }
      console.warn(`[Firestore][readUserData] ⚠️ Документ не найден в Firestore: userId=${userIdStr}, создаем новый`);
      return { userId: userIdStr };
    } catch (e) {
      console.error(`[Firestore][readUserData] ❌ Ошибка чтения из Firestore:`, e);
      console.log(`[Firestore][readUserData] Переходим к локальному файлу как fallback`);
      // fallback на локальный файл
    }
  } else {
    console.log(`[Firestore][readUserData] Firestore недоступен, используем локальный файл`);
  }
  // fallback: локальный файл
  console.log(`[LocalFile][readUserData] Используем локальный файл для userId: ${userIdStr}`);
  const file = getLocalPath(userIdStr);
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      console.log(`[LocalFile][readUserData] ✅ Локальный файл найден:`, {
        userId: data.userId,
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
        quiz: data.quiz,
        dailyProgress: data.dailyProgress,
        programData: data.programData,
        dialogHistory: data.dialogHistory,
        profileChanges: data.profileChanges,
        planExecution: data.planExecution,
        lastUpdate: data.lastUpdate
      };
    } catch (e) {
      console.error(`[LocalFile][readUserData] ❌ Ошибка чтения локального файла:`, e);
      return { userId };
    }
  }
  console.log(`[LocalFile][readUserData] Локальный файл не найден, создаем новый профиль для userId: ${userIdStr}`);
  return { userId: userIdStr };
}

export async function writeUserData(userId, data) {
  const userIdStr = String(userId); // Преобразуем в строку для Firestore
  console.log(`[writeUserData] Начинаем сохранение данных для userId: ${userIdStr} (исходный: ${userId}, тип: ${typeof userId})`);
  console.log(`[writeUserData] Данные для сохранения:`, {
    userId: data.userId,
    hasQuiz: !!data.quiz,
    hasDailyProgress: !!data.dailyProgress,
    hasProgramData: !!data.programData,
    hasDialogHistory: !!data.dialogHistory,
    hasChatHistory: !!data.chatHistory,
    hasProfileChanges: !!data.profileChanges,
    hasPlanExecution: !!data.planExecution
  });
  
  // Сохраняем полную структуру данных пользователя
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
    dialogHistory: data.dialogHistory,
    chatHistory: data.chatHistory,
    profileChanges: data.profileChanges,
    planExecution: data.planExecution,
    lastUpdate: new Date().toISOString()
  });
  
  console.log(`[writeUserData] Очищенные данные для сохранения:`, {
    userId: saveData.userId,
    hasQuiz: !!saveData.quiz,
    hasDailyProgress: !!saveData.dailyProgress,
    hasProgramData: !!saveData.programData,
    hasDialogHistory: !!saveData.dialogHistory,
    hasChatHistory: !!saveData.chatHistory,
    hasProfileChanges: !!saveData.profileChanges,
    hasPlanExecution: !!saveData.planExecution,
    lastUpdate: saveData.lastUpdate
  });
  
  if (firestoreAvailable) {
    try {
      console.log(`[Firestore][writeUserData] Firestore доступен, сохраняем в коллекцию: Dianafit_users/${userIdStr}`);
      await db.collection('Dianafit_users').doc(userIdStr).set(saveData);
      console.log(`[Firestore][writeUserData] ✅ Данные успешно сохранены в Firestore: Dianafit_users/${userIdStr}`);
      return;
    } catch (e) {
      console.error(`[Firestore][writeUserData] ❌ Ошибка записи в Firestore:`, e);
      console.log(`[Firestore][writeUserData] Переходим к локальному файлу как fallback`);
      // fallback на локальный файл
    }
  } else {
    console.log(`[writeUserData] Firestore недоступен, используем локальный файл`);
  }
  
  // fallback: локальный файл
  console.log(`[LocalFile][writeUserData] Сохраняем в локальный файл для userId: ${userIdStr}`);
  const file = getLocalPath(userIdStr);
  try {
    fs.writeFileSync(file, JSON.stringify(saveData, null, 2), 'utf-8');
    console.log(`[LocalFile][writeUserData] ✅ Данные успешно сохранены в локальный файл: ${file}`);
  } catch (e) {
    console.error(`[LocalFile][writeUserData] ❌ Ошибка записи в локальный файл:`, e);
    throw e;
  }
}
