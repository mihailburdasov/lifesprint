import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentMonthSprintStart } from '../utils/dateUtils';
import { progressService } from '../utils/progressService';
import { syncService } from '../utils/syncService';
import { useUser } from './UserContext';
import { logService } from '../utils/logService';

// Define types for our context
export interface DayProgress {
  completed: boolean;
  gratitude: string[];
  additionalGratitude?: string[]; // Additional gratitude fields (not counted in progress)
  achievements: string[];
  additionalAchievements?: string[]; // Additional achievement fields (not counted in progress)
  goals: { text: string; completed: boolean }[];
  exerciseCompleted: boolean;
}

export interface WeekReflection {
  gratitudeSelf: string;
  gratitudeOthers: string;
  gratitudeWorld: string;
  achievements: string[];
  improvements: string[];
  insights: string[];
  rules: string[];
  exerciseCompleted: boolean;
}

export interface UserProgress {
  startDate: Date;
  currentDay: number;
  days: Record<number, DayProgress>;
  weekReflections: Record<number, WeekReflection>;
}

interface ProgressContextType {
  progress: UserProgress;
  updateDayProgress: (dayNumber: number, data: Partial<DayProgress>) => void;
  updateWeekReflection: (weekNumber: number, data: Partial<WeekReflection>) => void;
  getDayCompletion: (dayNumber: number) => number;
  getReflectionDayWidgetProgress: (dayNumber: number) => Record<string, number>;
  isReflectionDay: (dayNumber: number) => boolean;
  isDayAccessible: (dayNumber: number) => boolean;
  isWeekAccessible: (weekNumber: number) => boolean;
}

