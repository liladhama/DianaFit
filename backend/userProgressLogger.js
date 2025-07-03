import fs from 'fs';
import path from 'path';

class UserProgressLogger {
    constructor(userId) {
        this.userId = userId;
        this.logPath = path.join(process.cwd(), 'data', 'user_logs');
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

    // Загрузка лога
    loadLog() {
        const logPath = this.getUserLogPath();
        if (fs.existsSync(logPath)) {
            return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
        }
        return {};
    }

    // Сохранение лога
    async saveLog(log) {
        const logPath = this.getUserLogPath();
        await fs.promises.writeFile(logPath, JSON.stringify(log, null, 2));
    }
}

export default UserProgressLogger;
