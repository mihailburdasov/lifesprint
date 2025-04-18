import React, { useState } from 'react';
import { Button } from '../../../core/components';
import { useProgress } from '../context/ProgressContext';
import { logger } from '../../../core/services/LoggingService';

interface SyncButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button component for manual synchronization
 */
const SyncButton: React.FC<SyncButtonProps> = ({ 
  className = '', 
  variant = 'primary',
  size = 'md'
}) => {
  const { syncUserData, isSyncing } = useProgress();
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const handleSync = async () => {
    setSyncResult(null);
    
    try {
      logger.info('Ручная синхронизация данных');
      const success = await syncUserData();
      
      setSyncResult({
        success,
        message: success 
          ? 'Синхронизация успешно завершена' 
          : 'Ошибка синхронизации'
      });
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        setSyncResult(null);
      }, 3000);
    } catch (error) {
      logger.error('Ошибка при ручной синхронизации', error);
      
      setSyncResult({
        success: false,
        message: 'Ошибка синхронизации'
      });
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        setSyncResult(null);
      }, 3000);
    }
  };
  
  return (
    <div className={className}>
      {syncResult && (
        <div className={`mb-2 p-2 text-sm rounded ${
          syncResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {syncResult.message}
        </div>
      )}
      
      <Button
        variant={variant}
        size={size}
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center"
      >
        {isSyncing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Синхронизация...
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Синхронизировать данные
          </>
        )}
      </Button>
    </div>
  );
};

export default SyncButton;
