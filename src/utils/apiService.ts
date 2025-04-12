/**
 * Сервис для работы с данными пользователя
 * Фасад, перенаправляющий вызовы к специализированным сервисам
 * Сохранен для обратной совместимости
 */

import { authService } from './authService';
import { userService } from './userService';
import { progressService } from './progressService';
import { syncService } from './syncService';
import { logService } from './logService';

// Реэкспорт интерфейса ApiResponse для обратной совместимости
export type { ApiResponse } from './authService';

/**
 * Сервис для работы с данными пользователя
 * Фасад для обратной совместимости
 */
export const apiService = {
  /**
   * Проверка блокировки входа
   */
  checkLoginLockout: authService.checkLoginLockout.bind(authService),
  
  /**
   * Обновление счетчика попыток входа
   */
  updateLoginAttempts: authService.updateLoginAttempts.bind(authService),
  
  /**
   * Добавление в очередь синхронизации
   */
  addToQueue: syncService.addToQueue.bind(syncService),
  
  /**
   * Обработка очереди синхронизации
   */
  processSyncQueue: syncService.syncData.bind(syncService),
  
  /**
   * Регистрация пользователя
   */
  register: authService.register.bind(authService),
  
  /**
   * Вход пользователя
   */
  login: authService.login.bind(authService),
  
  /**
   * Вход пользователя через localStorage (для обратной совместимости)
   */
  loginWithLocalStorage: authService.loginWithLocalStorage.bind(authService),
  
  /**
   * Поиск локального пользователя по email
   */
  findLocalUserByEmail: authService.findLocalUserByEmail.bind(authService),
  
  /**
   * Миграция прогресса пользователя из localStorage в Supabase
   */
  async migrateUserProgressToSupabase(localUserId: string, supabaseUserId: string): Promise<boolean> {
    try {
      // Получаем прогресс локального пользователя
      const localProgressResponse = await progressService.getUserProgress(localUserId);
      
      if (!localProgressResponse.success || !localProgressResponse.data) {
        return false;
      }
      
      const localProgress = localProgressResponse.data;
      
      // Получаем прогресс пользователя в Supabase
      const supabaseProgressResponse = await progressService.getUserProgress(supabaseUserId);
      
      // Если у пользователя в Supabase уже есть прогресс, объединяем данные
      if (supabaseProgressResponse.success && supabaseProgressResponse.data) {
        const supabaseProgress = supabaseProgressResponse.data;
        
        // Обновляем прогресс пользователя в Supabase
        const updateResponse = await progressService.updateUserProgress(supabaseUserId, {
          ...supabaseProgress,
          days: { ...supabaseProgress.days, ...localProgress.days },
          weekReflections: { ...supabaseProgress.weekReflections, ...localProgress.weekReflections }
        });
        
        return updateResponse.success;
      } else {
        // Если у пользователя в Supabase нет прогресса, создаем новый
        const updateResponse = await progressService.updateUserProgress(supabaseUserId, localProgress);
        
        return updateResponse.success;
      }
    } catch (error) {
      logService.error('Ошибка при миграции прогресса пользователя', error);
      return false;
    }
  },
  
  /**
   * Обновление данных пользователя
   */
  updateUser: userService.updateUser.bind(userService),
  
  /**
   * Получение прогресса пользователя
   */
  getUserProgress: progressService.getUserProgress.bind(progressService),
  
  /**
   * Обновление прогресса пользователя
   */
  updateUserProgress: progressService.updateUserProgress.bind(progressService),
  
  /**
   * Инициализация прогресса пользователя
   */
  initUserProgress: progressService.initUserProgress.bind(progressService),
  
  /**
   * Получение всех пользователей (для демонстрации)
   */
  getAllUsers: userService.getAllUsers.bind(userService)
};
