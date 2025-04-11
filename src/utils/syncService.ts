import { supabase } from './supabaseClient';
import { logService } from './logService';
import { ApiResponse } from './authService';
import { conflictResolver } from './conflictResolver';

// Префиксы для ключей в localStorage
const SYNC_QUEUE_PREFIX = 'lifesprint_sync_queue_';
const SYNC_STATUS_PREFIX = 'lifesprint_sync_status_';

// Интерфейс для операции синхронизации
export interface SyncOperation {
  id: string;
  type: 'progress' | 'user' | 'settings';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

// Интерфейс для статуса синхронизации
export interface SyncStatus {
  lastSync: number;
  inProgress: boolean;
  error: string | null;
  pendingOperations: number;
}

/**
 * Сервис для синхронизации данных между локальным хранилищем и сервером
 */
export const syncService = {
  /**
   * Получение очереди синхронизации
   */
  getSyncQueue(userId: string): SyncOperation[] {
    try {
      const queueJson = localStorage.getItem(`${SYNC_QUEUE_PREFIX}${userId}`);
      
      if (!queueJson) {
        return [];
      }
      
      return JSON.parse(queueJson) as SyncOperation[];
    } catch (error) {
      logService.error('Ошибка при получении очереди синхронизации', error);
      return [];
    }
  },
  
  /**
   * Сохранение очереди синхронизации
   */
  saveSyncQueue(userId: string, queue: SyncOperation[]): void {
    try {
      localStorage.setItem(`${SYNC_QUEUE_PREFIX}${userId}`, JSON.stringify(queue));
      
      // Обновляем статус синхронизации
      this.updateSyncStatus(userId, {
        pendingOperations: queue.length
      });
    } catch (error) {
      logService.error('Ошибка при сохранении очереди синхронизации', error);
    }
  },
  
  /**
   * Добавление операции в очередь синхронизации
   */
  addToSyncQueue(userId: string, operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): void {
    try {
      const queue = this.getSyncQueue(userId);
      
      // Создаем новую операцию
      const newOperation: SyncOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
        ...operation
      };
      
      // Добавляем операцию в очередь
      queue.push(newOperation);
      
      // Сохраняем очередь
      this.saveSyncQueue(userId, queue);
      
      // Запускаем синхронизацию, если есть подключение к интернету
      if (navigator.onLine) {
        this.syncData(userId);
      }
    } catch (error) {
      logService.error('Ошибка при добавлении операции в очередь синхронизации', error);
    }
  },
  
  /**
   * Получение статуса синхронизации
   */
  getSyncStatus(userId: string): SyncStatus {
    try {
      const statusJson = localStorage.getItem(`${SYNC_STATUS_PREFIX}${userId}`);
      
      if (!statusJson) {
        return {
          lastSync: 0,
          inProgress: false,
          error: null,
          pendingOperations: 0
        };
      }
      
      return JSON.parse(statusJson) as SyncStatus;
    } catch (error) {
      logService.error('Ошибка при получении статуса синхронизации', error);
      return {
        lastSync: 0,
        inProgress: false,
        error: null,
        pendingOperations: 0
      };
    }
  },
  
  /**
   * Обновление статуса синхронизации
   */
  updateSyncStatus(userId: string, partialStatus: Partial<SyncStatus>): void {
    try {
      const currentStatus = this.getSyncStatus(userId);
      
      // Обновляем статус
      const newStatus: SyncStatus = {
        ...currentStatus,
        ...partialStatus
      };
      
      // Сохраняем статус
      localStorage.setItem(`${SYNC_STATUS_PREFIX}${userId}`, JSON.stringify(newStatus));
    } catch (error) {
      logService.error('Ошибка при обновлении статуса синхронизации', error);
    }
  },
  
