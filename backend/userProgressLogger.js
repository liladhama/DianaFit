
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
        // --- Сохраняем в dailyProgress (как было) ---
        log.dailyProgress[date] = {
            ate: ate === null ? null : !!ate,
            workout: workout === null ? null : !!workout,
            tasks: Array.isArray(tasks) ? tasks : [],
            updatedAt: new Date().toISOString()
        };

        // --- Новое: сохраняем в progressHistory для недельного анализа ---
        if (!log.progressHistory) log.progressHistory = [];
        log.progressHistory.push({
            date,
            timestamp: new Date().toISOString(),
            ate: ate === null ? null : !!ate,
            workout: workout === null ? null : !!workout,
            tasks: Array.isArray(tasks) ? tasks.map(t => ({
                name: t.name,
                type: t.type,
                done: t.done,
                reason: t.reason || undefined
            })) : [],
            actionType: 'progress_update'
        });
        // Ограничиваем историю 90 днями (по timestamp)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        log.progressHistory = log.progressHistory.filter(entry => new Date(entry.timestamp) >= ninetyDaysAgo);

        // --- Синхронизируем с programData.days (как было) ---
        if (log.programData && log.programData.days) {
            const dayToUpdate = log.programData.days.find(day => day.date === date);
            if (dayToUpdate) {
                console.log(`[SYNC] Синхронизируем programData для дня ${date}`);
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
                    const stepsTask = tasks.find(task => task.type === 'steps');
                    if (stepsTask) {
                        dayToUpdate.dailySteps = stepsTask.steps_estimated || 0;
                        console.log(`[SYNC] Обновлены шаги:`, dayToUpdate.dailySteps);
                    }
                }
            }
        }
        // --- Сохраняем весь лог ---
        await this.saveLog(log);
        console.log(`[PROGRESS LOGGER] Сохранен прогресс за ${date} с синхронизацией programData и обновлением progressHistory`);
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
                    // Копируем reason если есть
                    const migratedTasks = Array.isArray(dayData.tasks)
                        ? dayData.tasks.map(t => ({
                            name: t.name,
                            type: t.type,
                            done: t.done,
                            reason: t.reason || undefined
                        }))
                        : [];
                    log.progressHistory.push({
                        date,
                        timestamp: dayData.updatedAt || new Date(date + 'T12:00:00Z').toISOString(),
                        ate: dayData.ate,
                        workout: dayData.workout,
                        tasks: migratedTasks,
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
        // Определяем дату старта программы (createdAt или первая дата в programData.days)
        let programStartDate = null;
        if (log.createdAt) {
            programStartDate = new Date(log.createdAt);
        } else if (log.programData?.days?.length > 0) {
            programStartDate = new Date(log.programData.days[0].date);
        } else {
            programStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // fallback
        }
        // Неделя — это всегда 7 дней с момента старта (без ограничения на текущую дату)
        let weekStart = new Date(programStartDate);
        let weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const dailyProgress = log.dailyProgress || {};
        const programDays = log.programData?.days || [];

        // Корректно вычисляем weekAgo для подсчёта питания и задач (теперь совпадает с weekStart)
        const weekAgo = new Date(weekStart);

        // --- Подсчет шагов за неделю и процент выполнения ---
        // Суммируем все steps_estimated (шаги) за неделю
        let weekSteps = 0;
        Object.entries(dailyProgress).forEach(([date, dayData]) => {
            const dayDate = new Date(date);
            if (dayDate >= weekStart && dayDate <= weekEnd && Array.isArray(dayData.tasks)) {
                dayData.tasks.forEach(task => {
                    if (task.type === 'steps' && task.steps_estimated) {
                        weekSteps += Number(task.steps_estimated) || 0;
                    }
                });
            }
        });
        // 100% = 10 440 шагов * 7 дней = 73 080 шагов
        const maxSteps = 10440 * 7;
        const stepsCompletion = maxSteps > 0 ? Math.round((weekSteps / maxSteps) * 100) : 0;

        // --- Подсчет питания и задач (оставляем как было) ---
        let totalMeals = 0;
        let completedMeals = 0;
        let mealDaysSet = new Set();
        let totalTasks = 0;
        let completedTasks = 0;
        let totalSteps = 0;

        // --- Подсчет упражнений для прогрессбара ---
        let totalExercisesWeek = 0;
        let completedExercisesWeek = 0;

        // 100% — это сумма всех упражнений, предписанных в programData.days за неделю (между weekStart и weekEnd)
        totalExercisesWeek = 0;
        programDays.forEach(day => {
            const dayDate = new Date(day.date);
            if (dayDate >= weekStart && dayDate <= weekEnd && day.isWorkoutDay && day.workout && Array.isArray(day.workout.exercises)) {
                totalExercisesWeek += day.workout.exercises.length;
            }
        });

        // Сохраняем totalExercisesWeek в историю пользователя (progressHistory) для этой недели
        if (!log.weeklyStats) log.weeklyStats = [];
        // Определяем уникальный ключ недели (например, по дате начала недели)
        const weekKey = weekStart.toISOString().slice(0, 10);
        // Проверяем, есть ли уже запись за эту неделю
        const existingWeek = log.weeklyStats.find(w => w.weekKey === weekKey);
        if (!existingWeek) {
            log.weeklyStats.push({
                weekKey,
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
                totalExercisesWeek
            });
            await this.saveLog(log);
        } else if (existingWeek.totalExercisesWeek !== totalExercisesWeek) {
            existingWeek.totalExercisesWeek = totalExercisesWeek;
            existingWeek.weekEnd = weekEnd.toISOString();
            await this.saveLog(log);
        }

        // completedExercisesWeek — считаем только те задачи workout, которые реально есть в programData.days за неделю
        // Собираем даты тренировочных дней недели
        const validWorkoutDays = new Set(
            programDays
                .filter(day => {
                    const dayDate = new Date(day.date);
                    return dayDate >= weekStart && dayDate <= weekEnd && day.isWorkoutDay && day.workout && Array.isArray(day.workout.exercises);
                })
                .map(day => day.date)
        );
        Object.entries(dailyProgress).forEach(([date, dayData]) => {
            if (validWorkoutDays.has(date) && Array.isArray(dayData.tasks)) {
                dayData.tasks.forEach(task => {
                    if (task.type === 'workout' && task.done === true) completedExercisesWeek++;
                });
            }
        });
        // Отладочный вывод
        console.log('[DEBUG WORKOUTS] weekStart:', weekStart.toISOString().slice(0,10), 'weekEnd:', weekEnd.toISOString().slice(0,10), 'totalExercisesWeek:', totalExercisesWeek, 'completedExercisesWeek:', completedExercisesWeek);

        // --- Подсчет питания и задач (оставляем как было) ---
        Object.entries(dailyProgress).forEach(([date, dayData]) => {
            const dayDate = new Date(date);
            if (dayDate >= weekStart && dayDate <= weekEnd) {
                if (Array.isArray(dayData.tasks)) {
                    let hasMeal = false;
                    dayData.tasks.forEach(task => {
                        totalTasks++;
                        if (task.done) completedTasks++;
                        if (task.type === 'meal') {
                            totalMeals++;
                            if (task.done) completedMeals++;
                            hasMeal = true;
                        } else if (task.type === 'steps' && task.steps_estimated) {
                            totalSteps += Number(task.steps_estimated) || 0;
                        }
                    });
                    if (hasMeal) mealDaysSet.add(date);
                }
            }
        });

        // Если данных в dailyProgress мало, берем из programData.days (для питания)
        if (totalTasks < 5 && programDays.length > 0) {
            programDays.forEach(day => {
                const dayDate = new Date(day.date);
                if (dayDate >= weekStart && dayDate <= weekEnd) {
                    let hasMeal = false;
                    if (Array.isArray(day.completedMealsArr)) {
                        day.completedMealsArr.forEach(mealCompleted => {
                            totalMeals++;
                            if (mealCompleted === true) completedMeals++;
                            hasMeal = true;
                        });
                    }
                    if (hasMeal) mealDaysSet.add(day.date);
                    if (day.dailySteps) {
                        totalSteps += Number(day.dailySteps) || 0;
                    }
                    totalTasks = totalMeals;
                    completedTasks = completedMeals;
                }
            });
        }

        // Для питания: всегда 5 приемов пищи в день, 7 дней в неделе
        const maxMeals = 7 * 5;

        // --- Итоговый summary ---
        const summary = {
            totalDays: 7,
            mealsCompletion: maxMeals > 0 ? Math.round((completedMeals / maxMeals) * 100) : 0,
            workoutsCompletion: totalExercisesWeek > 0 ? Math.round((completedExercisesWeek / totalExercisesWeek) * 100) : 0,
            stepsCompletion,
            overallCompletion: (maxMeals + totalExercisesWeek + 630) > 0 ? Math.round(((completedMeals + completedExercisesWeek + weekSteps) / (maxMeals + totalExercisesWeek + 630)) * 100) : 0,
            stats: {
                totalMeals,
                completedMeals,
                maxMeals,
                totalExercisesWeek,
                completedExercisesWeek,
                weekSteps,
                stepsCompletion,
                totalTasks,
                completedTasks,
                totalSteps
            }
        };

        console.log(`[ANALYZE] Результат анализа:`, summary);

        return {
            weeklyHistory: Object.entries(dailyProgress)
                .filter(([date]) => {
                    const d = new Date(date);
                    return d >= weekStart && d <= weekEnd;
                })
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
