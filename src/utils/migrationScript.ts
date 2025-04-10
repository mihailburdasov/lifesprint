import { supabase } from './supabaseClient';
import { User } from '../context/UserContext';
import { UserProgress } from '../context/ProgressContext';

/**
 * Helper function to create a delay
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Migrates user data from localStorage to Supabase
 * @param updateStatus Optional callback to update migration status in UI
 */
export const migrateLocalDataToSupabase = async (
  updateStatus?: (status: {
    inProgress: boolean;
    message: string | null;
    success: boolean | null;
    migratedUsers: number;
    totalUsers: number;
  }) => void
): Promise<{
  success: boolean;
  message: string;
  migratedUsers: number;
  totalUsers: number;
}> => {
  try {
    // Get all local users
    const localUsers: (User & { password?: string })[] = [];
    const userProgressMap: Record<string, UserProgress> = {};
    
    // Iterate through all keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Process user data
      if (key && key.startsWith('lifesprint_user_')) {
        const userJson = localStorage.getItem(key);
        if (userJson) {
          try {
            const userData = JSON.parse(userJson);
            const userId = key.replace('lifesprint_user_', '');
            
            // Extract password and other user data
            localUsers.push(userData);
            
            // Get user progress
            const progressKey = `lifesprint_progress_${userId}`;
            const progressJson = localStorage.getItem(progressKey);
            
            if (progressJson) {
              const progress = JSON.parse(progressJson);
              userProgressMap[userId] = progress;
            }
          } catch (error) {
            console.error('Ошибка при парсинге данных пользователя:', error);
          }
        }
      }
    }
    
    // If no local users, end migration
    if (localUsers.length === 0) {
      return {
        success: true,
        message: 'Нет локальных пользователей для миграции',
        migratedUsers: 0,
        totalUsers: 0
      };
    }
    
    // Migrate each user to Supabase
    let migratedCount = 0;
    const migrationErrors: string[] = [];
    
    for (const user of localUsers) {
      let retryCount = 0;
      let success = false;
      
      while (!success && retryCount < 3) { // Максимум 3 попытки
        try {
          // 1. Create user in Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password || 'TemporaryPassword123!', // Fallback if password is missing
            options: {
              data: {
                name: user.name,
                telegram_nickname: user.telegramNickname
              }
            }
          });
          
          if (authError) {
            // Проверяем, связана ли ошибка с ограничением частоты запросов
            if (authError.message.includes('For security purposes, you can only request this after')) {
              // Извлекаем время ожидания из сообщения об ошибке
              const waitTimeMatch = authError.message.match(/after (\d+) seconds/);
              const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) * 1000 + 5000 : 60000; // Добавляем 5 секунд для надежности
              
              const waitTimeSeconds = Math.ceil(waitTime / 1000);
              const statusMessage = `Ожидание ${waitTimeSeconds} секунд перед повторной попыткой для ${user.email}... (попытка ${retryCount + 1}/3)`;
              
              console.log(statusMessage);
              
              // Обновляем статус миграции для UI
              if (updateStatus) {
                updateStatus({
                  inProgress: true,
                  message: statusMessage,
                  success: null,
                  migratedUsers: migratedCount,
                  totalUsers: localUsers.length
                });
              }
              
              await delay(waitTime);
              retryCount++;
              continue; // Повторяем попытку
            } else {
              // Другая ошибка, не связанная с ограничением частоты
              migrationErrors.push(`Ошибка при создании пользователя ${user.email}: ${authError.message}`);
              break; // Прекращаем попытки для этого пользователя
            }
          }
        
          if (!authData.user) {
            migrationErrors.push(`Не удалось создать пользователя ${user.email}: пользователь не возвращен`);
            break;
          }
        
          const supabaseUserId = authData.user.id;
          
          // 2. Create user profile in profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUserId,
              name: user.name,
              email: user.email,
              telegram_nickname: user.telegramNickname
            });
          
          if (profileError) {
            migrationErrors.push(`Ошибка при создании профиля для ${user.email}: ${profileError.message}`);
            // Continue with progress migration even if profile creation fails
          }
          
          // 3. Migrate user progress if it exists
          const userProgress = userProgressMap[user.id];
          
          if (userProgress) {
            const { error: progressError } = await supabase
              .from('user_progress')
              .insert({
                user_id: supabaseUserId,
                start_date: new Date(userProgress.startDate).toISOString(),
                current_day: userProgress.currentDay,
                days: userProgress.days,
                week_reflections: userProgress.weekReflections
              });
            
            if (progressError) {
              migrationErrors.push(`Ошибка при миграции прогресса для ${user.email}: ${progressError.message}`);
            }
          }
          
          migratedCount++;
          success = true; // Успешно мигрировали пользователя
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Проверяем, связана ли ошибка с ограничением частоты запросов
          if (errorMessage.includes('For security purposes, you can only request this after')) {
            // Извлекаем время ожидания из сообщения об ошибке
            const waitTimeMatch = errorMessage.match(/after (\d+) seconds/);
            const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) * 1000 + 5000 : 60000;
            
            const waitTimeSeconds = Math.ceil(waitTime / 1000);
            const statusMessage = `Ожидание ${waitTimeSeconds} секунд перед повторной попыткой для ${user.email}... (попытка ${retryCount + 1}/3)`;
            
            console.log(statusMessage);
            
            // Обновляем статус миграции для UI
            if (updateStatus) {
              updateStatus({
                inProgress: true,
                message: statusMessage,
                success: null,
                migratedUsers: migratedCount,
                totalUsers: localUsers.length
              });
            }
            
            await delay(waitTime);
            retryCount++;
          } else {
            // Другая ошибка
            migrationErrors.push(`Ошибка при миграции пользователя ${user.email}: ${errorMessage}`);
            break;
          }
        }
      }
      
      // Если все попытки неудачны, добавляем ошибку
      if (!success && retryCount >= 3) {
        const errorMessage = `Не удалось мигрировать пользователя ${user.email} после ${retryCount} попыток`;
        migrationErrors.push(errorMessage);
        
        // Обновляем статус миграции для UI
        if (updateStatus) {
          updateStatus({
            inProgress: true,
            message: `Ошибка: ${errorMessage}`,
            success: null,
            migratedUsers: migratedCount,
            totalUsers: localUsers.length
          });
        }
      }
    }
    
    // Prepare result message
    let resultMessage = `Успешно мигрировано ${migratedCount} из ${localUsers.length} пользователей`;
    
    if (migrationErrors.length > 0) {
      resultMessage += `. Ошибки: ${migrationErrors.join('; ')}`;
    }
    
    return {
      success: migratedCount > 0,
      message: resultMessage,
      migratedUsers: migratedCount,
      totalUsers: localUsers.length
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Ошибка при миграции данных:', error);
    return {
      success: false,
      message: `Ошибка при миграции данных: ${errorMessage}`,
      migratedUsers: 0,
      totalUsers: 0
    };
  }
};

/**
 * Clears local user data after successful migration
 */
export const clearLocalUserData = (): void => {
  // Iterate through all keys in localStorage
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('lifesprint_user_') || key.startsWith('lifesprint_progress_'))) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all found keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Remove current user
  localStorage.removeItem('lifesprint_current_user_id');
};
