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
        // Универсальный файл пользователя
        return path.join(this.logPath, `${this.userId}.json`);
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
        if (!fs.existsSync(logPath)) {
            const defaultStructure = this.getDefaultProgressStructure();
            fs.writeFileSync(logPath, JSON.stringify(defaultStructure, null, 2), 'utf8');
            return defaultStructure;
        }
        let content;
        try {
            content = fs.readFileSync(logPath, 'utf8');
            if (!content || content.trim() === '') throw new Error('Empty file');
            const parsed = JSON.parse(content);
            // Гарантируем наличие dailyProgress
            if (!parsed.dailyProgress) parsed.dailyProgress = {};
            return parsed;
        } catch (e) {
            // Если файл пустой или битый, сбрасываем к дефолтной структуре
            const defaultStructure = this.getDefaultProgressStructure();
            fs.writeFileSync(logPath, JSON.stringify(defaultStructure, null, 2), 'utf8');
            return defaultStructure;
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
        log.lastUpdate = new Date().toISOString();
        const jsonData = JSON.stringify(log, null, 2);
        await fs.promises.writeFile(logPath, jsonData, 'utf8');
    }
}

export default UserProgressLogger;
