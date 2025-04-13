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

  // Load progress on mount
  useEffect(() => {
    try {
      setIsLoading(true);
      const loadedProgress = progressService.loadProgress();
      setProgress(loadedProgress);
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
      return progressService.updateDayProgress(prevProgress, dayNumber, data);
    });
  }, []);

  // Update week reflection
  const updateWeekReflection = useCallback((weekNumber: number, data: Partial<WeekReflection>) => {
    setProgress(prevProgress => {
      return progressService.updateWeekReflection(prevProgress, weekNumber, data);
    });
  }, []);

  // Get day completion percentage
  const getDayCompletion = useCallback((dayNumber: number) => {
    return progressService.getDayCompletion(progress, dayNumber);
  }, [progress]);

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
    areTasksCompleted
  };
};
