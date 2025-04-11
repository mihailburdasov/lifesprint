import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';

// Префикс для ключей в localStorage
const SYNC_STATUS_PREFIX = 'lifesprint_sync_status_';
const SYNC_QUEUE_PREFIX = 'lifesprint_sync_queue_';

// Интерфейс для статуса синхронизации
interface SyncStatus {
  synced: boolean;
  lastAttempt: Date;
  error: string | null;
}

const SyncIndicator: React.FC = () => {
  const { user } = useUser();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [queueSize, setQueueSize] = useState<number>(0);
  
  useEffect(() => {
    if (!user) {
      setSyncStatus(null);
      setQueueSize(0);
      return;
    }
    
    // Получаем статус синхронизации из localStorage
    const loadSyncStatus = () => {
      const statusJson = localStorage.getItem(`${SYNC_STATUS_PREFIX}${user.id}`);
      if (statusJson) {
        try {
          const status = JSON.parse(statusJson);
          setSyncStatus({
            ...status,
            lastAttempt: new Date(status.lastAttempt)
          });
        } catch (error) {
          console.error('Ошибка при загрузке статуса синхронизации:', error);
        }
      }
      
      // Получаем размер очереди синхронизации
      const queueJson = localStorage.getItem(`${SYNC_QUEUE_PREFIX}${user.id}`);
      if (queueJson) {
        try {
          const queue = JSON.parse(queueJson);
          setQueueSize(Array.isArray(queue) ? queue.length : 0);
        } catch (error) {
          console.error('Ошибка при загрузке очереди синхронизации:', error);
          setQueueSize(0);
        }
      } else {
        setQueueSize(0);
      }
    };
    
    // Загружаем статус при монтировании компонента
    loadSyncStatus();
    
    // Обновляем статус каждые 5 секунд
    const interval = setInterval(loadSyncStatus, 5000);
    
    return () => clearInterval(interval);
  }, [user]);
  
  if (!user || !syncStatus) {
    return null;
  }
  
  // Форматирование времени последней попытки синхронизации
  const formatLastAttempt = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
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
    <div className="sync-indicator flex items-center text-xs p-2 rounded-md">
      {syncStatus.synced ? (
        <div className="flex items-center text-green-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Синхронизировано</span>
          <span className="ml-1 text-text-light">({formatLastAttempt(syncStatus.lastAttempt)})</span>
        </div>
      ) : (
        <div className="flex items-center text-yellow-500">
          <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Синхронизация...</span>
          {queueSize > 0 && (
            <span className="ml-1 text-text-light">({queueSize} в очереди)</span>
          )}
        </div>
      )}
      
      {syncStatus.error && (
        <div className="text-xs text-red-500 mt-1 ml-5">
          Ошибка: {syncStatus.error}
        </div>
      )}
    </div>
  );
};

export default SyncIndicator;
