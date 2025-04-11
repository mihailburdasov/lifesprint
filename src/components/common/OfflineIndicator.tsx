import React, { useState, useEffect, useCallback } from 'react';
import { memo } from 'react';
import { useUser } from '../../context/UserContext';
import { syncService } from '../../utils/syncService';
import { logService } from '../../utils/logService';

/**
 * Хук для отслеживания сетевого статуса
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const { user } = useUser();
  
  const handleOnline = useCallback(() => {
    logService.info('Соединение восстановлено');
    setIsOnline(true);
    
    // Запускаем синхронизацию при восстановлении соединения
    if (user) {
      syncService.syncData(user.id).catch(error => {
        logService.error('Ошибка при автоматической синхронизации', error);
      });
    }
  }, [user]);
  
  const handleOffline = useCallback(() => {
    logService.warn('Соединение потеряно');
    setIsOnline(false);
    
    // Обновляем статус синхронизации при потере соединения
    if (user) {
      syncService.updateSyncStatus(user.id, {
        inProgress: false,
        error: 'Нет подключения к интернету'
      });
    }
  }, [user]);
  
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);
  
  return isOnline;
};

/**
 * Компонент для отображения индикатора офлайн-режима
 */
const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showIndicator, setShowIndicator] = useState<boolean>(false);
  const { user } = useUser();
  const [pendingOperations, setPendingOperations] = useState<number>(0);
  
  // Получаем количество ожидающих операций
  useEffect(() => {
    if (!user || isOnline) {
      setPendingOperations(0);
      return;
    }
    
    const status = syncService.getSyncStatus(user.id);
    setPendingOperations(status.pendingOperations);
    
    // Обновляем количество ожидающих операций каждые 5 секунд
    const interval = setInterval(() => {
      const status = syncService.getSyncStatus(user.id);
      setPendingOperations(status.pendingOperations);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user, isOnline]);
  
  // Показываем индикатор только если пользователь офлайн более 2 секунд
  // Это предотвращает мигание индикатора при кратковременных проблемах с сетью
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isOnline) {
      timeoutId = setTimeout(() => {
        setShowIndicator(true);
      }, 2000);
    } else {
      setShowIndicator(false);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOnline]);
  
  if (isOnline || !showIndicator) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-md shadow-md z-50 md:left-auto md:right-4 md:w-80">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="font-medium">Вы находитесь в офлайн-режиме</p>
          <p className="text-xs mt-1">
            Данные будут сохранены локально и синхронизированы, когда соединение восстановится
            {pendingOperations > 0 && ` (${pendingOperations} операций в очереди)`}
          </p>
        </div>
      </div>
    </div>
  );
};

// Мемоизируем компонент для предотвращения ненужных перерисовок
export default memo(OfflineIndicator);
