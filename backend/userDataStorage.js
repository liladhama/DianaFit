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
try {
  admin = await import('firebase-admin');
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'dianafit-firebase-adminsdk-fbsvc-e8d8736690.json'), 'utf-8'));
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  db = admin.firestore();
  firestoreAvailable = true;
} catch (e) {
  firestoreAvailable = false;
}

function getLocalPath(userId) {
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  return path.join(localDir, `${userId}.json`);
}

export async function readUserData(userId) {
  if (firestoreAvailable) {
    try {
      const doc = await db.collection('Dianafit').doc('users').collection('users').doc(userId).get();
      if (doc.exists) return doc.data();
      return { userId };
    } catch (e) {
      // fallback на локальный файл
    }
  }
  // fallback: локальный файл
  const file = getLocalPath(userId);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
  return { userId };
}

export async function writeUserData(userId, data) {
  if (firestoreAvailable) {
    try {
      await db.collection('Dianafit').doc('users').collection('users').doc(userId).set(data);
      return;
    } catch (e) {
      // fallback на локальный файл
    }
  }
  // fallback: локальный файл
  const file = getLocalPath(userId);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}
