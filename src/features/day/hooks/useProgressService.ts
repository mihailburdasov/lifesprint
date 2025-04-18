/**
 * Custom hook for using the ProgressService
 */

import { useState, useEffect, useCallback } from 'react';
import { DayProgress, WeekReflection, UserProgress } from '../types/progress';
import { progressService } from '../services/ProgressService';
import { useUser } from '../../../context/UserContext';
import { logger, LogContext } from '../../../core/services/LoggingService';
import { getSupabaseUrl } from '../../../core/services/supabase';
import { realtimeService } from '../../../core/services/realtimeService';

/**
 * Custom hook for using the ProgressService
 */
export const useProgressService = () => {
  const { user } = useUser();
  const [progress, setProgress] = useState<UserProgress>(progressService.createDefaultProgress());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);

  // Track last sync timestamp
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0);

  // Force sync with server
  const forceSyncWithServer = useCallback(async (): Promise<boolean> => {
    if (user?.id) {
      setNeedsSync(true);
      try {
        setIsSyncing(true);
        logger.info('Принудительная синхронизация с сервером');
        
        // Get current progress from localStorage to avoid dependency cycle
        const currentProgress = await progressService.loadProgress(user?.id);
        
        await progressService.saveToServer(currentProgress, user.id);
        const syncedProgress = await progressService.syncProgressWithSupabase(user.id);
        setProgress(syncedProgress);
        setNeedsSync(false);
        setLastSyncTimestamp(Date.now());
        
        // Check if data was saved to Supabase
        logger.debug("Проверяем, сохранились ли данные в Supabase");
        const supabaseData = await progressService.checkDataInSupabase(user.id);
        if (supabaseData) {
          logger.success("Данные успешно сохранены в Supabase");
          return true;
        } else {
          logger.warn("Данные не найдены в Supabase после сохранения");
          return false;
        }
      } catch (err) {
        logger.error('Ошибка при принудительной синхронизации:', err);
        return false;
      } finally {
        setIsSyncing(false);
      }
    }
    return false;
  }, [user?.id]); // Remove progress from dependencies to avoid infinite loop
  
  // Fetch updates since last sync
  const fetchUpdates = useCallback(async () => {
    if (!user?.id || !lastSyncTimestamp) return;
    
    try {
      setIsSyncing(true);
      logger.info('Загрузка обновлений с сервера');
      
      const updates = await progressService.fetchSyncUpdates(user.id, lastSyncTimestamp);
      
      // If there are updates, apply them
      if (Object.keys(updates).length > 0) {
        // Get current progress from localStorage to avoid dependency cycle
        const currentProgress = await progressService.loadProgress(user?.id);
        const updatedProgress = progressService.applyUpdates(currentProgress, updates);
        setProgress(updatedProgress);
        setLastSyncTimestamp(Date.now());
        logger.success('Обновления успешно применены');
      } else {
        logger.info('Нет новых обновлений');
      }
    } catch (err) {
      logger.error('Ошибка при загрузке обновлений:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, lastSyncTimestamp]); // Remove progress from dependencies to avoid infinite loop
  
  // Handle real-time updates
  const handleRealtimeUpdate = useCallback(async (payload: any) => {
    if (!user?.id) return;
    
    logger.info('Получено обновление в реальном времени', LogContext.SYNC, payload);
    
    if (payload.type === 'full_sync') {
      // Fetch updates if another device performed a full sync
      fetchUpdates();
    } else if (payload.data) {
      // Get current progress from localStorage to avoid dependency cycle
      const currentProgress = await progressService.loadProgress(user?.id);
      // Apply updates directly if they are included in the payload
      const updatedProgress = progressService.applyUpdates(currentProgress, payload.data);
      setProgress(updatedProgress);
      setLastSyncTimestamp(Date.now());
    }
  }, [user?.id, fetchUpdates]); // Remove progress from dependencies to avoid infinite loop
  
  // Fetch full user data
  const syncUserData = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      setIsSyncing(true);
      logger.info('Загрузка полных данных пользователя');
      
      const userData = await progressService.fetchUserData(user.id);
      setProgress(userData);
      setLastSyncTimestamp(Date.now());
      setNeedsSync(false);
      
      // Broadcast update to other devices
      if (userData) {
        realtimeService.broadcastUpdate(user.id, {
          type: 'full_sync',
          timestamp: Date.now()
        });
      }
      
      return true;
    } catch (err) {
      logger.error('Ошибка загрузки данных пользователя:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id]);

  // Load progress on mount and update current day
  useEffect(() => {
    let isMounted = true;
    
    const loadProgressData = async () => {
      try {
        setIsLoading(true);
        logger.info("Загрузка данных прогресса при инициализации");
        
        // Load progress from Supabase if user is logged in, otherwise from localStorage
        const loadedProgress = await progressService.loadProgress(user?.id);
        
        // Update current day based on the current date
        const updatedProgress = await progressService.updateCurrentDay(loadedProgress, user?.id);
        
        if (isMounted) {
          setProgress(updatedProgress);
          setError(null);
          
          // Force immediate sync with server if user is logged in
          if (user?.id) {
            logger.info("Принудительная синхронизация при инициализации");
            forceSyncWithServer();
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load progress data');
          logger.error('Ошибка загрузки прогресса:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadProgressData();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, forceSyncWithServer]);

  // Set up WebSocket subscription
  useEffect(() => {
    if (user?.id) {
      // Subscribe to real-time updates
      realtimeService.subscribeToUserUpdates(user.id, handleRealtimeUpdate);
      
      return () => {
        realtimeService.unsubscribe();
      };
    }
  }, [user?.id, handleRealtimeUpdate]);
  
  // Sync with Supabase when user changes and periodically
  useEffect(() => {
    let isMounted = true;
    let syncInterval: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    
    const syncWithSupabase = async () => {
      if (user?.id && (progressService.hasUnsyncedChanges() || needsSync)) {
        try {
          if (isMounted) {
            setIsSyncing(true);
          }
          
          logger.sync('Синхронизация с Supabase');
          
          // Get current progress from localStorage
          const currentProgress = await progressService.loadProgress();
          
          // Save to server
          await progressService.saveToServer(currentProgress, user.id);
          
          // Then sync to merge any changes from other devices
          const syncedProgress = await progressService.syncProgressWithSupabase(user.id);
          
          if (isMounted) {
            setProgress(syncedProgress);
            setNeedsSync(false);
            logger.success('Синхронизация с Supabase успешно завершена');
          }
        } catch (err) {
          if (isMounted) {
            logger.error('Ошибка синхронизации с Supabase:', err);
            // Don't set error here to avoid disrupting the user experience
          }
        } finally {
          if (isMounted) {
            setIsSyncing(false);
          }
        }
      }
    };
    
    // Sync when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && (progressService.hasUnsyncedChanges() || needsSync)) {
        logger.info('Вкладка стала видимой, запуск синхронизации');
        syncWithSupabase();
      }
    };
    
    // Sync before tab/window is closed
    const handleBeforeUnload = () => {
      if (user?.id && (progressService.hasUnsyncedChanges() || needsSync)) {
        logger.info('Страница закрывается, принудительная синхронизация', LogContext.SYNC);
        // Use sendBeacon for more reliable sync before page unload
        const currentProgress = JSON.parse(localStorage.getItem('lifesprint_progress') || '{}');
        
        // Convert to database format
        const dbProgress = {
          user_id: user.id,
          current_day: currentProgress.currentDay,
          days: currentProgress.days,
          week_reflections: currentProgress.weekReflections,
          completed_days: currentProgress.completedDays,
          total_days: currentProgress.totalDays,
          start_date: currentProgress.startDate,
          updated_at: new Date().toISOString()
        };
        
        try {
          // Get the URL and headers for Supabase
          const { url, headers } = getSupabaseUrl('/rest/v1/user_progress', user.id);
          
          // Create a Blob with the data and proper content type
          const blob = new Blob([JSON.stringify(dbProgress)], { 
            type: 'application/json; charset=UTF-8'
          });
          
          // Use fetch with keepalive flag which is more reliable than sendBeacon
          if ('fetch' in window && 'keepalive' in new Request('')) {
            fetch(url, {
              method: 'PATCH',
              headers: {
                ...headers,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(dbProgress),
              keepalive: true // This ensures the request continues even as the page unloads
            }).catch(() => {
              // Errors are expected during page unload, so we silently catch them
            });
          } else {
            // Fallback to sendBeacon for older browsers
            // Create a simple FormData object for sendBeacon
            const formData = new FormData();
            formData.append('data', JSON.stringify(dbProgress));
            
            // Add headers to URL as query parameters since sendBeacon doesn't support custom headers
            const beaconUrl = new URL(url);
            beaconUrl.searchParams.append('apikey', headers.apikey);
            beaconUrl.searchParams.append('Prefer', 'return=minimal');
            
            navigator.sendBeacon(beaconUrl.toString(), blob);
          }
        } catch (error) {
          // Silently catch errors during page unload
          console.error('Error during page unload sync:', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    if (user?.id) {
      // Initial sync
      syncWithSupabase();
      
      // Set up periodic sync every 15 seconds
      syncInterval = setInterval(() => {
        logger.debug('Проверка необходимости синхронизации с Supabase');
        if (progressService.hasUnsyncedChanges() || needsSync) {
          logger.sync('Обнаружены несинхронизированные изменения, запуск синхронизации');
          syncWithSupabase();
        } else {
          logger.debug('Несинхронизированных изменений не обнаружено');
        }
      }, 15 * 1000); // 15 seconds
      
      // Set up polling as a fallback for real-time updates
      pollingInterval = setInterval(() => {
        // Only poll if we have a lastSyncTimestamp and real-time is not working
        if (lastSyncTimestamp && !realtimeService.isSubscribed()) {
          logger.info('Резервный опрос для обновлений', LogContext.SYNC);
          fetchUpdates();
        }
      }, 30 * 1000); // 30 seconds
    }
    
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      
      // Force sync when component unmounts if there are unsaved changes
      if ((progressService.hasUnsyncedChanges() || needsSync) && user?.id) {
        logger.sync('Компонент размонтирован, принудительная синхронизация');
        // We can't use the async function directly in the cleanup function
        // So we just call it without awaiting
        progressService.saveToServer(progress, user.id).catch(err => {
          logger.error('Ошибка принудительной синхронизации при размонтировании:', err);
        });
      }
    };
  }, [user?.id, needsSync, progress, lastSyncTimestamp, fetchUpdates]);

  // Update day progress - saves locally and optionally forces server sync for important changes
  const updateDayProgress = useCallback(async (dayNumber: number, data: Partial<DayProgress>, forceSync: boolean = false) => {
    try {
      const updatedProgress = await progressService.updateDayProgress(progress, dayNumber, data, user?.id);
      setProgress(updatedProgress);
      setNeedsSync(true); // Mark that we need to sync with server
      
      // Force immediate sync for important changes if user is logged in
      if (forceSync && user?.id) {
        logger.info('Принудительная синхронизация после важного изменения');
        await progressService.saveToServer(updatedProgress, user.id);
      }
    } catch (err) {
      logger.error('Ошибка обновления прогресса дня:', err);
      setError('Failed to update day progress');
    }
  }, [progress, user?.id]);

  // Update week reflection - saves locally and optionally forces server sync for important changes
  const updateWeekReflection = useCallback(async (weekNumber: number, data: Partial<WeekReflection>, forceSync: boolean = false) => {
    try {
      const updatedProgress = await progressService.updateWeekReflection(progress, weekNumber, data, user?.id);
      setProgress(updatedProgress);
      setNeedsSync(true); // Mark that we need to sync with server
      
      // Force immediate sync for important changes if user is logged in
      if (forceSync && user?.id) {
        logger.info('Принудительная синхронизация после важного изменения');
        await progressService.saveToServer(updatedProgress, user.id);
      }
    } catch (err) {
      logger.error('Ошибка обновления недельной рефлексии:', err);
      setError('Failed to update week reflection');
    }
  }, [progress, user?.id]);

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
  const updateCurrentDay = useCallback(async () => {
    try {
      // Use a local copy of progress to avoid dependency cycle
      const currentProgress = await progressService.loadProgress(user?.id);
      const updatedProgress = await progressService.updateCurrentDay(currentProgress, user?.id);
      setProgress(updatedProgress);
    } catch (err) {
      console.error('Error updating current day:', err);
      setError('Failed to update current day');
    }
  }, [user?.id]); // Remove progress from dependencies to avoid infinite loop

  // Add function to reload progress from Supabase/localStorage
  const reloadProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.info('Перезагрузка данных прогресса');
      const loadedProgress = await progressService.loadProgress(user?.id);
      setProgress(loadedProgress);
      setError(null);
      logger.success('Данные прогресса успешно перезагружены');
    } catch (err) {
      setError('Failed to reload progress data');
      logger.error('Ошибка перезагрузки прогресса:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  
  // Check if data exists in Supabase (for debugging)
  const checkSupabaseData = useCallback(async () => {
    if (user?.id) {
      try {
        logger.debug("Проверка данных в Supabase");
        const data = await progressService.checkDataInSupabase(user.id);
        return data;
      } catch (err) {
        logger.error('Ошибка проверки данных в Supabase:', err);
        return null;
      }
    }
    return null;
  }, [user?.id]);

  return {
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
    areTasksCompleted,
    isWeekComplete,
    updateCurrentDay,
    reloadProgress,
    forceSyncWithServer,
    checkSupabaseData,
    syncUserData,
    lastSyncTimestamp,
    fetchUpdates
  };
};
