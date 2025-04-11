import { UserProgress, DayProgress, WeekReflection } from '../context/ProgressContext';
import { logService } from './logService';

/**
 * Сервис для разрешения конфликтов при синхронизации данных
 */
export const conflictResolver = {
  /**
   * Разрешение конфликтов для прогресса пользователя
   * @param localProgress Локальный прогресс
   * @param remoteProgress Удаленный прогресс
   * @returns Объединенный прогресс
   */
  resolveProgressConflict: (localProgress: UserProgress, remoteProgress: UserProgress): UserProgress => {
    try {
      // Создаем новый объект прогресса
      const mergedProgress: UserProgress = {
        // Используем более раннюю дату начала
        startDate: new Date(Math.min(
          localProgress.startDate.getTime(), 
          remoteProgress.startDate.getTime()
        )),
        // Используем более поздний текущий день
        currentDay: Math.max(localProgress.currentDay, remoteProgress.currentDay),
        days: {},
        weekReflections: {}
      };
      
      // Объединяем дни
      const allDayIds = new Set([
        ...Object.keys(localProgress.days),
        ...Object.keys(remoteProgress.days)
      ].map(Number));
      
      allDayIds.forEach(dayId => {
        const localDay = localProgress.days[dayId];
        const remoteDay = remoteProgress.days[dayId];
        
        if (localDay && remoteDay) {
          // Если день есть в обоих прогрессах, выбираем более заполненный
          mergedProgress.days[dayId] = conflictResolver.resolveDayConflict(localDay, remoteDay);
        } else if (localDay) {
          // Если день есть только в локальном прогрессе
          mergedProgress.days[dayId] = localDay;
        } else if (remoteDay) {
          // Если день есть только в удаленном прогрессе
          mergedProgress.days[dayId] = remoteDay;
        }
      });
      
      // Объединяем недельные рефлексии
      const allWeekIds = new Set([
        ...Object.keys(localProgress.weekReflections),
        ...Object.keys(remoteProgress.weekReflections)
      ].map(Number));
      
      allWeekIds.forEach(weekId => {
        const localReflection = localProgress.weekReflections[weekId];
        const remoteReflection = remoteProgress.weekReflections[weekId];
        
        if (localReflection && remoteReflection) {
          // Если рефлексия есть в обоих прогрессах, выбираем более заполненную
          mergedProgress.weekReflections[weekId] = conflictResolver.resolveReflectionConflict(
            localReflection, 
            remoteReflection
          );
        } else if (localReflection) {
          // Если рефлексия есть только в локальном прогрессе
          mergedProgress.weekReflections[weekId] = localReflection;
        } else if (remoteReflection) {
          // Если рефлексия есть только в удаленном прогрессе
          mergedProgress.weekReflections[weekId] = remoteReflection;
        }
      });
      
      return mergedProgress;
    } catch (error) {
      logService.error('Ошибка при разрешении конфликта прогресса', error);
      // В случае ошибки возвращаем локальный прогресс
      return localProgress;
    }
  },
  
  /**
   * Разрешение конфликтов для дня
   * @param localDay Локальный день
   * @param remoteDay Удаленный день
   * @returns Объединенный день
   */
  resolveDayConflict: (localDay: DayProgress, remoteDay: DayProgress): DayProgress => {
    try {
      // Вычисляем заполненность каждого дня
      const localCompletion = conflictResolver.calculateDayCompletion(localDay);
      const remoteCompletion = conflictResolver.calculateDayCompletion(remoteDay);
      
      // Если один из дней заполнен больше, выбираем его
      if (localCompletion > remoteCompletion) {
        return localDay;
      } else if (remoteCompletion > localCompletion) {
        return remoteDay;
      } else {
        // Если заполнение одинаковое, объединяем данные
        return {
          completed: localDay.completed || remoteDay.completed,
          gratitude: conflictResolver.mergeArrays(localDay.gratitude, remoteDay.gratitude),
          additionalGratitude: conflictResolver.mergeArrays(
            localDay.additionalGratitude || [], 
            remoteDay.additionalGratitude || []
          ),
          achievements: conflictResolver.mergeArrays(localDay.achievements, remoteDay.achievements),
          additionalAchievements: conflictResolver.mergeArrays(
            localDay.additionalAchievements || [], 
            remoteDay.additionalAchievements || []
          ),
          goals: conflictResolver.mergeGoals(localDay.goals, remoteDay.goals),
          exerciseCompleted: localDay.exerciseCompleted || remoteDay.exerciseCompleted
        };
      }
    } catch (error) {
      logService.error('Ошибка при разрешении конфликта дня', error);
      // В случае ошибки возвращаем локальный день
      return localDay;
    }
  },
  
  /**
   * Разрешение конфликтов для недельной рефлексии
   * @param localReflection Локальная рефлексия
   * @param remoteReflection Удаленная рефлексия
   * @returns Объединенная рефлексия
   */
  resolveReflectionConflict: (localReflection: WeekReflection, remoteReflection: WeekReflection): WeekReflection => {
    try {
      // Вычисляем заполненность каждой рефлексии
      const localCompletion = conflictResolver.calculateReflectionCompletion(localReflection);
      const remoteCompletion = conflictResolver.calculateReflectionCompletion(remoteReflection);
      
      // Если одна из рефлексий заполнена больше, выбираем ее
      if (localCompletion > remoteCompletion) {
        return localReflection;
      } else if (remoteCompletion > localCompletion) {
        return remoteReflection;
      } else {
        // Если заполнение одинаковое, объединяем данные
        return {
          gratitudeSelf: localReflection.gratitudeSelf || remoteReflection.gratitudeSelf,
          gratitudeOthers: localReflection.gratitudeOthers || remoteReflection.gratitudeOthers,
          gratitudeWorld: localReflection.gratitudeWorld || remoteReflection.gratitudeWorld,
          achievements: conflictResolver.mergeArrays(localReflection.achievements, remoteReflection.achievements),
          improvements: conflictResolver.mergeArrays(localReflection.improvements, remoteReflection.improvements),
          insights: conflictResolver.mergeArrays(localReflection.insights, remoteReflection.insights),
          rules: conflictResolver.mergeArrays(localReflection.rules, remoteReflection.rules),
          exerciseCompleted: localReflection.exerciseCompleted || remoteReflection.exerciseCompleted
        };
      }
    } catch (error) {
      logService.error('Ошибка при разрешении конфликта рефлексии', error);
      // В случае ошибки возвращаем локальную рефлексию
      return localReflection;
    }
  },
  
  /**
   * Вычисление заполненности дня
   * @param day День
   * @returns Процент заполненности (0-100)
   */
  calculateDayCompletion: (day: DayProgress): number => {
    try {
      let total = 0;
      
      // Проверка благодарностей (15% всего, 5% каждая)
      const gratitudeFilled = day.gratitude.filter(g => g.trim() !== '').length;
      total += gratitudeFilled * 5; // 5% за каждую благодарность
      
      // Проверка достижений (15% всего, 5% каждое)
      const achievementsFilled = day.achievements.filter(a => a.trim() !== '').length;
      total += achievementsFilled * 5; // 5% за каждое достижение
      
      // Проверка целей/задач (15% за заполнение + 45% за выполнение)
      const goalsFilled = day.goals.filter(g => g.text.trim() !== '').length;
      total += goalsFilled * 5; // 5% за каждую заполненную задачу (макс. 15%)
      
      // Проверка выполненных задач (15% за каждую выполненную задачу)
      const goalsCompleted = day.goals.filter(g => g.completed).length;
      total += goalsCompleted * 15; // 15% за каждую выполненную задачу (макс. 45%)
      
      // Проверка выполнения упражнения (10%)
      if (day.exerciseCompleted) {
        total += 10; // 10% за выполнение упражнения
      }
      
      // Ограничение до 100%
      total = Math.min(total, 100);
      
      return total;
    } catch (error) {
      logService.error('Ошибка при вычислении заполненности дня', error);
      return 0;
    }
  },
  
  /**
   * Вычисление заполненности недельной рефлексии
   * @param reflection Недельная рефлексия
   * @returns Процент заполненности (0-100)
   */
  calculateReflectionCompletion: (reflection: WeekReflection): number => {
    try {
      let total = 0;
      
      // Проверка благодарностей (15% всего, 5% каждая)
      let gratitudeCount = 0;
      if (reflection.gratitudeSelf && reflection.gratitudeSelf.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeOthers && reflection.gratitudeOthers.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeWorld && reflection.gratitudeWorld.trim() !== '') gratitudeCount++;
      total += gratitudeCount * 5; // 5% за каждую благодарность (макс. 15%)
      
      // Проверка достижений (15% всего, 5% каждое)
      const achievementsFilled = reflection.achievements.filter(a => a && a.trim() !== '').length;
      total += achievementsFilled * 5; // 5% за каждое достижение (макс. 15%)
      
      // Проверка улучшений/зоны роста (15% всего, 5% каждое)
      const improvementsFilled = reflection.improvements.filter(i => i && i.trim() !== '').length;
      total += improvementsFilled * 5; // 5% за каждое улучшение (макс. 15%)
      
      // Проверка инсайтов (15% всего, 5% каждый)
      const insightsFilled = reflection.insights.filter(i => i && i.trim() !== '').length;
      total += insightsFilled * 5; // 5% за каждый инсайт (макс. 15%)
      
      // Проверка правил (30% всего, 10% каждое)
      const rulesFilled = reflection.rules.filter(r => r && r.trim() !== '').length;
      total += rulesFilled * 10; // 10% за каждое правило (макс. 30%)
      
      // Проверка выполнения упражнения (10%)
      if (reflection.exerciseCompleted) {
        total += 10; // 10% за выполнение упражнения
      }
      
      // Ограничение до 100%
      total = Math.min(total, 100);
      
      return total;
    } catch (error) {
      logService.error('Ошибка при вычислении заполненности рефлексии', error);
      return 0;
    }
  },
  
  /**
   * Объединение массивов строк
   * @param arr1 Первый массив
   * @param arr2 Второй массив
   * @returns Объединенный массив
   */
  mergeArrays: (arr1: string[], arr2: string[]): string[] => {
    try {
      // Создаем массив нужной длины
      const length = Math.max(arr1.length, arr2.length);
      const result: string[] = new Array(length).fill('');
      
      // Заполняем массив, выбирая непустые значения
      for (let i = 0; i < length; i++) {
        const value1 = i < arr1.length ? arr1[i] : '';
        const value2 = i < arr2.length ? arr2[i] : '';
        
        // Выбираем непустое значение или первое, если оба непустые
        result[i] = value1.trim() !== '' ? value1 : value2;
      }
      
      return result;
    } catch (error) {
      logService.error('Ошибка при объединении массивов', error);
      return arr1;
    }
  },
  
  /**
   * Объединение массивов целей
   * @param goals1 Первый массив целей
   * @param goals2 Второй массив целей
   * @returns Объединенный массив целей
   */
  mergeGoals: (
    goals1: { text: string; completed: boolean }[], 
    goals2: { text: string; completed: boolean }[]
  ): { text: string; completed: boolean }[] => {
    try {
      // Создаем массив нужной длины
      const length = Math.max(goals1.length, goals2.length);
      const result: { text: string; completed: boolean }[] = new Array(length).fill({ text: '', completed: false });
      
      // Заполняем массив, выбирая непустые значения
      for (let i = 0; i < length; i++) {
        const goal1 = i < goals1.length ? goals1[i] : { text: '', completed: false };
        const goal2 = i < goals2.length ? goals2[i] : { text: '', completed: false };
        
        // Выбираем текст (предпочитаем непустой)
        const text = goal1.text.trim() !== '' ? goal1.text : goal2.text;
        
        // Для статуса выполнения выбираем true, если хотя бы один true
        const completed = goal1.completed || goal2.completed;
        
        result[i] = { text, completed };
      }
      
      return result;
    } catch (error) {
      logService.error('Ошибка при объединении целей', error);
      return goals1;
    }
  }
};
