import { Progress, DayProgress, WeekProgress } from '../types/progress';
import { supabase } from './supabaseClient';
import { logService } from './logService';
import { ApiResponse } from './authService';
import { conflictResolver } from './conflictResolver';
import { getCurrentMonthSprintStart } from './dateUtils';
import { dateUtils } from './dateUtils';

// Префиксы для ключей в localStorage
const PROGRESS_KEY = 'progress';
const LAST_SYNC_KEY = 'last_sync';

/**
 * Сервис для работы с прогрессом пользователя
 */
export const progressService = {
  /**
   * Получение прогресса пользователя
   * @returns Прогресс пользователя
   */
  async getUserProgress(userId: string): Promise<ApiResponse<Progress>> {
    try {
      // Сначала пробуем получить прогресс из Supabase
      const { data: progressData, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (!error && progressData) {
        // Преобразуем данные из Supabase в формат Progress
        const progress: Progress = {
          startDate: progressData.start_date,
          currentDay: progressData.current_day,
          currentWeek: progressData.current_week,
          days: progressData.days || {},
          weekReflections: progressData.week_reflections || {}
        };
        
        return { success: true, data: progress };
      }
      
      // Если в Supabase нет данных, пробуем получить из localStorage
      const progressJson = localStorage.getItem(`progress_${userId}`);
      if (!progressJson) {
        return { success: false, error: 'Progress not found' };
      }
      
      const progress = JSON.parse(progressJson) as Progress;
      
      return { success: true, data: progress };
    } catch (error) {
      logService.error('Error getting user progress:', error);
      return { success: false, error: 'Failed to get progress' };
    }
  },
  
  /**
   * Обновление прогресса пользователя
   */
  async updateUserProgress(userId: string, progressData: Progress): Promise<ApiResponse<Progress>> {
    try {
      // Пробуем обновить прогресс в Supabase с повторными попытками
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { error } = await supabase
            .from('user_progress')
            .upsert({
              user_id: userId,
              start_date: progressData.startDate,
              current_day: progressData.currentDay,
              current_week: progressData.currentWeek,
              days: progressData.days,
              week_reflections: progressData.weekReflections
            });
            
          if (!error) {
            // Сохраняем в localStorage
            localStorage.setItem(`progress_${userId}`, JSON.stringify(progressData));
            return { success: true, data: progressData };
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      throw new Error('Failed to update progress after retries');
    } catch (error) {
      logService.error('Error updating user progress:', error);
      
      // В случае ошибки пробуем сохранить локально
      try {
        localStorage.setItem(`progress_${userId}`, JSON.stringify(progressData));
        return { success: true, data: progressData };
      } catch (localError) {
        logService.error('Error saving progress locally:', localError);
        return { success: false, error: 'Failed to update progress' };
      }
    }
  },
  
  /**
   * Инициализация прогресса пользователя
   */
  async initUserProgress(userId: string): Promise<Progress> {
    // Получение текущей даты начала спринта
    const startDate = new Date().toISOString();
    const currentDay = 1;
    const currentWeek = 1;
    
    // Создание нового прогресса
    const newProgress: Progress = {
      startDate,
      currentDay,
      currentWeek,
      days: {},
      weekReflections: {}
    };
    
    // Сохраняем прогресс
    const result = await this.updateUserProgress(userId, newProgress);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to initialize progress');
    }
    
    return result.data;
  },
  
  /**
   * Получение прогресса дня
   */
  async getDayProgress(userId: string, dayNumber: number): Promise<ApiResponse<any>> {
    try {
      // Получаем прогресс пользователя
      const progressResponse = await this.getUserProgress(userId);
      
      if (!progressResponse.success || !progressResponse.data) {
        return {
          success: false,
          error: progressResponse.error || 'Не удалось получить прогресс пользователя'
        };
      }
      
      const progress = progressResponse.data;
      
      // Получаем прогресс дня
      const dayProgress = progress.days[dayNumber];
      
      if (!dayProgress) {
        return {
          success: false,
          error: 'Прогресс дня не найден'
        };
      }
      
      return {
        success: true,
        data: dayProgress
      };
    } catch (error) {
      logService.error('Ошибка при получении прогресса дня', error);
      return {
        success: false,
        error: 'Произошла ошибка при получении прогресса дня'
      };
    }
  },
  
  /**
   * Обновление прогресса дня
   */
  async updateDayProgress(userId: string, dayNumber: number, dayData: any): Promise<ApiResponse<any>> {
    try {
      // Получаем прогресс пользователя
      const progressResponse = await this.getUserProgress(userId);
      
      if (!progressResponse.success || !progressResponse.data) {
        return {
          success: false,
          error: progressResponse.error || 'Не удалось получить прогресс пользователя'
        };
      }
      
      const progress = progressResponse.data;
      
      // Получаем текущий прогресс дня или создаем новый
      const currentDayProgress = progress.days[dayNumber] || {
        completed: false,
        gratitude: ['', '', ''],
        achievements: ['', '', ''],
        goals: [
          { text: '', completed: false },
          { text: '', completed: false },
          { text: '', completed: false }
        ],
        exerciseCompleted: false
      };
      
      // Обновляем прогресс дня
      const updatedDayProgress = {
        ...currentDayProgress,
        ...dayData
      };
      
      // Обновляем прогресс пользователя
      progress.days[dayNumber] = updatedDayProgress;
      
      // Сохраняем обновленный прогресс
      const updateResponse = await this.updateUserProgress(userId, progress);
      
      if (!updateResponse.success) {
        return {
          success: false,
          error: updateResponse.error || 'Не удалось обновить прогресс пользователя'
        };
      }
      
      return {
        success: true,
        data: updatedDayProgress
      };
    } catch (error) {
      logService.error('Ошибка при обновлении прогресса дня', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении прогресса дня'
      };
    }
  },
  
  /**
   * Получение недельной рефлексии
   */
  async getWeekReflection(userId: string, weekNumber: number): Promise<ApiResponse<any>> {
    try {
      // Получаем прогресс пользователя
      const progressResponse = await this.getUserProgress(userId);
      
      if (!progressResponse.success || !progressResponse.data) {
        return {
          success: false,
          error: progressResponse.error || 'Не удалось получить прогресс пользователя'
        };
      }
      
      const progress = progressResponse.data;
      
      // Получаем недельную рефлексию
      const weekReflection = progress.weekReflections[weekNumber];
      
      if (!weekReflection) {
        return {
          success: false,
          error: 'Недельная рефлексия не найдена'
        };
      }
      
      return {
        success: true,
        data: weekReflection
      };
    } catch (error) {
      logService.error('Ошибка при получении недельной рефлексии', error);
      return {
        success: false,
        error: 'Произошла ошибка при получении недельной рефлексии'
      };
    }
  },
  
  /**
   * Обновление недельной рефлексии
   */
  async updateWeekReflection(userId: string, weekNumber: number, reflectionData: any): Promise<ApiResponse<any>> {
    try {
      // Получаем прогресс пользователя
      const progressResponse = await this.getUserProgress(userId);
      
      if (!progressResponse.success || !progressResponse.data) {
        return {
          success: false,
          error: progressResponse.error || 'Не удалось получить прогресс пользователя'
        };
      }
      
      const progress = progressResponse.data;
      
      // Получаем текущую недельную рефлексию или создаем новую
      const currentReflection = progress.weekReflections[weekNumber] || {
        gratitudeSelf: '',
        gratitudeOthers: '',
        gratitudeWorld: '',
        achievements: ['', '', ''],
        improvements: ['', '', ''],
        insights: ['', '', ''],
        rules: ['', '', ''],
        exerciseCompleted: false
      };
      
      // Обновляем недельную рефлексию
      const updatedReflection = {
        ...currentReflection,
        ...reflectionData
      };
      
      // Обновляем прогресс пользователя
      progress.weekReflections[weekNumber] = updatedReflection;
      
      // Сохраняем обновленный прогресс
      const updateResponse = await this.updateUserProgress(userId, progress);
      
      if (!updateResponse.success) {
        return {
          success: false,
          error: updateResponse.error || 'Не удалось обновить прогресс пользователя'
        };
      }
      
      return {
        success: true,
        data: updatedReflection
      };
    } catch (error) {
      logService.error('Ошибка при обновлении недельной рефлексии', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении недельной рефлексии'
      };
    }
  },
  
  /**
   * Вычисление процента заполнения дня
   */
  getDayCompletion(dayProgress: any): number {
    try {
      // Для обычных дней
      let total = 0;
      
      // Проверка благодарностей (15% всего, 5% каждая)
      const gratitudeFilled = dayProgress.gratitude.filter((g: string) => g.trim() !== '').length;
      total += gratitudeFilled * 5; // 5% за каждую благодарность
      
      // Проверка достижений (15% всего, 5% каждое)
      const achievementsFilled = dayProgress.achievements.filter((a: string) => a.trim() !== '').length;
      total += achievementsFilled * 5; // 5% за каждое достижение
      
      // Проверка целей/задач (15% за заполнение + 45% за выполнение)
      const goalsFilled = dayProgress.goals.filter((g: { text: string }) => g.text.trim() !== '').length;
      total += goalsFilled * 5; // 5% за каждую заполненную задачу (макс. 15%)
      
      // Проверка выполненных задач (15% за каждую выполненную задачу)
      const goalsCompleted = dayProgress.goals.filter((g: { completed: boolean }) => g.completed).length;
      total += goalsCompleted * 15; // 15% за каждую выполненную задачу (макс. 45%)
      
      // Проверка выполнения упражнения (10%)
      if (dayProgress.exerciseCompleted) {
        total += 10; // 10% за выполнение упражнения
      }
      
      // Ограничение до 100%
      total = Math.min(total, 100);
      
      // Округление до ближайшего целого
      return Math.round(total);
    } catch (error) {
      logService.error('Ошибка при вычислении заполненности дня', error);
      return 0;
    }
  },
  
  /**
   * Вычисление процента заполнения недельной рефлексии
   */
  getReflectionCompletion(reflection: any): number {
    try {
      let total = 0;
      
      // Проверка благодарностей (15% всего, 5% каждая)
      let gratitudeCount = 0;
      if (reflection.gratitudeSelf && reflection.gratitudeSelf.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeOthers && reflection.gratitudeOthers.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeWorld && reflection.gratitudeWorld.trim() !== '') gratitudeCount++;
      total += gratitudeCount * 5; // 5% за каждую благодарность (макс. 15%)
      
      // Проверка достижений (15% всего, 5% каждое)
      const achievementsFilled = reflection.achievements ? reflection.achievements.filter((a: string) => a && a.trim() !== '').length : 0;
      total += achievementsFilled * 5; // 5% за каждое достижение (макс. 15%)
      
      // Проверка улучшений/зоны роста (15% всего, 5% каждое)
      const improvementsFilled = reflection.improvements ? reflection.improvements.filter((i: string) => i && i.trim() !== '').length : 0;
      total += improvementsFilled * 5; // 5% за каждое улучшение (макс. 15%)
      
      // Проверка инсайтов (15% всего, 5% каждый)
      const insightsFilled = reflection.insights ? reflection.insights.filter((i: string) => i && i.trim() !== '').length : 0;
      total += insightsFilled * 5; // 5% за каждый инсайт (макс. 15%)
      
      // Проверка правил (30% всего, 10% каждое)
      const rulesFilled = reflection.rules ? reflection.rules.filter((r: string) => r && r.trim() !== '').length : 0;
      total += rulesFilled * 10; // 10% за каждое правило (макс. 30%)
      
      // Проверка выполнения упражнения (10%)
      if (reflection.exerciseCompleted) {
        total += 10; // 10% за выполнение упражнения
      }
      
      // Ограничение до 100%
      total = Math.min(total, 100);
      
      // Округление до ближайшего целого
      return Math.round(total);
    } catch (error) {
      logService.error('Ошибка при вычислении заполненности рефлексии', error);
      return 0;
    }
  },
  
  /**
   * Проверка, является ли день днем рефлексии
   */
  isReflectionDay(dayNumber: number): boolean {
    return dayNumber % 7 === 0;
  },
  
  /**
   * Получение номера недели для дня
   */
  getWeekNumber(dayNumber: number): number {
    return Math.ceil(dayNumber / 7);
  },
  
  /**
   * Получение прогресса пользователя
   * @returns Прогресс пользователя
   */
  async getProgress(): Promise<Progress> {
    try {
      // Получаем данные из localStorage
      const storedData = localStorage.getItem(PROGRESS_KEY);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Проверяем, что все обязательные поля присутствуют
        if (this.isValidProgress(parsedData)) {
          return parsedData;
        }
      }
      
      // Если данных нет или они невалидны, создаем новый прогресс
      const newProgress = this.createNewProgress();
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
      return newProgress;
    } catch (error) {
      logService.error('Ошибка при получении прогресса', error);
      // В случае ошибки возвращаем новый прогресс
      return this.createNewProgress();
    }
  },
  
  /**
   * Проверка валидности прогресса
   * @param data Данные для проверки
   * @returns true, если данные валидны
   */
  isValidProgress(data: unknown): data is Progress {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    const progress = data as Progress;
    return (
      typeof progress.startDate === 'string' &&
      typeof progress.currentDay === 'number' &&
      typeof progress.currentWeek === 'number' &&
      typeof progress.days === 'object' &&
      typeof progress.weekReflections === 'object'
    );
  },
  
  /**
   * Создание нового прогресса
   * @returns Новый прогресс
   */
  createNewProgress(): Progress {
    const currentDate = new Date();
    const startDate = dateUtils.formatDate(currentDate);
    const currentDay = dateUtils.getCurrentDayNumber();
    const currentWeek = dateUtils.getCurrentWeekNumber();
    
    return {
      startDate,
      currentDay,
      currentWeek,
      days: {},
      weekReflections: {}
    };
  }
};
