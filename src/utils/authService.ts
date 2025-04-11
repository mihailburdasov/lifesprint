import { User } from '../context/UserContext';
import { supabase } from './supabaseClient';
import { logService } from './logService';
import { encryptionService } from './encryptionService';

// Префиксы для ключей в localStorage
const USER_PREFIX = 'lifesprint_user_';
const LOGIN_ATTEMPTS_PREFIX = 'lifesprint_login_attempts_';

// Константы для защиты от брутфорса
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 минут в миллисекундах

// Интерфейс для ответа API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Интерфейс для отслеживания попыток входа
interface LoginAttempts {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

/**
 * Сервис для аутентификации пользователей
 */
export const authService = {
  /**
   * Проверка блокировки входа
   */
  checkLoginLockout(email: string): { locked: boolean; remainingTime: number } {
    try {
      const attemptsJson = localStorage.getItem(`${LOGIN_ATTEMPTS_PREFIX}${email}`);
      if (!attemptsJson) {
        return { locked: false, remainingTime: 0 };
      }
      
      const attempts: LoginAttempts = JSON.parse(attemptsJson);
      const now = Date.now();
      
      // Если аккаунт заблокирован и время блокировки не истекло
      if (attempts.lockedUntil && attempts.lockedUntil > now) {
        const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60); // в минутах
        return { locked: true, remainingTime };
      }
      
      // Если время блокировки истекло, сбрасываем счетчик
      if (attempts.lockedUntil && attempts.lockedUntil <= now) {
        localStorage.setItem(`${LOGIN_ATTEMPTS_PREFIX}${email}`, JSON.stringify({
          count: 0,
          lastAttempt: now,
          lockedUntil: null
        }));
        return { locked: false, remainingTime: 0 };
      }
      
      return { locked: false, remainingTime: 0 };
    } catch (error) {
      logService.error('Ошибка при проверке блокировки входа', error);
      return { locked: false, remainingTime: 0 };
    }
  },
  
