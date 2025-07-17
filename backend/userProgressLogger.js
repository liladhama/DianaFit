
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
        
        // Обновляем dailyProgress (как было)
        log.dailyProgress[date] = {
            ate: ate === null ? null : !!ate,
            workout: workout === null ? null : !!workout,
            tasks: Array.isArray(tasks) ? tasks : [],
            updatedAt: new Date().toISOString()
        };
        
        // НОВОЕ: Синхронизируем с programData.days
        if (log.programData && log.programData.days) {
            const dayToUpdate = log.programData.days.find(day => day.date === date);
            if (dayToUpdate) {
                console.log(`[SYNC] Синхронизируем programData для дня ${date}`);
                
                // Обновляем completedMealsArr на основе tasks
                if (Array.isArray(tasks)) {
                    const mealTasks = tasks.filter(task => task.type === 'meal');
                    if (mealTasks.length > 0) {
                        dayToUpdate.completedMealsArr = dayToUpdate.completedMealsArr || [];
                        mealTasks.forEach((task, index) => {
                            if (index < dayToUpdate.completedMealsArr.length) {
                                dayToUpdate.completedMealsArr[index] = task.done;
                            }
                        });
                        dayToUpdate.completedMeals = mealTasks.some(task => task.done);
                        console.log(`[SYNC] Обновлены приемы пищи:`, dayToUpdate.completedMealsArr);
                    }
                    
                    // Обновляем completedExercises на основе tasks
                    const workoutTasks = tasks.filter(task => task.type === 'workout');
                    if (workoutTasks.length > 0) {
                        dayToUpdate.completedExercises = dayToUpdate.completedExercises || [];
                        workoutTasks.forEach((task, index) => {
                            if (index < dayToUpdate.completedExercises.length) {
                                dayToUpdate.completedExercises[index] = task.done;
                            }
                        });
                        dayToUpdate.completedWorkout = workoutTasks.some(task => task.done);
                        console.log(`[SYNC] Обновлены упражнения:`, dayToUpdate.completedExercises);
                    }
                    
                    // Обновляем шаги
                    const stepsTask = tasks.find(task => task.type === 'steps');
                    if (stepsTask) {
                        dayToUpdate.dailySteps = stepsTask.steps_estimated || 0;
                        console.log(`[SYNC] Обновлены шаги:`, dayToUpdate.dailySteps);
                    }
                }
            }
        }
        
        // Сохраняем весь лог
        await this.saveLog(log);
        console.log(`[PROGRESS LOGGER] Сохранен прогресс за ${date} с синхронизацией programData`);
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

    // Получить недельную историю прогресса (последние 7 дней)
    async getWeeklyProgressHistory() {
        const log = await this.loadLog();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Миграция: если progressHistory пуста, но есть dailyProgress - мигрируем данные
        if ((!log.progressHistory || log.progressHistory.length === 0) && log.dailyProgress) {
            console.log('[MIGRATION] Мигрируем данные из dailyProgress в progressHistory');
            log.progressHistory = [];
            
            Object.entries(log.dailyProgress).forEach(([date, dayData]) => {
                const dayDate = new Date(date);
                if (dayDate >= weekAgo) {
                    log.progressHistory.push({
                        date,
                        timestamp: dayData.updatedAt || new Date(date + 'T12:00:00Z').toISOString(),
                        ate: dayData.ate,
                        workout: dayData.workout,
                        tasks: dayData.tasks || [],
                        actionType: 'migrated_data'
                    });
                }
            });
            
            // Сохраняем мигрированные данные
            await this.saveLog(log);
            console.log(`[MIGRATION] Мигрировано ${log.progressHistory.length} записей`);
        }
        
        const weeklyHistory = [];
        const progressHistory = log.progressHistory || [];
        
        // Создаем объект для группировки по дням
        const dayGroups = {};
        
        // Группируем записи по дням
        progressHistory
            .filter(entry => new Date(entry.timestamp) >= weekAgo)
            .forEach(entry => {
                const day = entry.date;
                if (!dayGroups[day]) {
                    dayGroups[day] = [];
                }
                dayGroups[day].push(entry);
            });
        
        // Для каждого дня берем последнюю запись (актуальное состояние)
        Object.keys(dayGroups).forEach(day => {
            const dayEntries = dayGroups[day].sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            const latestEntry = dayEntries[0];
            
            weeklyHistory.push({
                date: day,
                ate: latestEntry.ate,
                workout: latestEntry.workout,
                tasks: latestEntry.tasks,
                lastUpdated: latestEntry.timestamp,
                updatesCount: dayEntries.length
            });
        });
        
        // Сортируем по дате
        weeklyHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        console.log(`[PROGRESS LOGGER] Возвращаем недельную историю: ${weeklyHistory.length} дней`);
        return weeklyHistory;
    }

    // Анализ недельного прогресса на основе истории
    async analyzeWeeklyProgressFromHistory() {
        const log = await this.loadLog();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const dailyProgress = log.dailyProgress || {};
        const programDays = log.programData?.days || [];
        
        let totalMeals = 0;
        let completedMeals = 0;
        let mealDaysSet = new Set();
        let totalWorkouts = 0;
        let completedWorkouts = 0;
        let totalTasks = 0;
        let completedTasks = 0;
        let totalSteps = 0;
        
        console.log(`[ANALYZE] Анализируем период с ${weekAgo.toISOString().slice(0, 10)} по ${now.toISOString().slice(0, 10)}`);
        
        // Анализируем dailyProgress за последние 7 дней
        Object.entries(dailyProgress).forEach(([date, dayData]) => {
            const dayDate = new Date(date);
            if (dayDate >= weekAgo && dayDate <= now) {
                if (Array.isArray(dayData.tasks)) {
                    let hasMeal = false;
                    dayData.tasks.forEach(task => {
                        totalTasks++;
                        if (task.done) completedTasks++;
                        if (task.type === 'meal') {
                            totalMeals++;
                            if (task.done) completedMeals++;
                            hasMeal = true;
                        } else if (task.type === 'workout') {
                            totalWorkouts++;
                            if (task.done) completedWorkouts++;
                        } else if (task.type === 'steps' && task.steps_estimated) {
                            totalSteps += Number(task.steps_estimated) || 0;
                        }
                    });
                    if (hasMeal) mealDaysSet.add(date);
                }
            }
        });
        
        // Если данных в dailyProgress мало, берем из programData.days
        if (totalTasks < 5 && programDays.length > 0) {
            console.log(`[ANALYZE] Данных в dailyProgress мало (${totalTasks}), используем programData.days`);
            programDays.forEach(day => {
                const dayDate = new Date(day.date);
                if (dayDate >= weekAgo && dayDate <= now) {
                    let hasMeal = false;
                    // Считаем приемы пищи
                    if (Array.isArray(day.completedMealsArr)) {
                        day.completedMealsArr.forEach(mealCompleted => {
                            totalMeals++;
                            if (mealCompleted === true) completedMeals++;
                            hasMeal = true;
                        });
                    }
                    if (hasMeal) mealDaysSet.add(day.date);
                    // Считаем упражнения
                    if (Array.isArray(day.completedExercises)) {
                        day.completedExercises.forEach(exerciseCompleted => {
                            totalWorkouts++;
                            if (exerciseCompleted === true) completedWorkouts++;
                        });
                    }
                    // Считаем шаги
                    if (day.dailySteps) {
                        totalSteps += Number(day.dailySteps) || 0;
                    }
                    totalTasks = totalMeals + totalWorkouts;
                    completedTasks = completedMeals + completedWorkouts;
                }
            });
        }
        
        // Для питания: всегда 5 приемов пищи в день, 7 дней в неделе
        const maxMeals = 7 * 5;
        // Для тренировок: считаем количество упражнений за неделю
        let totalExercisesWeek = 0;
        let completedExercisesWeek = 0;
        programDays.forEach(day => {
            const dayDate = new Date(day.date);
            if (dayDate >= weekAgo && dayDate <= now && day.isWorkoutDay && day.workout && Array.isArray(day.workout.exercises)) {
                // Суммируем все упражнения недели
                totalExercisesWeek += day.workout.exercises.length;
                if (Array.isArray(day.completedExercises)) {
                    completedExercisesWeek += day.completedExercises.filter(Boolean).length;
                }
            }
        });
        const summary = {
            totalDays: 7,
            mealsCompletion: maxMeals > 0 ? Math.round((completedMeals / maxMeals) * 100) : 0,
            workoutsCompletion: totalExercisesWeek > 0 ? Math.round((completedExercisesWeek / totalExercisesWeek) * 100) : 0,
            overallCompletion: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            stats: {
                totalMeals,
                completedMeals,
                maxMeals,
                totalExercisesWeek,
                completedExercisesWeek,
                totalWorkouts,
                completedWorkouts,
                totalTasks,
                completedTasks,
                totalSteps
            }
        };
        
        console.log(`[ANALYZE] Результат анализа:`, summary);
        
        return {
            weeklyHistory: Object.entries(dailyProgress)
                .filter(([date]) => new Date(date) >= weekAgo)
                .map(([date, data]) => ({ date, ...data })),
            summary
        };
    }
    // ...existing code...

    // Получить сводку прогресса за период (и анализ причин)
    async getProgressSummary({ from, to }) {
        const log = await this.loadLog();
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
    async analyzeWeeklyProgress() {
        const log = await this.loadLog();
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
