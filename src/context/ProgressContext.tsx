import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentMonthSprintStart } from '../utils/dateUtils';

// Define types for our context
interface DayProgress {
  completed: boolean;
  gratitude: string[];
  achievements: string[];
  goals: { text: string; completed: boolean }[];
  exerciseCompleted: boolean;
}

interface WeekReflection {
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
  // Initialize state with data from localStorage or defaults
  const [progress, setProgress] = useState<UserProgress>(() => {
    const savedProgress = localStorage.getItem('lifesprint_progress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      // Convert string dates back to Date objects
      parsed.startDate = new Date(parsed.startDate);
      return parsed;
    }
    
    // Calculate current day based on April 1st start date
    const startDate = getCurrentMonthSprintStart(); // April 1st
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(Math.max(diffDays, 1), 28); // Ensure between 1-28
    
    // Default initial state
    return {
      startDate: startDate,
      currentDay: currentDay,
      days: {},
      weekReflections: {}
    };
  });
  
  // Save to localStorage whenever progress changes
  useEffect(() => {
    localStorage.setItem('lifesprint_progress', JSON.stringify(progress));
  }, [progress]);
  
  // Update day progress
  const updateDayProgress = (dayNumber: number, data: Partial<DayProgress>) => {
    setProgress(prev => {
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
  
  // Update week reflection
  const updateWeekReflection = (weekNumber: number, data: Partial<WeekReflection>) => {
    setProgress(prev => {
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
  
  // Calculate day completion percentage
  const getDayCompletion = (dayNumber: number): number => {
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
  
  // Check if a day is a reflection day
  const isReflectionDay = (dayNumber: number): boolean => {
    return dayNumber % 7 === 0;
  };
  
  // Check if a day is accessible (only days 1-7 are accessible)
  const isDayAccessible = (dayNumber: number): boolean => {
    return dayNumber <= 7;
  };
  
  // Check if a week is accessible (only week 1 is accessible)
  const isWeekAccessible = (weekNumber: number): boolean => {
    return weekNumber === 1;
  };
  
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