  /**
   * Обновление счетчика попыток входа
   */
  updateLoginAttempts(email: string, success: boolean): void {
    try {
      const now = Date.now();
      const attemptsJson = localStorage.getItem(`${LOGIN_ATTEMPTS_PREFIX}${email}`);
      let attempts: LoginAttempts = attemptsJson 
        ? JSON.parse(attemptsJson) 
        : { count: 0, lastAttempt: now, lockedUntil: null };
      
      if (success) {
        // Сбрасываем счетчик при успешном входе
        attempts = { count: 0, lastAttempt: now, lockedUntil: null };
      } else {
        // Увеличиваем счетчик при неудачной попытке
        attempts.count++;
        attempts.lastAttempt = now;
        
        // Если превышено максимальное количество попыток, блокируем аккаунт
        if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
          attempts.lockedUntil = now + LOCKOUT_TIME;
        }
      }
      
      localStorage.setItem(`${LOGIN_ATTEMPTS_PREFIX}${email}`, JSON.stringify(attempts));
    } catch (error) {
      logService.error('Ошибка при обновлении счетчика попыток входа', error);
    }
  },
  
  /**
   * Регистрация пользователя
   */
  async register(name: string, email: string, password: string, telegramNickname?: string): Promise<ApiResponse<User>> {
    try {
      // Регистрация пользователя в Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            telegram_nickname: telegramNickname
          }
        }
      });
      
      if (authError) {
        return {
          success: false,
          error: authError.message || 'Ошибка при регистрации'
        };
      }
      
      if (!authData.user) {
        return {
          success: false,
          error: 'Не удалось создать пользователя'
        };
      }
      
      // Создаем запись в таблице profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name,
          email,
          telegram_nickname: telegramNickname
        });
      
      if (profileError) {
        logService.error('Ошибка при создании профиля', profileError);
      }
      
      // Для обратной совместимости также сохраняем в localStorage
      const newUser: User = {
        id: authData.user.id,
        name,
        email,
        telegramNickname
      };
      
      // Генерируем ключ шифрования на основе пароля
      if (encryptionService.isSupported()) {
        try {
          const encryptionKey = await encryptionService.generateKey(password);
          
          // Сохраняем зашифрованные данные пользователя
          await encryptionService.secureSet(`${USER_PREFIX}${newUser.id}`, {
            ...newUser,
            password
          }, encryptionKey);
        } catch (encryptError) {
          logService.error('Ошибка при шифровании данных пользователя', encryptError);
          
          // Если шифрование не удалось, сохраняем в обычном виде
          localStorage.setItem(`${USER_PREFIX}${newUser.id}`, JSON.stringify({
            ...newUser,
            password
          }));
        }
      } else {
        // Если Web Crypto API не поддерживается, сохраняем в обычном виде
        localStorage.setItem(`${USER_PREFIX}${newUser.id}`, JSON.stringify({
          ...newUser,
          password
        }));
      }
      
      return {
        success: true,
        data: newUser
      };
    } catch (error) {
      logService.error('Ошибка при регистрации', error);
      return {
        success: false,
        error: 'Произошла ошибка при регистрации'
      };
    }
  },
  
  /**
   * Вход пользователя
   */
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      // Проверяем блокировку
      const { locked, remainingTime } = this.checkLoginLockout(email);
      if (locked) {
        return {
          success: false,
          error: `Слишком много неудачных попыток входа. Попробуйте снова через ${remainingTime} минут.`
        };
      }
      
      // Вход пользователя через Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        // Обновляем счетчик неудачных попыток
        this.updateLoginAttempts(email, false);
        
        // Если ошибка в Supabase, пробуем войти через localStorage (для обратной совместимости)
        return this.loginWithLocalStorage(email, password);
      }
      
      if (!authData.user) {
        // Обновляем счетчик неудачных попыток
        this.updateLoginAttempts(email, false);
        
        return {
          success: false,
          error: 'Не удалось войти'
        };
      }
      
      // Обновляем счетчик при успешном входе
      this.updateLoginAttempts(email, true);
      
      // Получаем дополнительные данные пользователя из метаданных
      const { id } = authData.user;
      const name = authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Пользователь';
      const telegramNickname = authData.user.user_metadata?.telegram_nickname;
      
      // Сохраняем ID пользователя в localStorage для обратной совместимости
      localStorage.setItem('lifesprint_current_user_id', id);
      
      return {
        success: true,
        data: {
          id,
          name,
          email: authData.user.email || '',
          telegramNickname
        }
      };
    } catch (error) {
      logService.error('Ошибка при входе', error);
      
      // Обновляем счетчик неудачных попыток
      this.updateLoginAttempts(email, false);
      
      return {
        success: false,
        error: 'Произошла ошибка при входе'
      };
    }
  },
  
  /**
   * Вход пользователя через localStorage (для обратной совместимости)
   */
  async loginWithLocalStorage(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      // Перебор всех ключей в localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Проверка, является ли ключ ключом пользователя
        if (key && key.startsWith(USER_PREFIX)) {
          try {
            let userData: any = null;
            
            // Пробуем получить данные с использованием шифрования
            if (encryptionService.isSupported()) {
              try {
                const encryptionKey = await encryptionService.getKey(password);
                userData = await encryptionService.secureGet(key, encryptionKey);
              } catch (encryptError) {
                logService.error('Ошибка при дешифровании данных пользователя', encryptError);
                
                // Если дешифрование не удалось, пробуем получить данные в обычном виде
                const userJson = localStorage.getItem(key);
                if (userJson) {
                  userData = JSON.parse(userJson);
                }
              }
            } else {
              // Если Web Crypto API не поддерживается, получаем данные в обычном виде
              const userJson = localStorage.getItem(key);
              if (userJson) {
                userData = JSON.parse(userJson);
              }
            }
            
            // Проверяем совпадение email и пароля
            if (userData && userData.email === email && userData.password === password) {
              // Обновляем счетчик при успешном входе
              this.updateLoginAttempts(email, true);
              
              // Сохраняем ID пользователя в localStorage для обратной совместимости
              localStorage.setItem('lifesprint_current_user_id', userData.id);
              
              // Возвращаем пользователя без пароля
              const { password: _, ...userWithoutPassword } = userData;
              return {
                success: true,
                data: userWithoutPassword as User
              };
            }
            
            // Если email совпадает, но пароль нет
            if (userData && userData.email === email) {
              // Обновляем счетчик неудачных попыток
              this.updateLoginAttempts(email, false);
              
              return {
                success: false,
                error: 'Неверный пароль'
              };
            }
          } catch (error) {
            logService.error('Ошибка при парсинге данных пользователя', error);
          }
        }
      }
      
      // Если пользователь не найден
      return {
        success: false,
        error: 'Пользователь с таким email не найден'
      };
    } catch (error) {
      logService.error('Ошибка при входе через localStorage', error);
      return {
        success: false,
        error: 'Произошла ошибка при входе'
      };
    }
  },
  
  /**
   * Поиск локального пользователя по email
   */
  async findLocalUserByEmail(email: string): Promise<(User & { password?: string }) | null> {
    // Перебор всех ключей в localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Проверка, является ли ключ ключом пользователя
      if (key && key.startsWith(USER_PREFIX)) {
        try {
          const userJson = localStorage.getItem(key);
          
          if (userJson) {
            const userData = JSON.parse(userJson);
            if (userData.email === email) {
              return userData;
            }
          }
        } catch (error) {
          logService.error('Ошибка при парсинге данных пользователя', error);
        }
      }
    }
    
    return null;
  },
  
  /**
   * Выход пользователя
   */
  async logout(): Promise<void> {
    try {
      // Выход из Supabase
      await supabase.auth.signOut();
      
      // Очищаем localStorage (для обратной совместимости)
      localStorage.removeItem('lifesprint_current_user_id');
    } catch (error) {
      logService.error('Ошибка при выходе', error);
      // Даже если произошла ошибка, очищаем состояние пользователя
      localStorage.removeItem('lifesprint_current_user_id');
    }
  },
  
  /**
   * Выход со всех устройств
   */
  async logoutFromAllDevices(): Promise<void> {
    try {
      // Выход из всех сессий Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        logService.error('Ошибка при выходе со всех устройств', error);
        throw error;
      }
      
      // Очищаем localStorage (для обратной совместимости)
      localStorage.removeItem('lifesprint_current_user_id');
    } catch (error) {
      logService.error('Ошибка при выходе со всех устройств', error);
      // Даже если произошла ошибка, очищаем состояние пользователя
      localStorage.removeItem('lifesprint_current_user_id');
    }
  },
  
  /**
   * Проверка подтверждения email
   */
  async checkEmailVerification(userId: string): Promise<boolean> {
    try {
      const { data: userData, error } = await supabase.auth.getUser();
      
      if (error || !userData.user) {
        return false;
      }
      
      // Проверяем, подтвержден ли email
      return !!userData.user.email_confirmed_at;
    } catch (error) {
      logService.error('Ошибка при проверке подтверждения email', error);
      return false;
    }
  },
  
  /**
   * Сброс пароля
   */
  async resetPassword(email: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-confirm`
      });
      
      if (error) {
        return {
          success: false,
          error: error.message || 'Ошибка при сбросе пароля'
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      logService.error('Ошибка при сбросе пароля', error);
      return {
        success: false,
        error: 'Произошла ошибка при сбросе пароля'
      };
    }
  },
  
  /**
   * Обновление пароля
   */
  async updatePassword(newPassword: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        return {
          success: false,
          error: error.message || 'Ошибка при обновлении пароля'
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      logService.error('Ошибка при обновлении пароля', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении пароля'
      };
    }
  },
  
  /**
   * Получение текущего пользователя
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      const { id, email } = data.user;
      const name = data.user.user_metadata?.name || email?.split('@')[0] || 'Пользователь';
      const telegramNickname = data.user.user_metadata?.telegram_nickname;
      
      return {
        id,
        name,
        email: email || '',
        telegramNickname
      };
    } catch (error) {
      logService.error('Ошибка при получении текущего пользователя', error);
      return null;
    }
  }
};
