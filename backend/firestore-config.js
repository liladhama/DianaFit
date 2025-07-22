// Конфигурация Firestore для приложения DianaFit
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Получает конфигурацию Firebase Service Account
 * Приоритет: переменная окружения -> локальный файл
 */
export function getFirebaseConfig() {
  try {
    // Сначала пытаемся получить из переменной окружения
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // ...удалено лишнее логирование...
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    
    // Если переменная окружения не задана, используем локальный файл
    const configPath = path.join(__dirname, 'dianafit-firebase-adminsdk-fbsvc-7953c18efc.json');
    
    if (fs.existsSync(configPath)) {
      // ...удалено лишнее логирование...
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    
    throw new Error('Конфигурация Firebase не найдена ни в переменной окружения, ни в локальном файле');
  } catch (error) {
    // ...удалено лишнее логирование...
    throw error;
  }
}

/**
 * Проверяет валидность конфигурации Firebase
 */
export function validateFirebaseConfig(config) {
  const requiredFields = [
    'type',
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id',
    'auth_uri',
    'token_uri'
  ];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Отсутствует обязательное поле в конфигурации Firebase: ${field}`);
    }
  }
  
  if (config.type !== 'service_account') {
    throw new Error('Неверный тип конфигурации Firebase. Должен быть "service_account"');
  }
  
  // ...удалено: Firebase Config лог...
  return true;
}

/**
 * Получает проект ID из конфигурации
 */
export function getProjectId() {
  try {
    const config = getFirebaseConfig();
    return config.project_id;
  } catch (error) {
    // ...оставляем только критическую ошибку...
    console.error('[Firebase Config] Ошибка получения project_id:', error);
    return null;
  }
}

/**
 * Получает коллекцию пользователей для текущего проекта
 */
export function getUsersCollection() {
  return 'Dianafit_users';
}

export default {
  getFirebaseConfig,
  validateFirebaseConfig,
  getProjectId,
  getUsersCollection
};
