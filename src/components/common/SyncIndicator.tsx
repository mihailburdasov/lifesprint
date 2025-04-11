import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { syncService } from '../../utils/syncService';
import { logService } from '../../utils/logService';

// Расширенный интерфейс для статуса синхронизации
interface SyncStatus {
  lastSync: number;
  inProgress: boolean;
  error: string | null;
  pendingOperations: number;
  // Добавляем новые поля для более детальной информации
  operationTypes?: {
    progress?: number;
    user?: number;
    settings?: number;
  };
  networkStatus?: 'online' | 'offline';
  syncAttempts?: number;
}

const SyncIndicator: React.FC = () => {
  const { user, syncData } = useUser();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Функция для получения статуса синхронизации
  const loadSyncStatus = useCallback(() => {
    if (!user) return;
    
    try {
      // Получаем базовый статус синхронизации
      const status = syncService.getSyncStatus(user.id);
      
      // Расширяем статус дополнительной информацией
      const queue = syncService.getSyncQueue(user.id);
      const operationTypes = queue.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Обновляем статус
      setSyncStatus({
        ...status,
        operationTypes,
        networkStatus: navigator.onLine ? 'online' : 'offline',
        syncAttempts: queue.reduce((acc, op) => Math.max(acc, op.retryCount), 0)
      });
    } catch (error) {
      logService.error('Ошибка при загрузке статуса синхронизации', error);
    }
  }, [user]);
  
  // Инициализация и обновление статуса синхронизации
  useEffect(() => {
    if (!user) {
      setSyncStatus(null);
      return;
    }
    
    // Загружаем статус при монтировании компонента
    loadSyncStatus();
    
    // Настраиваем интервал обновления статуса
    const statusInterval = setInterval(loadSyncStatus, 3000);
    
    // Настраиваем автоматическую синхронизацию
    if (isAutoSyncEnabled) {
      autoSyncIntervalRef.current = setInterval(async () => {
        if (navigator.onLine && user) {
          try {
            await syncData();
            loadSyncStatus(); // Обновляем статус после синхронизации
          } catch (error) {
            logService.error('Ошибка при автоматической синхронизации', error);
          }
        }
      }, 30000); // Каждые 30 секунд
    }
    
    // Слушатели событий сети
    const handleOnline = () => {
      loadSyncStatus();
      // Запускаем синхронизацию при восстановлении соединения
      if (user && isAutoSyncEnabled) {
        syncData().catch(error => {
          logService.error('Ошибка при синхронизации после восстановления соединения', error);
        });
      }
    };
    
    const handleOffline = () => {
      loadSyncStatus();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Очистка при размонтировании
    return () => {
      clearInterval(statusInterval);
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, isAutoSyncEnabled, syncData, loadSyncStatus]);
  
  // Обработчик клика для ручной синхронизации
  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем раскрытие/скрытие панели
    
    if (!user || !syncStatus || syncStatus.inProgress) return;
    
    try {
      await syncData();
      loadSyncStatus(); // Обновляем статус после синхронизации
    } catch (error) {
      logService.error('Ошибка при ручной синхронизации', error);
    }
  };
  
  // Обработчик переключения автоматической синхронизации
  const handleAutoSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Предотвращаем раскрытие/скрытие панели
    
    setIsAutoSyncEnabled(e.target.checked);
    
    // Если включаем автосинхронизацию, запускаем интервал
    if (e.target.checked && user) {
      autoSyncIntervalRef.current = setInterval(async () => {
        if (navigator.onLine && user) {
          try {
            await syncData();
            loadSyncStatus();
          } catch (error) {
            logService.error('Ошибка при автоматической синхронизации', error);
          }
        }
      }, 30000);
    } 
    // Если выключаем, очищаем интервал
    else if (autoSyncIntervalRef.current) {
      clearInterval(autoSyncIntervalRef.current);
    }
  };
  
  // Обработчик клика по индикатору для раскрытия/скрытия панели
  const handleIndicatorClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  if (!user || !syncStatus) {
    return null;
  }
  
  // Форматирование времени последней синхронизации
  const formatLastSync = (timestamp: number): string => {
    if (timestamp === 0) return 'никогда';
    
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return 'только что';
    } else if (diffSec < 3600) {
      const minutes = Math.floor(diffSec / 60);
      return `${minutes} мин. назад`;
    } else if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return `${hours} ч. назад`;
    } else {
      const days = Math.floor(diffSec / 86400);
      return `${days} д. назад`;
    }
  };
  
  
  return (
    <div className="sync-indicator-container relative">
      <div 
        className={`sync-indicator flex items-center text-xs p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isExpanded ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
        onClick={handleIndicatorClick}
      >
        {syncStatus.networkStatus === 'offline' ? (
          <div className="flex items-center text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
            </svg>
            <span>Нет подключения</span>
          </div>
        ) : !syncStatus.inProgress && syncStatus.pendingOperations === 0 ? (
          <div className="flex items-center text-green-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Синхронизировано</span>
            <span className="ml-1 text-text-light">({formatLastSync(syncStatus.lastSync)})</span>
          </div>
        ) : syncStatus.inProgress ? (
          <div className="flex items-center text-blue-500">
            <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Синхронизация...</span>
          </div>
        ) : (
          <div className="flex items-center text-yellow-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Ожидает синхронизации</span>
            {syncStatus.pendingOperations > 0 && (
              <span className="ml-1 text-text-light">({syncStatus.pendingOperations} в очереди)</span>
            )}
          </div>
        )}
        
        <svg 
          className={`w-4 h-4 ml-2 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      {isExpanded && (
        <div className="sync-details absolute right-0 mt-1 p-3 bg-white dark:bg-gray-900 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-64">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Статус синхронизации</h3>
            <button 
              onClick={handleSyncClick}
              disabled={syncStatus.inProgress || syncStatus.networkStatus === 'offline'}
              className={`p-1 rounded-md ${
                syncStatus.inProgress || syncStatus.networkStatus === 'offline' 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900'
              }`}
              title={
                syncStatus.networkStatus === 'offline' 
                  ? 'Нет подключения к интернету' 
                  : syncStatus.inProgress 
                    ? 'Синхронизация уже выполняется' 
                    : 'Синхронизировать сейчас'
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Последняя синхронизация:</span>
              <span className={syncStatus.lastSync === 0 ? 'text-yellow-500' : 'text-gray-700 dark:text-gray-300'}>
                {formatLastSync(syncStatus.lastSync)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Статус сети:</span>
              <span className={syncStatus.networkStatus === 'online' ? 'text-green-500' : 'text-red-500'}>
                {syncStatus.networkStatus === 'online' ? 'Подключено' : 'Нет подключения'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Операций в очереди:</span>
              <span className={syncStatus.pendingOperations > 0 ? 'text-yellow-500' : 'text-green-500'}>
                {syncStatus.pendingOperations}
              </span>
            </div>
            
            {syncStatus.operationTypes && Object.keys(syncStatus.operationTypes).length > 0 && (
              <div className="pl-4 space-y-1">
                {syncStatus.operationTypes.progress !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">- Прогресс:</span>
                    <span>{syncStatus.operationTypes.progress}</span>
                  </div>
                )}
                {syncStatus.operationTypes.user !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">- Данные пользователя:</span>
                    <span>{syncStatus.operationTypes.user}</span>
                  </div>
                )}
                {syncStatus.operationTypes.settings !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">- Настройки:</span>
                    <span>{syncStatus.operationTypes.settings}</span>
                  </div>
                )}
              </div>
            )}
            
            {syncStatus.error && (
              <div className="flex justify-between text-red-500">
                <span>Ошибка:</span>
                <span>{syncStatus.error}</span>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">Автоматическая синхронизация</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={isAutoSyncEnabled}
                    onChange={handleAutoSyncToggle}
                  />
                  <div className={`block w-10 h-6 rounded-full ${isAutoSyncEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAutoSyncEnabled ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncIndicator;
