import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentMonthSprintStart } from '../utils/dateUtils';
import { apiService } from '../utils/apiService';
import { useUser } from './UserContext';

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
    if (isAuthenticated && user) {
      setIsLoading(true);
      
      try {
        // Получаем прогресс пользователя из локального хранилища
        const response = apiService.getUserProgress(user.id);
        
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
      } catch (error) {
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
      } finally {
        setIsLoading(false);
      }
    } else {
      // Если пользователь не авторизован, сбрасываем прогресс
      setProgress(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Сохранение прогресса пользователя при изменении
  useEffect(() => {
    if (isAuthenticated && user && progress) {
      try {
        apiService.updateUserProgress(user.id, progress);
      } catch (error) {
        console.error('Ошибка при сохранении прогресса пользователя:', error);
      }
    }
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
    // For reflection days (7, 14, 21, 28)
    else {
      const weekNumber = dayNumber / 7;
      const reflection = progress.weekReflections[weekNumber];
      if (!reflection) return 0;
      
      let total = 0;
      
      // Check gratitude (15% total, 5% each)
      let gratitudeCount = 0;
      if (reflection.gratitudeSelf.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeOthers.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeWorld.trim() !== '') gratitudeCount++;
      total += gratitudeCount * 5; // 5% for each gratitude (max 15%)
      
      // Check achievements (15% total, 5% each)
      const achievementsFilled = reflection.achievements.filter(a => a.trim() !== '').length;
      total += achievementsFilled * 5; // 5% for each achievement (max 15%)
      
      // Check improvements/zone of growth (15% total, 5% each)
      const improvementsFilled = reflection.improvements.filter(i => i.trim() !== '').length;
      total += improvementsFilled * 5; // 5% for each improvement (max 15%)
      
      // Check insights (15% total, 5% each)
      const insightsFilled = reflection.insights.filter(i => i.trim() !== '').length;
      total += insightsFilled * 5; // 5% for each insight (max 15%)
      
      // Check rules (30% total, 10% each)
      const rulesFilled = reflection.rules.filter(r => r.trim() !== '').length;
      total += rulesFilled * 10; // 10% for each rule (max 30%)
      
      // Check mindfulness exercise completion (10%)
      if (reflection.exerciseCompleted) {
        total += 10; // 10% for completing the exercise
      }
      
      // Cap at 100%
      total = Math.min(total, 100);
      
      // Round to nearest integer
      return Math.round(total);
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
    const reflection = progress.weekReflections[weekNumber];
    if (!reflection) return {
      gratitude: 0,
      achievements: 0,
      improvements: 0,
      insights: 0,
      rules: 0,
      exercise: 0
    };
    
    // Count filled items
    let gratitudeCount = 0;
    if (reflection.gratitudeSelf.trim() !== '') gratitudeCount++;
    if (reflection.gratitudeOthers.trim() !== '') gratitudeCount++;
    if (reflection.gratitudeWorld.trim() !== '') gratitudeCount++;
    
    const achievementsFilled = reflection.achievements.filter(a => a.trim() !== '').length;
    const improvementsFilled = reflection.improvements.filter(i => i.trim() !== '').length;
    const insightsFilled = reflection.insights.filter(i => i.trim() !== '').length;
    const rulesFilled = reflection.rules.filter(r => r.trim() !== '').length;
    
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
    return dayNumber % 7 === 0;
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
