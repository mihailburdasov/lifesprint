import { supabase } from './supabaseClient';
import { User } from '../context/UserContext';
import { UserProgress } from '../context/ProgressContext';

/**
 * Migrates user data from localStorage to Supabase
 */
export const migrateLocalDataToSupabase = async (): Promise<{
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
          migrationErrors.push(`Ошибка при создании пользователя ${user.email}: ${authError.message}`);
          continue;
        }
        
        if (!authData.user) {
          migrationErrors.push(`Не удалось создать пользователя ${user.email}: пользователь не возвращен`);
          continue;
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        migrationErrors.push(`Ошибка при миграции пользователя ${user.email}: ${errorMessage}`);
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