  /**
   * Синхронизация данных
   */
  async syncData(userId: string): Promise<ApiResponse<null>> {
    try {
      // Проверяем, есть ли подключение к интернету
      if (!navigator.onLine) {
        return {
          success: false,
          error: 'Нет подключения к интернету'
        };
      }
      
      // Получаем статус синхронизации
      const status = this.getSyncStatus(userId);
      
      // Если синхронизация уже выполняется, пропускаем
      if (status.inProgress) {
        return {
          success: false,
          error: 'Синхронизация уже выполняется'
        };
      }
      
      // Получаем очередь синхронизации
      const queue = this.getSyncQueue(userId);
      
      // Если очередь пуста, пропускаем
      if (queue.length === 0) {
        // Обновляем статус синхронизации
        this.updateSyncStatus(userId, {
          lastSync: Date.now(),
          inProgress: false,
          error: null,
          pendingOperations: 0
        });
        
        return {
          success: true,
          data: null
        };
      }
      
      // Обновляем статус синхронизации
      this.updateSyncStatus(userId, {
        inProgress: true,
        error: null
      });
      
      // Обрабатываем операции по одной
      const successfulOperations: string[] = [];
      const failedOperations: string[] = [];
      
      for (const operation of queue) {
        try {
          // Обрабатываем операцию
          const success = await this.processOperation(userId, operation);
          
          if (success) {
            successfulOperations.push(operation.id);
          } else {
            // Увеличиваем счетчик попыток
            operation.retryCount++;
            
            // Если превышено максимальное количество попыток, помечаем как неудачную
            if (operation.retryCount >= 3) {
              failedOperations.push(operation.id);
              logService.error(`Операция ${operation.id} не удалась после ${operation.retryCount} попыток`, operation);
            }
          }
        } catch (error) {
          logService.error(`Ошибка при обработке операции ${operation.id}`, error);
          
          // Увеличиваем счетчик попыток
          operation.retryCount++;
          
          // Если превышено максимальное количество попыток, помечаем как неудачную
          if (operation.retryCount >= 3) {
            failedOperations.push(operation.id);
          }
        }
      }
      
      // Удаляем успешные операции из очереди
      let updatedQueue = queue.filter(op => !successfulOperations.includes(op.id));
      
      // Удаляем неудачные операции из очереди (после максимального количества попыток)
      updatedQueue = updatedQueue.filter(op => !failedOperations.includes(op.id));
      
      // Сохраняем обновленную очередь
      this.saveSyncQueue(userId, updatedQueue);
      
      // Обновляем статус синхронизации
      this.updateSyncStatus(userId, {
        lastSync: Date.now(),
        inProgress: false,
        error: failedOperations.length > 0 ? 'Некоторые операции не удалось синхронизировать' : null,
        pendingOperations: updatedQueue.length
      });
      
      return {
        success: failedOperations.length === 0,
        error: failedOperations.length > 0 ? 'Некоторые операции не удалось синхронизировать' : null
      };
    } catch (error) {
      logService.error('Ошибка при синхронизации данных', error);
      
      // Обновляем статус синхронизации
      this.updateSyncStatus(userId, {
        inProgress: false,
        error: 'Произошла ошибка при синхронизации данных'
      });
      
      return {
        success: false,
        error: 'Произошла ошибка при синхронизации данных'
      };
    }
  },
  
