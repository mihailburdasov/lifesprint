/**
 * Service for managing user progress data
 */

import { DayProgress, WeekReflection, UserProgress, SyncStatus } from '../types/progress';
import { supabase } from '../../../core/services/supabase';
import { logger, LogContext } from '../../../core/services/LoggingService';

/**
 * Default empty day progress
 */
export const defaultDayProgress: DayProgress = {
  completed: false,
  gratitude: ['', '', ''],
  achievements: ['', '', ''],
  goals: [
    { text: '', completed: false },
    { text: '', completed: false },
    { text: '', completed: false }
  ],
  exerciseCompleted: false,
  withAudio: false
};

/**
 * Default empty week reflection
 */
export const defaultWeekReflection: WeekReflection = {
  gratitudeSelf: '',
  gratitudeOthers: '',
  gratitudeWorld: '',
  achievements: ['', '', ''],
  improvements: ['', '', ''],
  insights: ['', '', ''],
  rules: ['', '', ''],
  exerciseCompleted: false,
  withAudio: false
};

/**
 * Class for managing user progress
 */
export class ProgressService {
  private readonly storageKey = 'lifesprint_progress';

  // Track last sync time to improve sync decisions
  private lastSyncTime: number = 0;
  
  /**
   * Load progress from localStorage and Supabase
   * If userId is provided, try to load from Supabase first
   */
  async loadProgress(userId?: string): Promise<UserProgress> {
    // If userId is provided, try to load from Supabase first
    if (userId) {
      try {
        logger.sync("Загружаем прогресс из Supabase");
        const supabaseProgress = await this.loadProgressFromSupabase(userId);
        if (supabaseProgress) {
          logger.success("Прогресс успешно загружен из Supabase");
          
          // Save to localStorage as a backup with userId
          const progressWithUserId = {
            ...supabaseProgress,
            userId: userId // Add userId to localStorage data
          };
          localStorage.setItem(this.storageKey, JSON.stringify(progressWithUserId));
          this.lastSyncTime = Date.now();
          
          return this.updateCurrentDayInProgress(supabaseProgress);
        }
      } catch (error) {
        logger.error("Ошибка загрузки прогресса из Supabase", error);
      }
      
      // For new users, always create a new progress instead of using localStorage
      // This prevents data from previous users being loaded
      logger.info("Создаем новый прогресс для нового пользователя");
      const newProgress = this.createDefaultProgress();
      
      // Save to localStorage with userId
      const progressWithUserId = {
        ...newProgress,
        userId: userId // Add userId to localStorage data
      };
      localStorage.setItem(this.storageKey, JSON.stringify(progressWithUserId));
      
      return newProgress;
    }
    
    // Fallback to localStorage if userId is not provided
    try {
      logger.info("Загружаем прогресс из localStorage");
      const savedProgress = localStorage.getItem(this.storageKey);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        
        // Check if the progress belongs to the current user
        if (userId && progress.userId && progress.userId !== userId) {
          logger.warn("Данные в localStorage принадлежат другому пользователю, создаем новый прогресс");
          return this.createDefaultProgress();
        }
        
        logger.success("Прогресс успешно загружен из localStorage");
        return this.updateCurrentDayInProgress(progress);
      }
    } catch (error) {
      logger.error("Ошибка загрузки прогресса из localStorage", error);
    }
    
