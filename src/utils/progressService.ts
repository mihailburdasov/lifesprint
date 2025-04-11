import { UserProgress } from '../context/ProgressContext';
import { supabase } from './supabaseClient';
import { logService } from './logService';
import { ApiResponse } from './authService';
import { conflictResolver } from './conflictResolver';
import { getCurrentMonthSprintStart } from './dateUtils';

// Префиксы для ключей в localStorage
const PROGRESS_PREFIX = 'lifesprint_progress_';

/**
 * Сервис для работы с прогрессом пользователя
 */
export const progressService = {
  /**
   * Получение прогресса пользователя
   */
  async getUserProgress(userId: string): Promise<ApiResponse<UserProgress>> {
    try {
      // Сначала пробуем получить прогресс из Supabase
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!progressError && progressData) {
        // Преобразуем данные из Supabase в формат UserProgress
        const progress: UserProgress = {
          startDate: new Date(progressData.start_date),
          currentDay: progressData.current_day,
          days: progressData.days || {},
          weekReflections: progressData.week_reflections || {}
        };
        
        return {
          success: true,
          data: progress
        };
      }
      
      // Если не удалось получить из Supabase, пробуем из localStorage
      const progressJson = localStorage.getItem(`${PROGRESS_PREFIX}${userId}`);
      
      if (!progressJson) {
        // Если прогресс не найден, инициализируем его
        const newProgress = await this.initUserProgress(userId);
        
        return {
          success: true,
          data: newProgress
        };
      }
      
      const progress = JSON.parse(progressJson) as UserProgress;
      
      // Преобразование строковой даты в объект Date
      if (typeof progress.startDate === 'string') {
        progress.startDate = new Date(progress.startDate);
      }
      
      return {
        success: true,
        data: progress
      };
    } catch (error) {
      logService.error('Ошибка при получении прогресса пользователя', error);
      return {
        success: false,
        error: 'Произошла ошибка при получении прогресса пользователя'
      };
    }
  },
  
  /**
   * Обновление прогресса пользователя
   */
  async updateUserProgress(userId: string, progressData: UserProgress): Promise<ApiResponse<UserProgress>> {
    try {
      // Пробуем обновить прогресс в Supabase с повторными попытками
      let attempts = 0;
      const maxAttempts = 3;
      let progressError = null;
      
      // Функция для вычисления времени задержки
      const getDelayTime = (attemptNumber: number): number => {
        return 1000 * Math.pow(2, attemptNumber - 1);
      };
      
      while (attempts < maxAttempts) {
        try {
          const { error } = await supabase
            .from('user_progress')
            .upsert({
              user_id: userId,
              start_date: progressData.startDate.toISOString(),
              current_day: progressData.currentDay,
              days: progressData.days,
              week_reflections: progressData.weekReflections,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
          
          if (!error) {
            // Успешное обновление
            return {
              success: true,
              data: progressData
            };
          }
          
          progressError = error;
          attempts++;
          
          // Ждем перед следующей попыткой (экспоненциальная задержка)
          if (attempts < maxAttempts) {
            const delayTime = getDelayTime(attempts);
            await new Promise(resolve => setTimeout(resolve, delayTime));
          }
        } catch (e) {
          progressError = e instanceof Error ? e : new Error(String(e));
          attempts++;
          
          // Ждем перед следующей попыткой
          if (attempts < maxAttempts) {
            const delayTime = getDelayTime(attempts);
            await new Promise(resolve => setTimeout(resolve, delayTime));
          }
        }
      }
      
      // Если все попытки не удались, проверяем наличие локальных данных и разрешаем конфликты
      const localProgressJson = localStorage.getItem(`${PROGRESS_PREFIX}${userId}`);
      if (localProgressJson) {
        try {
          const localProgress = JSON.parse(localProgressJson) as UserProgress;
          
          // Преобразуем строковую дату в объект Date
          if (typeof localProgress.startDate === 'string') {
            localProgress.startDate = new Date(localProgress.startDate);
          }
          
          // Разрешаем конфликты между локальными и новыми данными
          const mergedProgress = conflictResolver.resolveProgressConflict(localProgress, progressData);
          
          // Сохраняем объединенные данные
          localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(mergedProgress));
          
          // Обновляем данные для возврата
          progressData = mergedProgress;
        } catch (error) {
          logService.error('Ошибка при разрешении конфликтов прогресса', error);
          // В случае ошибки просто сохраняем новые данные
          localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(progressData));
        }
      } else {
        // Если локальных данных нет, просто сохраняем новые
        localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(progressData));
      }
      
      return {
        success: false,
        error: 'Не удалось синхронизировать данные с сервером. Данные сохранены локально и будут синхронизированы позже.',
        data: progressData
      };
    } catch (error) {
      logService.error('Ошибка при обновлении прогресса пользователя', error);
      
      // В случае ошибки сохраняем в localStorage
      localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(progressData));
      
      return {
        success: false,
        error: 'Произошла ошибка при обновлении прогресса пользователя. Данные сохранены локально и будут синхронизированы позже.',
        data: progressData
      };
    }
  },
  
  /**
   * Инициализация прогресса пользователя
   */
  async initUserProgress(userId: string): Promise<UserProgress> {
    // Получение текущей даты начала спринта
    const startDate = getCurrentMonthSprintStart();
    
    // Использование текущего календарного дня
    const today = new Date();
    const calendarDay = today.getDate();
    const currentDay = Math.min(Math.max(calendarDay, 1), 28); // Между 1 и 28
    
    // Создание нового прогресса
    const newProgress: UserProgress = {
      startDate,
      currentDay,
      days: {},
      weekReflections: {}
    };
    
    try {
      // Сначала пробуем сохранить в Supabase
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          start_date: startDate.toISOString(),
          current_day: currentDay,
          days: {},
          week_reflections: {}
        });
      
      if (error) {
        logService.error('Ошибка при инициализации прогресса в Supabase', error);
        // Если не удалось сохранить в Supabase, сохраняем локально
        localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(newProgress));
      }
    } catch (error) {
      logService.error('Ошибка при инициализации прогресса', error);
      // В случае ошибки сохраняем локально
      localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(newProgress));
    }
    
    return newProgress;
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
  }
};
