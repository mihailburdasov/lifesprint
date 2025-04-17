/**
 * Custom hook for using the ProgressService
 */

import { useState, useEffect, useCallback } from 'react';
import { DayProgress, WeekReflection, UserProgress } from '../types/progress';
import { progressService } from '../services/ProgressService';

/**
 * Custom hook for using the ProgressService
 */
export const useProgressService = () => {
  const [progress, setProgress] = useState<UserProgress>(progressService.loadProgress());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load progress on mount and update current day
  useEffect(() => {
    try {
      setIsLoading(true);
      const loadedProgress = progressService.loadProgress();
      
      // Update current day based on the current date
      const updatedProgress = progressService.updateCurrentDay(loadedProgress);
      
      setProgress(updatedProgress);
      setError(null);
    } catch (err) {
      setError('Failed to load progress data');
      console.error('Error loading progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    try {
      progressService.saveProgress(progress);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  }, [progress]);

  // Update day progress
  const updateDayProgress = useCallback((dayNumber: number, data: Partial<DayProgress>) => {
    setProgress(prevProgress => {
      const newProgress = progressService.updateDayProgress(prevProgress, dayNumber, data);
      // Immediately save to localStorage to ensure data persistence
      progressService.saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  // Update week reflection
  const updateWeekReflection = useCallback((weekNumber: number, data: Partial<WeekReflection>) => {
    setProgress(prevProgress => {
      const newProgress = progressService.updateWeekReflection(prevProgress, weekNumber, data);
      // Immediately save to localStorage to ensure data persistence
      progressService.saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  // Get day completion percentage
  const getDayCompletion = useCallback((dayNumber: number) => {
    // Use the current progress state instead of loading from localStorage
    return progressService.getDayCompletion(progress, dayNumber);
  }, [progress]); // Add progress as a dependency so it recalculates when progress changes

  // Check if a day is a reflection day
  const isReflectionDay = useCallback((dayNumber: number) => {
    return progressService.isReflectionDay(dayNumber);
  }, []);

  // Check if a day is accessible
  const isDayAccessible = useCallback((dayNumber: number) => {
    return progressService.isDayAccessible(dayNumber);
  }, []);

  // Check if a week is accessible
  const isWeekAccessible = useCallback((weekNumber: number) => {
    return progressService.isWeekAccessible(weekNumber);
  }, []);

  // Check if all tasks in a day are completed or empty
  const areTasksCompleted = useCallback((dayNumber: number) => {
    return progressService.areTasksCompleted(progress, dayNumber);
  }, [progress]);
  
  // Check if all days in a week are 100% complete
  const isWeekComplete = useCallback((weekNumber: number) => {
    return progressService.isWeekComplete(progress, weekNumber);
  }, [progress]);

  // Update current day based on the current date
  const updateCurrentDay = useCallback(() => {
    setProgress(prevProgress => {
      const updatedProgress = progressService.updateCurrentDay(prevProgress);
      return updatedProgress;
    });
  }, []);

  // Add function to reload progress from localStorage
  const reloadProgress = useCallback(() => {
    try {
      setIsLoading(true);
      const loadedProgress = progressService.loadProgress();
      setProgress(loadedProgress);
      setError(null);
      console.log('Progress reloaded from localStorage');
    } catch (err) {
      setError('Failed to reload progress data');
      console.error('Error reloading progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
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
    isWeekComplete,
    updateCurrentDay,
    reloadProgress // Add the new function to the returned object
  };
};