    // If all else fails, create default progress
    logger.info("Создаем новый прогресс по умолчанию");
    return this.createDefaultProgress();
  }
  
  /**
   * Update the current day in a progress object based on the current date
   */
  private updateCurrentDayInProgress(progress: UserProgress): UserProgress {
    // Update currentDay based on the current date
    const startDate = new Date(progress.startDate);
    const today = new Date();
    
    // Check if the current date is within the sprint
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const sprintYear = startDate.getFullYear();
    const sprintMonth = startDate.getMonth();
    
    if (currentYear === sprintYear && currentMonth === sprintMonth) {
      // Standard calculation for the current month of the sprint
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      progress.currentDay = Math.min(Math.max(diffDays, 1), 31);
    } else {
      // If we are in a different month or year
      progress.currentDay = Math.min(today.getDate(), 31);
    }
    
    return progress;
  }
  
  /**
   * Load progress from Supabase
   */
  async loadProgressFromSupabase(userId: string): Promise<UserProgress | null> {
    // Use the Supabase client with proper headers
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // If no record found, return null (not an error)
      if (error.code === 'PGRST116') {
        logger.debug("Данные не найдены в Supabase для пользователя", LogContext.SYNC, userId);
        return null;
      }
      throw error;
    }
    
    if (!data) return null;
    
    // Convert from database format to UserProgress format
    const progress = {
      currentDay: data.current_day,
      days: data.days || {},
      weekReflections: data.week_reflections || {},
      completedDays: data.completed_days,
      totalDays: data.total_days,
      startDate: data.start_date,
      lastUpdated: data.updated_at || new Date().toISOString()
    };
    
    logger.debug("Загружены данные из Supabase", LogContext.SYNC, {
      userId,
      currentDay: progress.currentDay,
      daysCount: Object.keys(progress.days).length,
      lastUpdated: progress.lastUpdated
    });
    
    return progress;
  }

  // Flag to track if there are unsynchronized changes and when they occurred
  private needsSync: boolean = false;
  private lastChangeTime: number = 0;
  
  /**
   * Save progress to localStorage only (fast operation)
   */
  saveLocalProgress(progress: UserProgress, userId?: string): void {
    try {
      // Add lastUpdated timestamp and userId to track when changes were made and who they belong to
      const progressWithMetadata = {
        ...progress,
        lastUpdated: new Date().toISOString(),
        userId: userId // Add userId to localStorage data
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(progressWithMetadata));
      logger.debug("Прогресс сохранен в localStorage", LogContext.SYNC);
      this.needsSync = true; // Mark that we need to sync with server
      this.lastChangeTime = Date.now();
    } catch (error) {
      logger.error("Ошибка сохранения прогресса в localStorage", error);
    }
  }
  
  /**
   * Save progress to Supabase (slower operation)
   */
  async saveToServer(progress: UserProgress, userId: string): Promise<void> {
    if (!userId) {
      logger.warn("Не выполняем сохранение на сервер - userId не предоставлен");
      return;
    }
    
    try {
      await this.saveProgressToSupabase(userId, progress);
      logger.success("Прогресс сохранен в Supabase");
      this.needsSync = false; // Reset sync flag after successful save
      this.lastSyncTime = Date.now();
    } catch (error) {
      logger.error("Ошибка сохранения прогресса в Supabase", error);
      // Keep needsSync flag true so we can retry later
    }
  }
  
  /**
   * Check if there are unsynchronized changes
   */
  hasUnsyncedChanges(): boolean {
    return this.needsSync;
  }
  
  /**
   * Check if it's been too long since the last sync
   */
  needsForcedSync(maxInterval: number = 60000): boolean {
    // Force sync if it's been more than maxInterval (default 1 minute) since last sync
    return this.needsSync && (Date.now() - this.lastSyncTime > maxInterval);
  }
  
  /**
   * Save progress to localStorage and optionally queue for server sync
   * If forceServerSync is true, immediately sync with server
   */
  async saveProgress(progress: UserProgress, userId?: string, forceServerSync: boolean = false): Promise<void> {
    // Always save to localStorage (fast operation)
    this.saveLocalProgress(progress, userId);
    
    // Immediately sync with server if forced or if it's been too long since last sync
    if (userId && (forceServerSync || this.needsForcedSync())) {
      logger.info("Принудительная синхронизация с сервером");
      await this.saveToServer(progress, userId);
    }
    // Otherwise, server sync will happen on a timer in useProgressService
  }
  
  /**
   * Save progress to Supabase
   */
  /**
   * Check if data exists in Supabase for debugging
   */
  async checkDataInSupabase(userId: string): Promise<any> {
    logger.debug("Проверяем данные в Supabase для пользователя", LogContext.SYNC, userId);
    
    try {
      // Use the Supabase client with proper headers
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn("Данные не найдены в Supabase для пользователя", userId);
          return null;
        }
        logger.error("Ошибка при проверке данных в Supabase", error);
        throw error;
      }
      
      logger.info("Данные найдены в Supabase", LogContext.SYNC, {
        id: data.id,
        user_id: data.user_id,
        current_day: data.current_day,
        daysCount: Object.keys(data.days || {}).length,
        weekReflectionsCount: Object.keys(data.week_reflections || {}).length,
        created_at: data.created_at,
        updated_at: data.updated_at
      });
      
      return data;
    } catch (error) {
      logger.error("Ошибка при проверке данных в Supabase", error);
      throw error;
    }
  }

  async saveProgressToSupabase(userId: string, progress: UserProgress): Promise<any> {
    logger.sync("Сохраняем прогресс в Supabase");
    logger.debug("Данные для сохранения", LogContext.SYNC, {
      userId,
      currentDay: progress.currentDay,
      daysCount: Object.keys(progress.days).length,
      weekReflectionsCount: Object.keys(progress.weekReflections).length
    });
    
    // Add timestamp for when this data was last updated
    const timestamp = new Date().toISOString();
    
    // Convert from UserProgress format to database format
    const dbProgress = {
      user_id: userId,
      current_day: progress.currentDay,
      days: progress.days,
      week_reflections: progress.weekReflections,
      completed_days: progress.completedDays,
      total_days: progress.totalDays,
      start_date: progress.startDate,
      updated_at: timestamp
    };
    
    try {
      // Check if a record already exists for this user
      logger.debug("Проверяем существование записи для пользователя", LogContext.SYNC, userId);
      const { data: existingData, error: checkError } = await supabase
        .from('user_progress')
        .select('id, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') {
          logger.info("Запись не найдена, будет создана новая", LogContext.SYNC);
        } else {
          logger.error("Ошибка проверки существующего прогресса", checkError);
          throw checkError;
        }
      }
      
      let result;
      
      if (existingData) {
        // Update existing record
        logger.debug("Обновляем существующую запись", LogContext.SYNC, existingData.id);
        
        // Use the Supabase client with proper headers
        const { data, error: updateError } = await supabase
          .from('user_progress')
          .update(dbProgress)
          .eq('user_id', userId)
          .select();
        
        if (updateError) {
          logger.error("Ошибка обновления прогресса", updateError);
          throw updateError;
        }
        
        result = data;
        logger.success("Запись успешно обновлена");
      } else {
        // Insert new record
        logger.info("Создаем новую запись для пользователя", LogContext.SYNC, userId);
        
        // Use the Supabase client with proper headers
        const { data, error: insertError } = await supabase
          .from('user_progress')
          .insert([dbProgress])
          .select();
        
        if (insertError) {
          logger.error("Ошибка создания прогресса", insertError);
          throw insertError;
        }
        
        result = data;
        logger.success("Новая запись успешно создана");
      }
      
      return result;
    } catch (error) {
      logger.error("Ошибка при сохранении прогресса в Supabase", error);
      throw error;
    }
  }
  
  /**
   * Sync progress between localStorage and Supabase
   * This will merge the data from both sources, preferring the most recent changes
   */
  async syncProgressWithSupabase(userId: string): Promise<UserProgress> {
    logger.sync("Синхронизация прогресса с Supabase");
    
    // Load progress from both sources
    const localProgress = this.loadProgressFromLocalStorage(userId);
    const supabaseProgress = await this.loadProgressFromSupabase(userId);
    
    // If no Supabase progress, save local progress to Supabase and return it
    if (!supabaseProgress) {
      if (localProgress) {
        logger.info("Нет данных в Supabase, сохраняем локальные данные");
        await this.saveProgressToSupabase(userId, localProgress);
        return localProgress;
      }
      // If no local progress either, create default progress
      logger.info("Нет данных ни локально, ни в Supabase, создаем новые");
      const defaultProgress = this.createDefaultProgress();
      await this.saveProgress(defaultProgress, userId, true); // Force server sync
      return defaultProgress;
    }
    
    // If no local progress, save Supabase progress to localStorage and return it
    if (!localProgress) {
      logger.info("Нет локальных данных, используем данные из Supabase");
      localStorage.setItem(this.storageKey, JSON.stringify(supabaseProgress));
      return supabaseProgress;
    }
    
    // Check timestamps to determine which data is newer
    const localTimestamp = localProgress.lastUpdated ? new Date(localProgress.lastUpdated).getTime() : 0;
    const remoteTimestamp = supabaseProgress.lastUpdated ? new Date(supabaseProgress.lastUpdated).getTime() : 0;
    
    logger.debug("Сравнение временных меток", LogContext.SYNC, {
      localTimestamp,
      remoteTimestamp,
      localIsNewer: localTimestamp > remoteTimestamp
    });
    
    // Merge progress data, preferring the most complete and recent data
    const mergedProgress = this.mergeProgressData(localProgress, supabaseProgress);
    
    // Save merged progress to both sources
    await this.saveProgress(mergedProgress, userId, true); // Force server sync
    
    logger.success("Прогресс успешно синхронизирован");
    return mergedProgress;
  }
  
  /**
   * Load progress from localStorage only
   */
  private loadProgressFromLocalStorage(userId?: string): UserProgress | null {
    try {
      const savedProgress = localStorage.getItem(this.storageKey);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        
        // Check if the progress belongs to the current user
        if (userId && progress.userId && progress.userId !== userId) {
          logger.warn("Данные в localStorage принадлежат другому пользователю");
          return null;
        }
        
        return progress;
      }
    } catch (error) {
      logger.error("Ошибка загрузки прогресса из localStorage", error);
    }
    return null;
  }
  
  /**
   * Merge two progress objects, preferring the most complete data
   * and using timestamps to resolve conflicts
   */
  private mergeProgressData(local: UserProgress, remote: UserProgress): UserProgress {
    logger.debug("Слияние локальных и удаленных данных прогресса", LogContext.SYNC);
    
    // Check timestamps to determine which data is newer
    const localTimestamp = local.lastUpdated ? new Date(local.lastUpdated).getTime() : 0;
    const remoteTimestamp = remote.lastUpdated ? new Date(remote.lastUpdated).getTime() : 0;
    const localIsNewer = localTimestamp > remoteTimestamp;
    
    logger.debug("Временные метки для слияния", LogContext.SYNC, {
      localTimestamp,
      remoteTimestamp,
      localIsNewer
    });
    
    // Create a new object with properties from both sources
    const merged: UserProgress = {
      // Use the most recent current day
      currentDay: Math.max(local.currentDay, remote.currentDay),
      // Use the most recent start date
      startDate: new Date(local.startDate) > new Date(remote.startDate) ? local.startDate : remote.startDate,
      // Use the highest completed days count
      completedDays: Math.max(local.completedDays, remote.completedDays),
      // Keep the total days the same
      totalDays: local.totalDays,
      // Use the most recent lastUpdated timestamp
      lastUpdated: localIsNewer ? local.lastUpdated : remote.lastUpdated,
      // Initialize with empty objects that we'll fill
      days: {},
      weekReflections: {}
    };
    
    // Get all day numbers from both sources
    const allDayNumbers = Array.from(new Set([
      ...Object.keys(local.days).map(Number),
      ...Object.keys(remote.days).map(Number)
    ]));
    
    // Merge individual day progress
    for (const dayNumber of allDayNumbers) {
      const localDay = local.days[dayNumber];
      const remoteDay = remote.days[dayNumber];
      
      // If day exists only in one source, use that
      if (!localDay) {
        merged.days[dayNumber] = { ...remoteDay };
        continue;
      }
      if (!remoteDay) {
        merged.days[dayNumber] = { ...localDay };
        continue;
      }
      
      // If day exists in both sources, merge the data
      if (this.isDayProgressMoreComplete(localDay, remoteDay)) {
        merged.days[dayNumber] = { ...localDay };
      } else {
        merged.days[dayNumber] = { ...remoteDay };
      }
      
      // Special handling for goals - merge them individually
      if (localDay.goals && remoteDay.goals) {
        const mergedGoals = [...remoteDay.goals];
        
        for (let i = 0; i < localDay.goals.length; i++) {
          if (i < mergedGoals.length) {
            // If the local goal has text but remote doesn't, use local text
            if (localDay.goals[i].text.trim() !== '' && remoteDay.goals[i].text.trim() === '') {
              mergedGoals[i].text = localDay.goals[i].text;
              logger.debug(`Используем локальный текст для задачи ${i+1} дня ${dayNumber}`, LogContext.SYNC);
            }
            // If either source has the goal marked as completed, mark it as completed
            if (localDay.goals[i].completed || remoteDay.goals[i].completed) {
              mergedGoals[i].completed = true;
              logger.debug(`Отмечаем задачу ${i+1} дня ${dayNumber} как выполненную`, LogContext.SYNC);
            }
          } else {
            // If local has more goals than remote, add them
            mergedGoals.push(localDay.goals[i]);
            logger.debug(`Добавляем дополнительную задачу ${i+1} из локальных данных для дня ${dayNumber}`, LogContext.SYNC);
          }
        }
        
        merged.days[dayNumber].goals = mergedGoals;
      }
    }
    
    // Get all week numbers from both sources
    const allWeekNumbers = Array.from(new Set([
      ...Object.keys(local.weekReflections).map(Number),
      ...Object.keys(remote.weekReflections).map(Number)
    ]));
    
    // Merge individual week reflections
    for (const weekNumber of allWeekNumbers) {
      const localReflection = local.weekReflections[weekNumber];
      const remoteReflection = remote.weekReflections[weekNumber];
      
      // If reflection exists only in one source, use that
      if (!localReflection) {
        merged.weekReflections[weekNumber] = { ...remoteReflection };
        continue;
      }
      if (!remoteReflection) {
        merged.weekReflections[weekNumber] = { ...localReflection };
        continue;
      }
      
      // If reflection exists in both sources, use the more complete one
      if (this.isWeekReflectionMoreComplete(localReflection, remoteReflection)) {
        merged.weekReflections[weekNumber] = { ...localReflection };
      } else {
        merged.weekReflections[weekNumber] = { ...remoteReflection };
      }
    }
    
    logger.success("Слияние данных прогресса завершено");
    return merged;
  }
  
  /**
   * Check if day progress A is more complete than day progress B
   */
  private isDayProgressMoreComplete(a: DayProgress, b: DayProgress): boolean {
    // Count non-empty fields in each progress
    const countNonEmpty = (progress: DayProgress): number => {
      let count = 0;
      
      // Count non-empty gratitude items
      count += progress.gratitude.filter(item => item.trim() !== '').length;
      
      // Count non-empty achievements
      count += progress.achievements.filter(item => item.trim() !== '').length;
      
      // Count non-empty goals
      count += progress.goals.filter(goal => goal.text.trim() !== '').length;
      
      // Count completed goals
      count += progress.goals.filter(goal => goal.completed).length;
      
      // Count exercise completion
      count += progress.exerciseCompleted ? 1 : 0;
      
      return count;
    };
    
    return countNonEmpty(a) > countNonEmpty(b);
  }
  
  /**
   * Check if week reflection A is more complete than week reflection B
   */
  private isWeekReflectionMoreComplete(a: WeekReflection, b: WeekReflection): boolean {
    // Count non-empty fields in each reflection
    const countNonEmpty = (reflection: WeekReflection): number => {
      let count = 0;
      
      // Count non-empty gratitude fields
      count += reflection.gratitudeSelf.trim() !== '' ? 1 : 0;
      count += reflection.gratitudeOthers.trim() !== '' ? 1 : 0;
      count += reflection.gratitudeWorld.trim() !== '' ? 1 : 0;
      
      // Count non-empty achievements
      count += reflection.achievements.filter(item => item.trim() !== '').length;
      
      // Count non-empty improvements
      count += reflection.improvements.filter(item => item.trim() !== '').length;
      
      // Count non-empty insights
      count += reflection.insights.filter(item => item.trim() !== '').length;
      
      // Count non-empty rules
      count += reflection.rules.filter(item => item.trim() !== '').length;
      
      // Count exercise completion
      count += reflection.exerciseCompleted ? 1 : 0;
      
      return count;
    };
    
    return countNonEmpty(a) > countNonEmpty(b);
  }

  /**
   * Create default progress object
   */
  createDefaultProgress(): UserProgress {
    const startDate = this.getCurrentMonthSprintStart();
    const today = new Date();
    
    // Проверяем, находится ли текущая дата в пределах спринта
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const sprintYear = startDate.getFullYear();
    const sprintMonth = startDate.getMonth();
    
    let currentDay;
    
    // Если текущий год и месяц совпадают с годом и месяцем спринта (апрель текущего года)
    if (currentYear === sprintYear && currentMonth === sprintMonth) {
      // Стандартный расчет для текущего месяца спринта
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      currentDay = Math.min(Math.max(diffDays, 1), 31);
    } else {
      // Если мы находимся в другом месяце или году
      // Используем текущий день месяца как номер дня спринта, но не больше 31
      currentDay = Math.min(today.getDate(), 31);
    }
    
    return {
      currentDay,
      days: {},
      weekReflections: {},
      completedDays: 0,
      totalDays: 31,
      startDate: startDate.toISOString()
    };
  }

  /**
   * Get the start date of the current month's sprint (April 1st)
   */
  getCurrentMonthSprintStart(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), 3, 1); // Month is 0-indexed, so 3 is April
  }

  /**
   * Update day progress
   */
  async updateDayProgress(progress: UserProgress, dayNumber: number, data: Partial<DayProgress>, userId?: string): Promise<UserProgress> {
    const currentDayProgress = progress.days[dayNumber] || { ...defaultDayProgress };
    const updatedDayProgress = { ...currentDayProgress, ...data };
    
    const newProgress = {
      ...progress,
      days: {
        ...progress.days,
        [dayNumber]: updatedDayProgress
      }
    };
    
    await this.saveProgress(newProgress, userId);
    return newProgress;
  }

  /**
   * Update week reflection
   */
  async updateWeekReflection(progress: UserProgress, weekNumber: number, data: Partial<WeekReflection>, userId?: string): Promise<UserProgress> {
    logger.debug('Обновление недельной рефлексии', LogContext.SYNC, { weekNumber, data });
    const currentReflection = progress.weekReflections[weekNumber] || { ...defaultWeekReflection };
    const updatedReflection = { ...currentReflection, ...data };
    
    const newProgress = {
      ...progress,
      weekReflections: {
        ...progress.weekReflections,
        [weekNumber]: updatedReflection
      }
    };
    
    await this.saveProgress(newProgress, userId);
    return newProgress;
  }

  /**
   * Calculate day completion percentage
   */
  getDayCompletion(progress: UserProgress, dayNumber: number): number {
    const dayProgress = progress.days[dayNumber];

    // For regular days
    if (!this.isReflectionDay(dayNumber)) {
      // Check if dayProgress exists
      if (!dayProgress) {
        logger.debug(`Нет данных прогресса для дня ${dayNumber}`);
        return 0;
      }
      
      let total = 0;
      
      // Check gratitude (15% total, 5% each)
      const gratitudeFilled = dayProgress.gratitude.filter(g => g.trim() !== '').length;
      total += gratitudeFilled * 5; // 5% for each gratitude
      
      // Check achievements (15% total, 5% each)
      const achievementsFilled = dayProgress.achievements.filter(a => a.trim() !== '').length;
      total += achievementsFilled * 5; // 5% for each achievement
      
      // Check goals/tasks (15% for filling + 45% for completing)
      const goalsFilled = dayProgress.goals.filter(g => g.text.trim() !== '').length;
      total += goalsFilled * 5; // 5% for each task filled (max 15%)
      
      // Check completed tasks (15% for each completed task)
      const goalsCompleted = dayProgress.goals.filter(g => g.completed).length;
      total += goalsCompleted * 15; // 15% for each completed task (max 45%)
      
      // Check mindfulness exercise completion (10%)
      if (dayProgress.exerciseCompleted) {
        total += 10; // 10% for completing the exercise
      }
      
      // Cap at 100%
      total = Math.min(total, 100);
      
      // Round to nearest integer
      const finalTotal = Math.round(total);
      
      return finalTotal;
    } 
    // For reflection days
    else {
      const weekNumber = Math.ceil(dayNumber / 7);
      const reflection = progress.weekReflections[weekNumber];
      
      if (!reflection) {
        logger.debug(`Нет данных рефлексии для дня ${dayNumber}, недели ${weekNumber}`);
        return 0;
      }
      
      let total = 0;
      
      // Check gratitude (15% total, 5% each)
      let gratitudeCount = 0;
      if (reflection.gratitudeSelf.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeOthers.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeWorld.trim() !== '') gratitudeCount++;
      total += gratitudeCount * 5; // 5% for each gratitude
      
      // Check achievements (15% total, 5% each)
      const achievementsFilled = reflection.achievements.filter(a => a.trim() !== '').length;
      total += achievementsFilled * 5; // 5% for each achievement
      
      // Check improvements (15% total, 5% each)
      const improvementsFilled = reflection.improvements.filter(i => i.trim() !== '').length;
      total += improvementsFilled * 5; // 5% for each improvement
      
      // Check insights (15% total, 5% each)
      const insightsFilled = reflection.insights.filter(i => i.trim() !== '').length;
      total += insightsFilled * 5; // 5% for each insight
      
      // Check rules (30% total, 10% each)
      const rulesFilled = reflection.rules.filter(r => r.trim() !== '').length;
      total += rulesFilled * 10; // 10% for each rule
      
      // Check mindfulness exercise completion (10%)
      if (reflection.exerciseCompleted) {
        total += 10; // 10% for completing the exercise
      }
      
      // Cap at 100%
      total = Math.min(total, 100);
      
      // Round to nearest integer
      const finalTotal = Math.round(total);
      
      return finalTotal;
    }
  }

  /**
   * Check if a day is a reflection day
   */
  isReflectionDay(dayNumber: number): boolean {
    return dayNumber % 7 === 0;
  }

  /**
   * Check if a day is accessible
   */
  isDayAccessible(dayNumber: number): boolean {
    return true; // All days are accessible
  }

  /**
   * Check if a week is accessible
   */
  isWeekAccessible(weekNumber: number): boolean {
    return true; // All weeks are accessible
  }

  /**
   * Check if all tasks in a day are completed or empty
   */
  areTasksCompleted(progress: UserProgress, dayNumber: number): boolean {
    // Check if progress.days[dayNumber] exists, if not, use default empty goals
    const dayProgress = progress.days[dayNumber] || { 
      goals: [
        { text: '', completed: false },
        { text: '', completed: false },
        { text: '', completed: false }
      ]
    };
    
    // Check if all tasks are either empty or completed
    const allTasksCompletedOrEmpty = dayProgress.goals.every(goal => 
      goal.text.trim() === '' || goal.completed
    );
    
    return allTasksCompletedOrEmpty;
  }

  /**
   * Check if all days in a week are 100% complete
   */
  isWeekComplete(progress: UserProgress, weekNumber: number): boolean {
    // Calculate the start and end day numbers for the week
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = weekNumber * 7;
    
    // Check each day in the week
    for (let dayNumber = startDay; dayNumber <= endDay; dayNumber++) {
      // Skip days beyond the total days (31)
      if (dayNumber > 31) break;
      
      // Get the completion percentage for the day
      const completion = this.getDayCompletion(progress, dayNumber);
      
      // If any day is not 100% complete, return false
      if (completion < 100) {
        return false;
      }
    }
    
    // If we've checked all days and they're all 100% complete, return true
    return true;
  }

  /**
   * Update the current day based on the current date
   */
  async updateCurrentDay(progress: UserProgress, userId?: string): Promise<UserProgress> {
    const startDate = new Date(progress.startDate);
    const today = new Date();
    
    // Check if the current date is within the sprint
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const sprintYear = startDate.getFullYear();
    const sprintMonth = startDate.getMonth();
    
    let currentDay = progress.currentDay;
    
    if (currentYear === sprintYear && currentMonth === sprintMonth) {
      // Standard calculation for the current month of the sprint
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      currentDay = Math.min(Math.max(diffDays, 1), 31);
    } else {
      // If we are in a different month or year
      currentDay = Math.min(today.getDate(), 31);
    }
    
    if (currentDay !== progress.currentDay) {
      logger.info(`Обновление текущего дня с ${progress.currentDay} на ${currentDay}`);
      const updatedProgress = { ...progress, currentDay };
      await this.saveProgress(updatedProgress, userId);
      return updatedProgress;
    }
    
    return progress;
  }

  /**
   * Fetch complete user data from server
   * This is used for full synchronization
   */
  async fetchUserData(userId: string): Promise<UserProgress> {
    try {
      logger.info("Загрузка полных данных пользователя", LogContext.SYNC);
      
      // Set sync status
      const progressWithStatus = this.getProgressWithSyncStatus(
        this.loadProgressFromLocalStorage(userId) || this.createDefaultProgress(),
        'syncing'
      );
      this.saveLocalProgress(progressWithStatus, userId);
      
      // Load from Supabase
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If no record found, create a new one
        if (error.code === 'PGRST116') {
          logger.info("Данные не найдены в Supabase, создаем новые", LogContext.SYNC);
          const newProgress = this.createDefaultProgress();
          const progressWithMetadata = {
            ...newProgress,
            lastSyncTimestamp: Date.now(),
            syncStatus: 'success' as SyncStatus,
            userId
          };
          
          // Save to Supabase
          await this.saveProgressToSupabase(userId, progressWithMetadata);
          
          // Save to localStorage
          this.saveLocalProgress(progressWithMetadata, userId);
          
          return progressWithMetadata;
        }
        
        // Handle other errors
        logger.error("Ошибка загрузки данных из Supabase", error);
        
        // Set error status
        const progressWithError = this.getProgressWithSyncStatus(
          this.loadProgressFromLocalStorage(userId) || this.createDefaultProgress(),
          'error'
        );
        this.saveLocalProgress(progressWithError, userId);
        
        throw error;
      }
      
      if (!data) {
        // Create new progress if no data found
        logger.info("Данные не найдены в Supabase, создаем новые", LogContext.SYNC);
        const newProgress = this.createDefaultProgress();
        const progressWithMetadata = {
          ...newProgress,
          lastSyncTimestamp: Date.now(),
          syncStatus: 'success' as SyncStatus,
          userId
        };
        
        // Save to Supabase
        await this.saveProgressToSupabase(userId, progressWithMetadata);
        
        // Save to localStorage
        this.saveLocalProgress(progressWithMetadata, userId);
        
        return progressWithMetadata;
      }
      
      // Convert from database format to UserProgress format
      const progress = {
        currentDay: data.current_day,
        days: data.days || {},
        weekReflections: data.week_reflections || {},
        completedDays: data.completed_days,
        totalDays: data.total_days,
        startDate: data.start_date,
        lastUpdated: data.updated_at || new Date().toISOString(),
        lastSyncTimestamp: Date.now(),
        syncStatus: 'success' as SyncStatus,
        userId
      };
      
      // Update current day based on the current date
      const updatedProgress = this.updateCurrentDayInProgress(progress);
      
      // Save to localStorage
      this.saveLocalProgress(updatedProgress, userId);
      
      logger.success("Данные пользователя успешно загружены", LogContext.SYNC);
      
      return updatedProgress;
    } catch (error) {
      logger.error("Ошибка при загрузке данных пользователя", error);
      
      // Set error status
      const progressWithError = this.getProgressWithSyncStatus(
        this.loadProgressFromLocalStorage(userId) || this.createDefaultProgress(),
        'error'
      );
      this.saveLocalProgress(progressWithError, userId);
      
      throw error;
    }
  }
  
  /**
   * Fetch only updates since the last sync
   */
  async fetchSyncUpdates(userId: string, since: number): Promise<Partial<UserProgress>> {
    try {
      logger.info(`Загрузка обновлений с ${new Date(since).toISOString()}`, LogContext.SYNC);
      
      // Load from Supabase
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          logger.info("Данные не найдены в Supabase", LogContext.SYNC);
          return {};
        }
        
        logger.error("Ошибка загрузки обновлений из Supabase", error);
        throw error;
      }
      
      if (!data) {
        return {};
      }
      
      // Check if there are updates since the last sync
      const remoteTimestamp = new Date(data.updated_at).getTime();
      if (remoteTimestamp <= since) {
        logger.info("Нет новых обновлений с сервера", LogContext.SYNC);
        return {};
      }
      
      // Convert from database format to UserProgress format
      const updates = {
        currentDay: data.current_day,
        days: data.days || {},
        weekReflections: data.week_reflections || {},
        completedDays: data.completed_days,
        totalDays: data.total_days,
        startDate: data.start_date,
        lastUpdated: data.updated_at,
        lastSyncTimestamp: Date.now()
      };
      
      logger.success("Обновления успешно загружены", LogContext.SYNC);
      
      return updates;
    } catch (error) {
      logger.error("Ошибка при загрузке обновлений", error);
      throw error;
    }
  }
  
  /**
   * Apply updates to the current progress
   */
  applyUpdates(currentProgress: UserProgress, updates: Partial<UserProgress>): UserProgress {
    logger.info("Применение обновлений к текущему прогрессу", LogContext.SYNC);
    
    // Merge the updates with the current progress
    const mergedProgress = this.mergeProgressData(
      currentProgress,
      updates as UserProgress
    );
    
    // Update the sync status and timestamp
    mergedProgress.syncStatus = 'success';
    mergedProgress.lastSyncTimestamp = Date.now();
    
    return mergedProgress;
  }
  
  /**
   * Helper method to update sync status
   */
  getProgressWithSyncStatus(progress: UserProgress, status: SyncStatus): UserProgress {
    return {
      ...progress,
      syncStatus: status,
      lastSyncTimestamp: status === 'success' ? Date.now() : progress.lastSyncTimestamp
    };
  }
}

// Export a singleton instance
export const progressService = new ProgressService();
