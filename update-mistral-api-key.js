// Скрипт для обновления API ключа Mistral
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE_PATH = path.join(__dirname, 'backend', '.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function sanitizeApiKey(key) {
  // Удаляем пробелы, переносы строк и другие невидимые символы
  return key.trim().replace(/\s+/g, '');
}

function updateEnvFile(apiKey) {
  try {
    let envContent = '';
    
    // Если файл существует, читаем его содержимое
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      
      // Обновляем или добавляем ключ API
      if (envContent.includes('MISTRAL_API_KEY=')) {
        envContent = envContent.replace(
          /MISTRAL_API_KEY=.*/,
          `MISTRAL_API_KEY=${apiKey}`
        );
      } else {
        envContent += `\n# Mistral AI API ключ для генерации питания\nMISTRAL_API_KEY=${apiKey}\n`;
      }
    } else {
      // Создаем новый файл .env
      envContent = `# Конфигурация DianaFit Backend\n\n# Mistral AI API ключ для генерации питания\nMISTRAL_API_KEY=${apiKey}\n`;
    }
    
    // Записываем обновленное содержимое в файл
    fs.writeFileSync(ENV_FILE_PATH, envContent);
    console.log('\n✅ API ключ успешно обновлен в файле .env');
    
    return true;
  } catch (error) {
    console.error('\n❌ Ошибка при обновлении файла .env:', error);
    return false;
  }
}

console.log('===== Обновление API ключа Mistral =====');
console.log('Этот скрипт обновит ваш API ключ Mistral в файле .env');
console.log('\nИнструкции:');
console.log('1. Перейдите на https://console.mistral.ai/');
console.log('2. Создайте новый API ключ или скопируйте существующий');
console.log('3. Вставьте ключ ниже (он будет автоматически очищен от пробелов и переносов строк)');
console.log('\nНажмите Ctrl+C для отмены');

rl.question('\nВведите ваш API ключ Mistral: ', (inputKey) => {
  const apiKey = sanitizeApiKey(inputKey);
  
  if (!apiKey) {
    console.error('\n❌ Введен пустой ключ. Отмена операции.');
    rl.close();
    return;
  }
  
  console.log(`\nОчищенный ключ: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`Длина ключа: ${apiKey.length} символов`);
  
  rl.question('\nПодтвердите обновление ключа (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      const success = updateEnvFile(apiKey);
      
      if (success) {
        console.log('\nДля применения изменений:');
        console.log('1. Перезапустите сервер backend');
        console.log('2. Запустите скрипт check-mistral-api.js для проверки подключения');
      }
    } else {
      console.log('\nОперация отменена. Ключ не был обновлен.');
    }
    
    rl.close();
  });
});
