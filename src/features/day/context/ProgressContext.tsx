import React, { createContext, useContext } from 'react';
import { ProgressContextType } from '../types/progress';
import { useProgressService } from '../hooks/useProgressService';

// Create the context with default values
export const ProgressContext = createContext<ProgressContextType>({
  progress: {
    currentDay: 1,
    days: {},
    weekReflections: {},
    completedDays: 0,
    totalDays: 31,
    startDate: new Date().toISOString()
  },
  updateDayProgress: () => {},
  updateWeekReflection: () => {},
  isReflectionDay: () => false,
  isDayAccessible: () => false,
  isWeekAccessible: () => false,
  getDayCompletion: () => 0,
  isLoading: false,
  error: null,
  updateCurrentDay: () => {}
});

// Provider component
export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the progress service hook
  const {
    progress,
    isLoading,
    error,
    updateDayProgress,
    updateWeekReflection,
    getDayCompletion,
    isReflectionDay,
    isDayAccessible,
    isWeekAccessible,
    areTasksCompleted,
    updateCurrentDay
  } = useProgressService();
  
  return (
    <ProgressContext.Provider value={{
      progress,
      updateDayProgress,
      updateWeekReflection,
      isReflectionDay,
      isDayAccessible,
      isWeekAccessible,
      getDayCompletion,
      isLoading,
      error,
      updateCurrentDay
    }}>
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
