
import { readUserData, writeUserData } from './userDataStorage.js';


class UserProgressLogger {
    constructor(userId) {
        this.userId = userId;
    }

    // Логирование диалога с ИИ
    async logDialog(message, response, context) {
        const log = await this.loadLog();
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
        const log = await this.loadLog();
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
        const log = await this.loadLog();
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
        // Загружаем весь существующий лог
        const log = await this.loadLog();
        if (!log.dailyProgress) {
            log.dailyProgress = {};
        }
        // Обновляем только нужный день
        log.dailyProgress[date] = {
            ate: ate === null ? null : !!ate,
            workout: workout === null ? null : !!workout,
            tasks: Array.isArray(tasks) ? tasks : [],
            updatedAt: new Date().toISOString()
        };
        // Сохраняем весь лог, чтобы не потерять остальные поля
        await this.saveLog(log);
    }

    // Получить прогресс за конкретную дату
    async getDayProgress(date) {
        const log = await this.loadLog();
        if (log.dailyProgress && log.dailyProgress[date]) {
            return log.dailyProgress[date];
        }
        // ИСПРАВЛЕНО: возвращаем null для несуществующих записей
        return { ate: null, workout: null, tasks: [] };
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

    // Получение дефолтной структуры прогресса
    getDefaultProgressStructure(existing = {}) {
        return {
            ...('quiz' in existing ? { quiz: existing.quiz } : {}),
            ...('program' in existing ? { program: existing.program } : {}),
            ...('programData' in existing ? { programData: existing.programData } : {}),
            ...('progress' in existing ? { progress: existing.progress } : {}),
            ...('dailyProgress' in existing ? { dailyProgress: existing.dailyProgress } : { dailyProgress: {} }),
            workouts: 0,
            nutrition: 0,
            details: {
                meals: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
                weeklyProgress: [],
                commonIssues: [],
                improvements: { weekOverWeek: 0, trend: 'up' }
            },
            lastUpdate: new Date().toISOString()
        };
    }

    // Загрузка лога с дополнительными проверками
    async loadLog() {
        let existing = await readUserData(this.userId);
        if (!existing.dailyProgress) {
            existing.dailyProgress = {};
        }
        if (!('workouts' in existing)) existing.workouts = 0;
        if (!('nutrition' in existing)) existing.nutrition = 0;
        if (!('details' in existing)) {
            existing.details = {
                meals: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
                weeklyProgress: [],
                commonIssues: [],
                improvements: { weekOverWeek: 0, trend: 'up' }
            };
        }
        return existing;
    }

    // Сохранение лога с атомарной записью
    async saveLog(log) {
        let existing = await readUserData(this.userId);
        const finalLog = {
            ...existing,
            ...log,
            lastUpdate: new Date().toISOString()
        };
        await writeUserData(this.userId, finalLog);
    }
}

export default UserProgressLogger;
