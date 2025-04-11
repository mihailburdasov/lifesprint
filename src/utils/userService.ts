import { User } from '../context/UserContext';
import { supabase } from './supabaseClient';
import { logService } from './logService';
import { ApiResponse } from './authService';
import { encryptionService } from './encryptionService';

// Префикс для ключей в localStorage
const USER_PREFIX = 'lifesprint_user_';

/**
 * Сервис для работы с данными пользователя
 */
export const userService = {
  /**
   * Получение всех пользователей (для демонстрации)
   */
  async getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    
    try {
      // Сначала пробуем получить пользователей из Supabase
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (!profilesError && profilesData && profilesData.length > 0) {
        // Преобразуем данные из Supabase в формат User
        profilesData.forEach(profile => {
          users.push({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            telegramNickname: profile.telegram_nickname
          });
        });
        
        return users;
      }
    } catch (error) {
      logService.error('Ошибка при получении пользователей из Supabase', error);
    }
    
    // Если не удалось получить из Supabase или нет пользователей, получаем из localStorage
    // Перебор всех ключей в localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Проверка, является ли ключ ключом пользователя
      if (key && key.startsWith(USER_PREFIX)) {
        const userJson = localStorage.getItem(key);
        
        if (userJson) {
          try {
            const userData = JSON.parse(userJson);
            // Удаляем пароль из данных пользователя
            const { password: _, ...userWithoutPassword } = userData;
            users.push(userWithoutPassword as User);
          } catch (error) {
            logService.error('Ошибка при парсинге данных пользователя', error);
          }
        }
      }
    }
    
    return users;
  },
  
  /**
   * Получение пользователя по ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Сначала пробуем получить пользователя из Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!profileError && profileData) {
        return {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          telegramNickname: profileData.telegram_nickname
        };
      }
      
      // Если не удалось получить из Supabase, пробуем из localStorage
      const userJson = localStorage.getItem(`${USER_PREFIX}${userId}`);
      
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          // Удаляем пароль из данных пользователя
          const { password: _, ...userWithoutPassword } = userData;
          return userWithoutPassword as User;
        } catch (error) {
          logService.error('Ошибка при парсинге данных пользователя', error);
        }
      }
      
      return null;
    } catch (error) {
      logService.error('Ошибка при получении пользователя по ID', error);
      return null;
    }
  },
  
  /**
   * Обновление данных пользователя
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      // Сначала пробуем обновить данные в Supabase
      const { data: authUser } = await supabase.auth.getUser();
      
      if (authUser && authUser.user && authUser.user.id === userId) {
        // Обновляем метаданные пользователя в Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            name: userData.name,
            telegram_nickname: userData.telegramNickname
          }
        });
        
        if (updateError) {
          logService.error('Ошибка при обновлении данных пользователя в Supabase', updateError);
        } else {
          // Обновляем профиль пользователя в таблице profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: userData.name,
              email: userData.email,
              telegram_nickname: userData.telegramNickname,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (profileError) {
            logService.error('Ошибка при обновлении профиля пользователя в Supabase', profileError);
          } else {
            // Если обновление в Supabase прошло успешно, возвращаем обновленные данные
            return {
              success: true,
              data: {
                id: userId,
                name: userData.name || '',
                email: userData.email || '',
                telegramNickname: userData.telegramNickname
              }
            };
          }
        }
      }
      
      // Если не удалось обновить в Supabase или пользователь не авторизован в Supabase,
      // обновляем данные в localStorage (для обратной совместимости)
      const userJson = localStorage.getItem(`${USER_PREFIX}${userId}`);
      
      if (!userJson) {
        return {
          success: false,
          error: 'Пользователь не найден'
        };
      }
      
      const currentUserData = JSON.parse(userJson);
      
      // Обновление данных пользователя, сохраняя пароль
      const updatedUserData = {
        ...currentUserData,
        ...userData
      };
      
      // Если есть пароль и поддерживается шифрование, сохраняем зашифрованные данные
      if (currentUserData.password && encryptionService.isSupported()) {
        try {
          const encryptionKey = await encryptionService.getKey(currentUserData.password);
          await encryptionService.secureSet(`${USER_PREFIX}${userId}`, updatedUserData, encryptionKey);
        } catch (encryptError) {
          logService.error('Ошибка при шифровании данных пользователя', encryptError);
          
          // Если шифрование не удалось, сохраняем в обычном виде
          localStorage.setItem(`${USER_PREFIX}${userId}`, JSON.stringify(updatedUserData));
        }
      } else {
        // Если нет пароля или не поддерживается шифрование, сохраняем в обычном виде
        localStorage.setItem(`${USER_PREFIX}${userId}`, JSON.stringify(updatedUserData));
      }
      
      // Возвращаем пользователя без пароля
      const { password: _, ...userWithoutPassword } = updatedUserData;
      
      return {
        success: true,
        data: userWithoutPassword as User
      };
    } catch (error) {
      logService.error('Ошибка при обновлении пользователя', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении данных пользователя'
      };
    }
  },
  
  /**
   * Удаление пользователя
   */
  async deleteUser(userId: string): Promise<ApiResponse<null>> {
    try {
      // Удаляем пользователя из Supabase
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        logService.error('Ошибка при удалении пользователя из Supabase Auth', error);
      }
      
      // Удаляем профиль пользователя из таблицы profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        logService.error('Ошибка при удалении профиля пользователя из Supabase', profileError);
      }
      
      // Удаляем прогресс пользователя из таблицы user_progress
      const { error: progressError } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', userId);
      
      if (progressError) {
        logService.error('Ошибка при удалении прогресса пользователя из Supabase', progressError);
      }
      
      // Удаляем данные пользователя из localStorage
      localStorage.removeItem(`${USER_PREFIX}${userId}`);
      localStorage.removeItem(`lifesprint_progress_${userId}`);
      localStorage.removeItem(`lifesprint_sync_queue_${userId}`);
      localStorage.removeItem(`lifesprint_sync_status_${userId}`);
      
      // Если текущий пользователь - это удаляемый пользователь, очищаем ID текущего пользователя
      const currentUserId = localStorage.getItem('lifesprint_current_user_id');
      if (currentUserId === userId) {
        localStorage.removeItem('lifesprint_current_user_id');
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      logService.error('Ошибка при удалении пользователя', error);
      return {
        success: false,
        error: 'Произошла ошибка при удалении пользователя'
      };
    }
  },
  
  /**
   * Получение профиля пользователя
   */
  async getUserProfile(userId: string): Promise<ApiResponse<any>> {
    try {
      // Получаем профиль пользователя из Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        return {
          success: false,
          error: profileError.message || 'Ошибка при получении профиля пользователя'
        };
      }
      
      return {
        success: true,
        data: profileData
      };
    } catch (error) {
      logService.error('Ошибка при получении профиля пользователя', error);
      return {
        success: false,
        error: 'Произошла ошибка при получении профиля пользователя'
      };
    }
  },
  
  /**
   * Обновление профиля пользователя
   */
  async updateUserProfile(userId: string, profileData: any): Promise<ApiResponse<any>> {
    try {
      // Обновляем профиль пользователя в Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          error: error.message || 'Ошибка при обновлении профиля пользователя'
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      logService.error('Ошибка при обновлении профиля пользователя', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении профиля пользователя'
      };
    }
  },
  
  /**
   * Получение настроек пользователя
   */
  async getUserSettings(userId: string): Promise<ApiResponse<any>> {
    try {
      // Получаем настройки пользователя из Supabase
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // Если настройки не найдены, создаем их
        if (error.code === 'PGRST116') {
          const defaultSettings = {
            user_id: userId,
            theme: 'light',
            notifications_enabled: true,
            email_notifications: true,
            language: 'ru',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: newData, error: insertError } = await supabase
            .from('user_settings')
            .insert(defaultSettings)
            .select()
            .single();
          
          if (insertError) {
            return {
              success: false,
              error: insertError.message || 'Ошибка при создании настроек пользователя'
            };
          }
          
          return {
            success: true,
            data: newData
          };
        }
        
        return {
          success: false,
          error: error.message || 'Ошибка при получении настроек пользователя'
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      logService.error('Ошибка при получении настроек пользователя', error);
      return {
        success: false,
        error: 'Произошла ошибка при получении настроек пользователя'
      };
    }
  },
  
  /**
   * Обновление настроек пользователя
   */
  async updateUserSettings(userId: string, settingsData: any): Promise<ApiResponse<any>> {
    try {
      // Обновляем настройки пользователя в Supabase
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...settingsData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          error: error.message || 'Ошибка при обновлении настроек пользователя'
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      logService.error('Ошибка при обновлении настроек пользователя', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении настроек пользователя'
      };
    }
  }
};
