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
  updateDayProgress: async () => {},
  updateWeekReflection: async () => {},
  isReflectionDay: () => false,
  isDayAccessible: () => false,
  isWeekAccessible: () => false,
  getDayCompletion: () => 0,
  isLoading: false,
  isSyncing: false,
  needsSync: false,
  error: null,
  updateCurrentDay: async () => {},
  reloadProgress: async () => {},
  forceSyncWithServer: async () => false,
  checkSupabaseData: async () => null,
  syncUserData: async () => false,
  lastSyncTimestamp: 0
});

// Provider component
export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the progress service hook
  const {
    progress,
    isLoading,
    isSyncing,
    needsSync,
    error,
    updateDayProgress,
    updateWeekReflection,
    getDayCompletion,
    isReflectionDay,
    isDayAccessible,
    isWeekAccessible,
    // areTasksCompleted is not used in this component
    updateCurrentDay,
    reloadProgress,
    forceSyncWithServer,
    checkSupabaseData,
    syncUserData,
    lastSyncTimestamp
    // fetchUpdates is not used in this component
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
      isSyncing,
      needsSync,
      error,
      updateCurrentDay,
      reloadProgress,
      forceSyncWithServer,
      checkSupabaseData,
      syncUserData,
      lastSyncTimestamp
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