// Create the context
const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Default empty day progress
const defaultDayProgress: DayProgress = {
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

// Default empty week reflection
const defaultWeekReflection: WeekReflection = {
  gratitudeSelf: '',
  gratitudeOthers: '',
  gratitudeWorld: '',
  achievements: ['', '', ''],
  improvements: ['', '', ''],
  insights: ['', '', ''],
  rules: ['', '', ''],
  exerciseCompleted: false
};

// Provider component
export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUser();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Загрузка прогресса пользователя при авторизации
  useEffect(() => {
    const loadUserProgress = async () => {
      if (isAuthenticated && user) {
        setIsLoading(true);
        
        try {
          // Получаем прогресс пользователя через progressService
          const response = await progressService.getUserProgress(user.id);
          
          if (response.success && response.data) {
            setProgress(response.data);
          } else {
            // Если прогресс не найден, создаем новый
            const newProgress = await progressService.initUserProgress(user.id);
            setProgress(newProgress);
          }
        } catch (error) {
          logService.error('Ошибка при получении прогресса пользователя', error);
          
          // В случае ошибки создаем новый прогресс
          const currentMonthStart = getCurrentMonthSprintStart();
          const today = new Date();
          const diffTime = today.getTime() - currentMonthStart.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          const currentDay = Math.min(Math.max(diffDays, 1), 28); // Между 1 и 28
          
          const newProgress: UserProgress = {
            startDate: currentMonthStart,
            currentDay: currentDay,
            days: {},
            weekReflections: {}
          };
          
          setProgress(newProgress);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Если пользователь не авторизован, сбрасываем прогресс
        setProgress(null);
        setIsLoading(false);
      }
    };
    
    loadUserProgress();
  }, [isAuthenticated, user]);
  
  // Сохранение прогресса пользователя при изменении
  useEffect(() => {
    const saveUserProgress = async () => {
      if (isAuthenticated && user && progress) {
        try {
          // Обновляем прогресс через progressService
          const response = await progressService.updateUserProgress(user.id, progress);
          
          // Если обновление не удалось, добавляем операцию в очередь синхронизации
          if (!response.success) {
            syncService.addToSyncQueue(user.id, {
              type: 'progress',
              action: 'update',
              data: progress
            });
          }
        } catch (error) {
          logService.error('Ошибка при сохранении прогресса пользователя', error);
          
          // В случае ошибки добавляем операцию в очередь синхронизации
          syncService.addToSyncQueue(user.id, {
            type: 'progress',
            action: 'update',
            data: progress
          });
        }
      }
    };
    
    // Используем debounce, чтобы не вызывать сохранение слишком часто
    const timeoutId = setTimeout(saveUserProgress, 500);
    
    return () => clearTimeout(timeoutId);
  }, [progress, isAuthenticated, user]);
  
  // Update current day to always show the current calendar day
  useEffect(() => {
    if (!progress) return;
    
    // Function to update the current day to match the calendar day
    const updateCurrentDay = () => {
      if (!progress) return;
      
      const today = new Date();
      // Get the current day of the month (1-31)
      const calendarDay = today.getDate();
      // Ensure it's between 1-28 for our app's purposes
      const newCurrentDay = Math.min(Math.max(calendarDay, 1), 28);
      
      // Only update if the current day has changed
      if (newCurrentDay !== progress.currentDay) {
        setProgress(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentDay: newCurrentDay
          };
        });
      }
    };
    
    // Update immediately
    updateCurrentDay();
    
    // Set up an interval to check for date changes
    // This will run at midnight to update the current day
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set timeout to run at midnight
    const midnightTimeout = setTimeout(() => {
      updateCurrentDay();
      
      // Then set up a daily interval
      const dailyInterval = setInterval(updateCurrentDay, 24 * 60 * 60 * 1000);
      
      // Clean up the interval on unmount
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);
    
    // Clean up the timeout on unmount
    return () => clearTimeout(midnightTimeout);
  }, [progress]);
  
  // Обновление прогресса дня
  const updateDayProgress = (dayNumber: number, data: Partial<DayProgress>) => {
    if (!progress || !user) return;
    
    // Обновляем локальное состояние
    setProgress(prev => {
      if (!prev) return null;
      
      const currentDayProgress = prev.days[dayNumber] || { ...defaultDayProgress };
      const updatedDayProgress = { ...currentDayProgress, ...data };
      
      return {
        ...prev,
        days: {
          ...prev.days,
          [dayNumber]: updatedDayProgress
        }
      };
    });
    
    // Обновляем прогресс дня через progressService
    progressService.updateDayProgress(user.id, dayNumber, data).catch(error => {
      logService.error('Ошибка при обновлении прогресса дня', error);
      
      // В случае ошибки добавляем операцию в очередь синхронизации
      if (progress) {
        syncService.addToSyncQueue(user.id, {
          type: 'progress',
          action: 'update',
          data: progress
        });
      }
    });
  };
  
  // Обновление недельной рефлексии
  const updateWeekReflection = (weekNumber: number, data: Partial<WeekReflection>) => {
    if (!progress || !user) return;
    
    // Обновляем локальное состояние
    setProgress(prev => {
      if (!prev) return null;
      
      const currentReflection = prev.weekReflections[weekNumber] || { ...defaultWeekReflection };
      const updatedReflection = { ...currentReflection, ...data };
      
      return {
        ...prev,
        weekReflections: {
          ...prev.weekReflections,
          [weekNumber]: updatedReflection
        }
      };
    });
    
    // Обновляем недельную рефлексию через progressService
    progressService.updateWeekReflection(user.id, weekNumber, data).catch(error => {
      logService.error('Ошибка при обновлении недельной рефлексии', error);
      
      // В случае ошибки добавляем операцию в очередь синхронизации
      if (progress) {
        syncService.addToSyncQueue(user.id, {
          type: 'progress',
          action: 'update',
          data: progress
        });
      }
    });
  };
  
  // Вычисление процента заполнения дня
  const getDayCompletion = (dayNumber: number): number => {
    if (!progress) return 0;
    
    // For regular days
    if (dayNumber % 7 !== 0) {
      const dayProgress = progress.days[dayNumber];
      if (!dayProgress) return 0;
      
      return progressService.getDayCompletion(dayProgress);
    } 
    // For reflection days (7, 14, 21, 28)
    else {
      const weekNumber = dayNumber / 7;
      const reflection = progress.weekReflections[weekNumber];
      if (!reflection) return 0;
      
      return progressService.getReflectionCompletion(reflection);
    }
  };
  
  // Вычисление процента заполнения для виджета "Текущий день" для дней рефлексии (7, 14, 21, 28)
  const getReflectionDayWidgetProgress = (dayNumber: number): Record<string, number> => {
    if (!progress) return {
      gratitude: 0,
      achievements: 0,
      improvements: 0,
      insights: 0,
      rules: 0,
      exercise: 0
    };
    
    // Only for reflection days
    if (dayNumber % 7 !== 0) return {
      gratitude: 0,
      achievements: 0,
      improvements: 0,
      insights: 0,
      rules: 0,
      exercise: 0
    };
    
    const weekNumber = dayNumber / 7;
    const reflection = progress.weekReflections[weekNumber] || { ...defaultWeekReflection };
    
    // Count filled items
    let gratitudeCount = 0;
    if (reflection.gratitudeSelf && reflection.gratitudeSelf.trim() !== '') gratitudeCount++;
    if (reflection.gratitudeOthers && reflection.gratitudeOthers.trim() !== '') gratitudeCount++;
    if (reflection.gratitudeWorld && reflection.gratitudeWorld.trim() !== '') gratitudeCount++;
    
    const achievementsFilled = reflection.achievements ? reflection.achievements.filter(a => a && a.trim() !== '').length : 0;
    const improvementsFilled = reflection.improvements ? reflection.improvements.filter(i => i && i.trim() !== '').length : 0;
    const insightsFilled = reflection.insights ? reflection.insights.filter(i => i && i.trim() !== '').length : 0;
    const rulesFilled = reflection.rules ? reflection.rules.filter(r => r && r.trim() !== '').length : 0;
    
    // Calculate percentages (1 item = 33.3%, 3 items = 100%)
    return {
      gratitude: Math.min(100, Math.round((gratitudeCount / 3) * 100)),
      achievements: Math.min(100, Math.round((achievementsFilled / 3) * 100)),
      improvements: Math.min(100, Math.round((improvementsFilled / 3) * 100)),
      insights: Math.min(100, Math.round((insightsFilled / 3) * 100)),
      rules: Math.min(100, Math.round((rulesFilled / 3) * 100)),
      exercise: reflection.exerciseCompleted ? 100 : 0
    };
  };
  
  // Проверка, является ли день днем рефлексии
  const isReflectionDay = (dayNumber: number): boolean => {
    return progressService.isReflectionDay(dayNumber);
  };
  
  // Проверка, доступен ли день (дни 1-14 доступны)
  const isDayAccessible = (dayNumber: number): boolean => {
    return dayNumber <= 14;
  };
  
  // Проверка, доступна ли неделя (недели 1-2 доступны)
  const isWeekAccessible = (weekNumber: number): boolean => {
    return weekNumber <= 2;
  };
  
  // Создаем безопасный прогресс, даже если настоящий прогресс не загружен
  const safeProgress: UserProgress = progress || {
    startDate: new Date(),
    currentDay: 1,
    days: {},
    weekReflections: {}
  };
  
  // Безопасные функции, которые работают даже если прогресс не загружен
  const safeUpdateDayProgress = (dayNumber: number, data: Partial<DayProgress>) => {
    if (!progress) return;
    updateDayProgress(dayNumber, data);
  };
  
  const safeUpdateWeekReflection = (weekNumber: number, data: Partial<WeekReflection>) => {
    if (!progress) return;
    updateWeekReflection(weekNumber, data);
  };
  
  // Всегда предоставляем контекст, даже если прогресс загружается или не загружен
  return (
    <ProgressContext.Provider 
      value={{ 
        progress: safeProgress, 
        updateDayProgress: safeUpdateDayProgress, 
        updateWeekReflection: safeUpdateWeekReflection, 
        getDayCompletion,
        getReflectionDayWidgetProgress,
        isReflectionDay,
        isDayAccessible,
        isWeekAccessible
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

// Custom hook to use the progress context
export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