  /**
   * Обработка операции синхронизации
   */
  async processOperation(userId: string, operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'progress':
          return await this.syncProgress(userId, operation);
        case 'user':
          return await this.syncUser(userId, operation);
        case 'settings':
          return await this.syncSettings(userId, operation);
        default:
          logService.error(`Неизвестный тип операции: ${operation.type}`, operation);
          return false;
      }
    } catch (error) {
      logService.error(`Ошибка при обработке операции ${operation.id}`, error);
      return false;
    }
  },
  
  /**
   * Синхронизация прогресса
   */
  async syncProgress(userId: string, operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.action) {
        case 'create':
        case 'update':
          // Получаем текущий прогресс из Supabase
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (!progressError && progressData) {
            // Преобразуем данные из Supabase в формат UserProgress
            const serverProgress = {
              startDate: new Date(progressData.start_date),
              currentDay: progressData.current_day,
              days: progressData.days || {},
              weekReflections: progressData.week_reflections || {}
            };
            
            // Разрешаем конфликты между серверными и локальными данными
            const mergedProgress = conflictResolver.resolveProgressConflict(serverProgress, operation.data);
            
            // Обновляем прогресс в Supabase
            const { error: updateError } = await supabase
              .from('user_progress')
              .upsert({
                user_id: userId,
                start_date: mergedProgress.startDate.toISOString(),
                current_day: mergedProgress.currentDay,
                days: mergedProgress.days,
                week_reflections: mergedProgress.weekReflections,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });
            
            if (updateError) {
              logService.error('Ошибка при обновлении прогресса в Supabase', updateError);
              return false;
            }
            
            return true;
          } else {
            // Если прогресс не найден, создаем новый
            const { error: insertError } = await supabase
              .from('user_progress')
              .insert({
                user_id: userId,
                start_date: operation.data.startDate.toISOString(),
                current_day: operation.data.currentDay,
                days: operation.data.days,
                week_reflections: operation.data.weekReflections,
                updated_at: new Date().toISOString()
              });
            
            if (insertError) {
              logService.error('Ошибка при создании прогресса в Supabase', insertError);
              return false;
            }
            
            return true;
          }
        
        case 'delete':
          // Удаляем прогресс из Supabase
          const { error: deleteError } = await supabase
            .from('user_progress')
            .delete()
            .eq('user_id', userId);
          
          if (deleteError) {
            logService.error('Ошибка при удалении прогресса из Supabase', deleteError);
            return false;
          }
          
          return true;
        
        default:
          logService.error(`Неизвестное действие операции: ${operation.action}`, operation);
          return false;
      }
    } catch (error) {
      logService.error('Ошибка при синхронизации прогресса', error);
      return false;
    }
  },
  
  /**
   * Синхронизация пользователя
   */
  async syncUser(userId: string, operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.action) {
        case 'update':
          // Обновляем метаданные пользователя в Supabase Auth
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              name: operation.data.name,
              telegram_nickname: operation.data.telegramNickname
            }
          });
          
          if (updateError) {
            logService.error('Ошибка при обновлении данных пользователя в Supabase', updateError);
            return false;
          }
          
          // Обновляем профиль пользователя в таблице profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: operation.data.name,
              email: operation.data.email,
              telegram_nickname: operation.data.telegramNickname,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (profileError) {
            logService.error('Ошибка при обновлении профиля пользователя в Supabase', profileError);
            return false;
          }
          
          return true;
        
        case 'delete':
          // Удаляем пользователя из Supabase
          const { error: authError } = await supabase.auth.admin.deleteUser(userId);
          
          if (authError) {
            logService.error('Ошибка при удалении пользователя из Supabase Auth', authError);
            return false;
          }
          
          // Удаляем профиль пользователя из таблицы profiles
          const { error: deleteProfileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
          
          if (deleteProfileError) {
            logService.error('Ошибка при удалении профиля пользователя из Supabase', deleteProfileError);
            return false;
          }
          
          return true;
        
        default:
          logService.error(`Неизвестное действие операции: ${operation.action}`, operation);
          return false;
      }
    } catch (error) {
      logService.error('Ошибка при синхронизации пользователя', error);
      return false;
    }
  },
  
  /**
   * Синхронизация настроек
   */
  async syncSettings(userId: string, operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.action) {
        case 'create':
        case 'update':
          // Обновляем настройки пользователя в Supabase
          const { error: updateError } = await supabase
            .from('user_settings')
            .upsert({
              user_id: userId,
              ...operation.data,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
          
          if (updateError) {
            logService.error('Ошибка при обновлении настроек пользователя в Supabase', updateError);
            return false;
          }
          
          return true;
        
        case 'delete':
          // Удаляем настройки пользователя из Supabase
          const { error: deleteError } = await supabase
            .from('user_settings')
            .delete()
            .eq('user_id', userId);
          
          if (deleteError) {
            logService.error('Ошибка при удалении настроек пользователя из Supabase', deleteError);
            return false;
          }
          
          return true;
        
        default:
          logService.error(`Неизвестное действие операции: ${operation.action}`, operation);
          return false;
      }
    } catch (error) {
      logService.error('Ошибка при синхронизации настроек', error);
      return false;
    }
  },
  
  /**
   * Инициализация слушателей событий
   */
  initEventListeners(): void {
    // Слушатель события online
    window.addEventListener('online', () => {
      logService.info('Подключение к интернету восстановлено');
      
      // Получаем ID текущего пользователя
      const userId = localStorage.getItem('lifesprint_current_user_id');
      
      if (userId) {
        // Запускаем синхронизацию
        this.syncData(userId);
      }
    });
    
    // Слушатель события offline
    window.addEventListener('offline', () => {
      logService.info('Подключение к интернету потеряно');
      
      // Получаем ID текущего пользователя
      const userId = localStorage.getItem('lifesprint_current_user_id');
      
      if (userId) {
        // Обновляем статус синхронизации
        this.updateSyncStatus(userId, {
          inProgress: false,
          error: 'Нет подключения к интернету'
        });
      }
    });
    
    // Слушатель события beforeunload
    window.addEventListener('beforeunload', () => {
      // Получаем ID текущего пользователя
      const userId = localStorage.getItem('lifesprint_current_user_id');
      
      if (userId) {
        // Обновляем статус синхронизации
        this.updateSyncStatus(userId, {
          inProgress: false
        });
      }
    });
  },
  
  /**
   * Запуск периодической синхронизации
   */
  startPeriodicSync(userId: string, intervalMinutes: number = 5): void {
    // Запускаем синхронизацию сразу
    this.syncData(userId);
    
    // Запускаем периодическую синхронизацию
    setInterval(() => {
      // Проверяем, есть ли подключение к интернету
      if (navigator.onLine) {
        this.syncData(userId);
      }
    }, intervalMinutes * 60 * 1000);
  }
};

// Инициализация слушателей событий
syncService.initEventListeners();
