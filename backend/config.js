// Конфигурация для backend - определяет локальное или онлайн окружение
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Определяем окружение
const IS_LOCAL_ENVIRONMENT = process.env.NODE_ENV === 'development' || 
                            process.env.NODE_ENV === 'local' || 
                            !process.env.NODE_ENV ||
                            process.env.USE_LOCAL_STORAGE === 'true';

// Пути для локального хранения
const LOCAL_STORAGE_PATHS = {
  users: path.join(__dirname, 'backup_files', 'users'),
  backups: path.join(__dirname, 'backup_files')
};

// Настройки для различных окружений
const CONFIG = {
  IS_LOCAL_ENVIRONMENT,
  LOCAL_STORAGE_PATHS,
  
  // Настройки хранения данных
  STORAGE: {
    USE_LOCAL_FILES: false,
    USE_FIRESTORE: true,
    
    // Возможность принудительного использования локальных файлов
    FORCE_LOCAL_FILES: process.env.FORCE_LOCAL_FILES === 'true'
  },
  
  // Настройки API
  API: {
    PORT: process.env.PORT || 3001,
    BASE_URL: IS_LOCAL_ENVIRONMENT ? 'http://localhost:3001' : 'https://dianafit.onrender.com'
  },
  
  // Настройки Firestore
  FIRESTORE: {
    ENABLED: process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS,
    COLLECTION_NAME: 'Dianafit_users'
  }
};


export default CONFIG;
