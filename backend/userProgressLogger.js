import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class UserProgressLogger {
    constructor(userId) {
        this.userId = userId;
        this.logPath = path.join(process.cwd(), 'backup_files', 'users');
        console.log('[DIAGNOSTIC] process.cwd():', process.cwd());
        console.log('[DIAGNOSTIC] logPath:', this.logPath);
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, { recursive: true });
        }
    }

    getUserLogPath() {
        return path.join(this.logPath, `${this.userId}_progress.json`);
    }

    // Логирование диалога с ИИ
    async logDialog(message, response, context) {
        const log = this.loadLog();
        
        if (!log.dialogHistory) {
            log.dialogHistory = [];
        }

        log.dialogHistory.push({
            timestamp: new Date().toISOString(),
            message,
            response,
            context
        });

        await this.saveLog(log);
    }

    // Логирование изменений в личном кабинете
    async logProfileChange(changes) {
        const log = this.loadLog();
        
        if (!log.profileChanges) {
            log.profileChanges = [];
        }

        log.profileChanges.push({
            timestamp: new Date().toISOString(),
            changes
        });

        await this.saveLog(log);
    }

    // Логирование выполнения плана
    async logPlanExecution(mealType, executed, reason) {
        const log = this.loadLog();
        
        if (!log.planExecution) {
            log.planExecution = [];
        }

        log.planExecution.push({
            timestamp: new Date().toISOString(),
            mealType,
            executed,
            reason
        });

        await this.saveLog(log);
    }

    // Сохранить прогресс (еда/тренировка/задачи) за конкретную дату
    async saveDayProgress({ date, ate, workout, tasks }) {
        const log = this.loadLog();
        if (!log.dailyProgress) {
            log.dailyProgress = {};
        }
        log.dailyProgress[date] = {
            ate: !!ate,
            workout: !!workout,
            tasks: Array.isArray(tasks) ? tasks : [],
            updatedAt: new Date().toISOString()
        };
        await this.saveLog(log);
    }

    // Получить прогресс за конкретную дату
    getDayProgress(date) {
        const log = this.loadLog();
        if (log.dailyProgress && log.dailyProgress[date]) {
            return log.dailyProgress[date];
        }
        return { ate: false, workout: false };
    }

    // Получить сводку прогресса за период (и анализ причин)
    getProgressSummary({ from, to }) {
        const log = this.loadLog();
        if (!log.dailyProgress) return { total: 0, done: 0, failed: 0, reasons: {} };
        const fromDate = new Date(from);
        const toDate = new Date(to);
        let total = 0, done = 0, failed = 0;
        const reasons = {};
        for (const [date, day] of Object.entries(log.dailyProgress)) {
            const d = new Date(date);
            if (d < fromDate || d > toDate) continue;
            if (Array.isArray(day.tasks)) {
                for (const task of day.tasks) {
                    total++;
                    if (task.done) done++;
                    else {
                        failed++;
                        if (task.reason) reasons[task.reason] = (reasons[task.reason] || 0) + 1;
                    }
                }
            }
        }
        return { total, done, failed, reasons };
    }

    // Анализ прогресса за неделю
    analyzeWeeklyProgress() {
        const log = this.loadLog();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Фильтруем записи за последнюю неделю
        const weeklyExecution = log.planExecution?.filter(entry => 
            new Date(entry.timestamp) > weekAgo
        ) || [];

        // Считаем процент выполнения
        const totalMeals = weeklyExecution.length;
        const executedMeals = weeklyExecution.filter(entry => entry.executed).length;
        const executionRate = totalMeals ? executedMeals / totalMeals : 0;

        // Анализируем причины невыполнения
        const failureReasons = weeklyExecution
            .filter(entry => !entry.executed && entry.reason)
            .map(entry => entry.reason);

        // Группируем причины
        const reasonCounts = failureReasons.reduce((acc, reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {});

        return {
            executionRate,
            totalMeals,
            executedMeals,
            commonReasons: Object.entries(reasonCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([reason]) => reason)
        };
    }

    // Генерация рекомендаций на основе анализа
    generateRecommendations() {
        const progress = this.analyzeWeeklyProgress();
        const recommendations = [];

        if (progress.executionRate < 0.7) {
            recommendations.push({
                type: 'warning',
                message: 'Диана заметила, что вы выполняете менее 70% плана. Давайте обсудим, как сделать план более реалистичным для вас.'
            });
        }

        if (progress.commonReasons.length > 0) {
            recommendations.push({
                type: 'suggestion',
                message: `Частые причины пропуска: ${progress.commonReasons.join(', ')}. Давайте адаптируем план с учетом этих сложностей.`
            });
        }

        return recommendations;
    }

    // Загрузка лога с дополнительными проверками
    loadLog() {
        const logPath = this.getUserLogPath();
        console.log(`[UserProgressLogger] Загружаем лог из: ${logPath}`);
        
        // Проверяем существование файла
        if (!fs.existsSync(logPath)) {
            console.log('[UserProgressLogger] Файл не существует, создаем новый');
            const defaultStructure = this.getDefaultProgressStructure();
            fs.writeFileSync(logPath, JSON.stringify(defaultStructure, null, 2), 'utf8');
            return defaultStructure;
        }
        
        // Пытаемся прочитать файл несколько раз на случай блокировки
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                attempts++;
                
                // Проверяем размер файла перед чтением
                const stats = fs.statSync(logPath);
                console.log(`[UserProgressLogger] Попытка ${attempts}: Размер файла: ${stats.size} байт`);
                
                if (stats.size === 0) {
                    console.log('[UserProgressLogger] Файл пустой (0 байт), создаем дефолтную структуру');
                    const defaultStructure = this.getDefaultProgressStructure();
                    fs.writeFileSync(logPath, JSON.stringify(defaultStructure, null, 2), 'utf8');
                    return defaultStructure;
                }
                
                // Читаем файл с явным указанием кодировки
                const content = fs.readFileSync(logPath, 'utf8');
                console.log(`[UserProgressLogger] Содержимое файла: ${content.length} символов`);
                
                if (content.length > 0) {
                    console.log(`[UserProgressLogger] Первые 100 символов: "${content.substring(0, 100)}"`);
                }
                
                if (!content || !content.trim()) {
                    console.log('[UserProgressLogger] Файл содержит только пробелы/переносы, создаем дефолтную структуру');
                    const defaultStructure = this.getDefaultProgressStructure();
                    fs.writeFileSync(logPath, JSON.stringify(defaultStructure, null, 2), 'utf8');
                    return defaultStructure;
                }
                
                // Парсим JSON
                const parsed = JSON.parse(content);
                console.log('[UserProgressLogger] Файл успешно загружен и распарсен');
                
                // Убеждаемся, что структура содержит dailyProgress
                if (!parsed.dailyProgress) {
                    console.log('[UserProgressLogger] Добавляем отсутствующий dailyProgress');
                    parsed.dailyProgress = {};
                }
                
                return parsed;
                
            } catch (e) {
                console.error(`[UserProgressLogger] Попытка ${attempts} неудачна:`, e.message);
                
                if (attempts >= maxAttempts) {
                    console.error('[UserProgressLogger] Все попытки исчерпаны, создаем дефолтную структуру');
                    const defaultStructure = this.getDefaultProgressStructure();
                    
                    // Делаем бэкап старого файла
                    try {
                        const backupPath = logPath + '.backup.' + Date.now();
                        fs.copyFileSync(logPath, backupPath);
                        console.log(`[UserProgressLogger] Бэкап создан: ${backupPath}`);
                    } catch (backupError) {
                        console.error('[UserProgressLogger] Ошибка создания бэкапа:', backupError.message);
                    }
                    
                    fs.writeFileSync(logPath, JSON.stringify(defaultStructure, null, 2), 'utf8');
                    return defaultStructure;
                }
                
                // Ждем немного перед следующей попыткой
                const delay = attempts * 100; // 100, 200, 300 мс
                console.log(`[UserProgressLogger] Ждем ${delay}мс перед следующей попыткой...`);
                
                // Синхронная задержка
                const start = Date.now();
                while (Date.now() - start < delay) {
                    // Пустой цикл для задержки
                }
            }
        }
    }

    // Получение дефолтной структуры прогресса
    getDefaultProgressStructure() {
        return {
            workouts: 0,
            nutrition: 0,
            details: {
                meals: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
                weeklyProgress: [],
                commonIssues: [],
                improvements: { weekOverWeek: 0, trend: 'up' }
            },
            dailyProgress: {},
            lastUpdate: new Date().toISOString()
        };
    }

    // Сохранение лога с атомарной записью
    async saveLog(log) {
        const logPath = this.getUserLogPath();
        const tempPath = logPath + '.tmp';
        
        try {
            console.log(`[UserProgressLogger] Сохраняем лог в: ${logPath}`);
            
            // Убеждаемся, что папка существует
            const dir = path.dirname(logPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Добавляем lastUpdate
            log.lastUpdate = new Date().toISOString();
            
            const jsonData = JSON.stringify(log, null, 2);
            
            // Атомарная запись: сначала во временный файл, затем переименование
            await fs.promises.writeFile(tempPath, jsonData, 'utf8');
            
            // Переименовываем временный файл в основной (атомарная операция)
            await fs.promises.rename(tempPath, logPath);
            
            console.log('[UserProgressLogger] Лог успешно сохранен');
            
            // Проверяем, что файл действительно записался корректно
            const savedContent = fs.readFileSync(logPath, 'utf8');
            if (savedContent.length === 0) {
                throw new Error('Сохраненный файл оказался пустым!');
            }
            
        } catch (error) {
            console.error('[UserProgressLogger] Ошибка сохранения лога:', error);
            
            // Удаляем временный файл если он существует
            try {
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            } catch (cleanupError) {
                console.error('[UserProgressLogger] Ошибка очистки временного файла:', cleanupError);
            }
            
            throw error;
        }
    }
}

export default UserProgressLogger;
