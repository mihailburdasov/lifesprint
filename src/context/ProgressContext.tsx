import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentMonthSprintStart } from '../utils/dateUtils';
import { apiService } from '../utils/apiService';
import { useUser } from './UserContext';

// Define types for our context
export interface DayProgress {
  completed: boolean;
  gratitude: string[];
  achievements: string[];
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
    if (isAuthenticated && user) {
      setIsLoading(true);
      
      // Получаем прогресс пользователя из API
      apiService.getUserProgress(user.id)
        .then(response => {
          if (response.success && response.data) {
            setProgress(response.data);
          } else {
            // Если прогресс не найден, создаем новый
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
          }
        })
        .catch(error => {
          console.error('Ошибка при получении прогресса пользователя:', error);
          
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
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Если пользователь не авторизован, сбрасываем прогресс
      setProgress(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Сохранение прогресса пользователя при изменении
  useEffect(() => {
    if (isAuthenticated && user && progress) {
      apiService.updateUserProgress(user.id, progress)
        .catch(error => {
          console.error('Ошибка при сохранении прогресса пользователя:', error);
        });
    }
  }, [progress, isAuthenticated, user]);
  
  // Update current day based on the current date
  useEffect(() => {
    if (!progress) return;
    
    // Function to update the current day
    const updateCurrentDay = () => {
      if (!progress) return;
      
      const today = new Date();
      const diffTime = today.getTime() - progress.startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const newCurrentDay = Math.min(Math.max(diffDays, 1), 28); // Ensure between 1-28
      
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
    if (!progress) return;
    
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
  };
  
  // Обновление недельной рефлексии
  const updateWeekReflection = (weekNumber: number, data: Partial<WeekReflection>) => {
    if (!progress) return;
    
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
  };
  
  // Вычисление процента заполнения дня
  const getDayCompletion = (dayNumber: number): number => {
    if (!progress) return 0;
    
    const dayProgress = progress.days[dayNumber];
    if (!dayProgress) return 0;
    
    // For regular days
    if (dayNumber % 7 !== 0) {
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
      return Math.round(total);
    } 
    // For reflection days
    else {
      const weekNumber = dayNumber / 7;
      const reflection = progress.weekReflections[weekNumber];
      if (!reflection) return 0;
      
      let total = 0;
      
      // Check gratitude (20%)
      let gratitudeCount = 0;
      if (reflection.gratitudeSelf.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeOthers.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeWorld.trim() !== '') gratitudeCount++;
      total += (gratitudeCount / 3) * 20;
      
      // Check achievements (20%)
      const achievementsFilled = reflection.achievements.filter(a => a.trim() !== '').length;
      total += (achievementsFilled / 3) * 20;
      
      // Check improvements (20%)
      const improvementsFilled = reflection.improvements.filter(i => i.trim() !== '').length;
      total += (improvementsFilled / 3) * 20;
      
      // Check insights (20%)
      const insightsFilled = reflection.insights.filter(i => i.trim() !== '').length;
      total += (insightsFilled / 3) * 20;
      
      // Check rules (20%)
      const rulesFilled = reflection.rules.filter(r => r.trim() !== '').length;
      total += (rulesFilled / 3) * 20;
      
      // Round to nearest integer
      return Math.round(total);
    }
  };
  
  // Проверка, является ли день днем рефлексии
  const isReflectionDay = (dayNumber: number): boolean => {
    return dayNumber % 7 === 0;
  };
  
  // Проверка, доступен ли день (только дни 1-7 доступны)
  const isDayAccessible = (dayNumber: number): boolean => {
    return dayNumber <= 7;
  };
  
  // Проверка, доступна ли неделя (только неделя 1 доступна)
  const isWeekAccessible = (weekNumber: number): boolean => {
    return weekNumber === 1;
  };
  
  // Если прогресс загружается, показываем пустой провайдер
  if (isLoading) {
    return <>{children}</>;
  }
  
  // Если прогресс не загружен (пользователь не авторизован), показываем пустой провайдер
  if (!progress) {
    return <>{children}</>;
  }
  
  return (
    <ProgressContext.Provider 
      value={{ 
        progress, 
        updateDayProgress, 
        updateWeekReflection, 
        getDayCompletion,
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
