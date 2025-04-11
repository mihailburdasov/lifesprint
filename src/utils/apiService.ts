/**
 * Сервис для работы с данными пользователя
 * Поддерживает как локальное хранилище (localStorage), так и облачное (Supabase)
 */

import { User } from '../context/UserContext';
import { UserProgress } from '../context/ProgressContext';
import { supabase } from './supabaseClient';

// Префиксы для ключей в localStorage
const USER_PREFIX = 'lifesprint_user_';
const PROGRESS_PREFIX = 'lifesprint_progress_';
const SYNC_QUEUE_PREFIX = 'lifesprint_sync_queue_';
const SYNC_STATUS_PREFIX = 'lifesprint_sync_status_';
const LOGIN_ATTEMPTS_PREFIX = 'lifesprint_login_attempts_';

// Константы для защиты от брутфорса
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 минут в миллисекундах

// Интерфейс для ответа API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Интерфейс для статуса синхронизации
interface SyncStatus {
  synced: boolean;
  lastAttempt: Date;
  error: string | null;
}

// Интерфейс для элемента очереди синхронизации
interface SyncQueueItem {
  userId: string;
  type: 'progress' | 'profile';
  data: any;
  timestamp: number;
  attempts: number;
}

// Интерфейс для отслеживания попыток входа
interface LoginAttempts {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

/**
 * Сервис для работы с данными пользователя
 */
export const apiService = {
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
      console.error('Ошибка при проверке блокировки входа:', error);
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
      console.error('Ошибка при обновлении счетчика попыток входа:', error);
    }
  },
  
  /**
   * Добавление в очередь синхронизации
   */
  addToSyncQueue(userId: string, type: 'progress' | 'profile', data: any): void {
    try {
      // Получаем текущую очередь
      const queueJson = localStorage.getItem(`${SYNC_QUEUE_PREFIX}${userId}`) || '[]';
      const queue: SyncQueueItem[] = JSON.parse(queueJson);
      
      // Добавляем новый элемент
      queue.push({
        userId,
        type,
        data,
        timestamp: Date.now(),
        attempts: 0
      });
      
      // Сохраняем обновленную очередь
      localStorage.setItem(`${SYNC_QUEUE_PREFIX}${userId}`, JSON.stringify(queue));
    } catch (error) {
      console.error('Ошибка при добавлении в очередь синхронизации:', error);
    }
  },
  
  /**
   * Обработка очереди синхронизации
   */
  async processSyncQueue(userId: string): Promise<void> {
    try {
      // Получаем текущую очередь
      const queueJson = localStorage.getItem(`${SYNC_QUEUE_PREFIX}${userId}`);
      if (!queueJson) return;
      
      const queue: SyncQueueItem[] = JSON.parse(queueJson);
      if (queue.length === 0) return;
      
      // Создаем новую очередь для элементов, которые не удалось синхронизировать
      const newQueue: SyncQueueItem[] = [];
      
      // Обрабатываем каждый элемент очереди
      for (const item of queue) {
        // Увеличиваем счетчик попыток
        item.attempts++;
        
        // Пропускаем элементы, которые пытались синхронизировать слишком много раз
        if (item.attempts > 5) {
          console.warn('Элемент очереди синхронизации превысил максимальное количество попыток:', item);
          continue;
        }
        
        try {
          if (item.type === 'progress') {
            // Синхронизируем прогресс
            const { error } = await supabase
              .from('user_progress')
              .upsert({
                user_id: userId,
                start_date: new Date(item.data.startDate).toISOString(),
                current_day: item.data.currentDay,
                days: item.data.days,
                week_reflections: item.data.weekReflections,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });
            
            if (error) {
              console.error('Ошибка при синхронизации прогресса:', error);
              newQueue.push(item);
            } else {
              // Обновляем статус синхронизации
              const syncStatus = {
                synced: true,
                lastAttempt: new Date(),
                error: null
              };
              localStorage.setItem(`${SYNC_STATUS_PREFIX}${userId}`, JSON.stringify(syncStatus));
            }
          } else if (item.type === 'profile') {
            // Синхронизируем профиль
            const { error } = await supabase
              .from('profiles')
              .update({
                name: item.data.name,
                email: item.data.email,
                telegram_nickname: item.data.telegramNickname,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
            
            if (error) {
              console.error('Ошибка при синхронизации профиля:', error);
              newQueue.push(item);
            }
          }
        } catch (error) {
          console.error('Ошибка при обработке элемента очереди синхронизации:', error);
          newQueue.push(item);
        }
      }
      
      // Сохраняем обновленную очередь
      localStorage.setItem(`${SYNC_QUEUE_PREFIX}${userId}`, JSON.stringify(newQueue));
    } catch (error) {
      console.error('Ошибка при обработке очереди синхронизации:', error);
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
        console.error('Ошибка при создании профиля:', profileError);
      }
      
      // Инициализируем прогресс пользователя
      await this.initUserProgress(authData.user.id);
      
      // Для обратной совместимости также сохраняем в localStorage
      const newUser: User = {
        id: authData.user.id,
        name,
        email,
        telegramNickname
      };
      
      localStorage.setItem(`${USER_PREFIX}${newUser.id}`, JSON.stringify({
        ...newUser,
        password
      }));
      
      return {
        success: true,
        data: newUser
      };
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
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
      
      // Проверяем, есть ли у пользователя локальные данные, которые нужно мигрировать
      const localUserData = this.findLocalUserByEmail(email);
      if (localUserData && localUserData.id !== id) {
        // Мигрируем данные прогресса из localStorage в Supabase
        await this.migrateUserProgressToSupabase(localUserData.id, id);
      }
      
      // Обрабатываем очередь синхронизации
      await this.processSyncQueue(id);
      
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
      console.error('Ошибка при входе:', error);
      
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
  loginWithLocalStorage(email: string, password: string): ApiResponse<User> {
    try {
      // Перебор всех ключей в localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Проверка, является ли ключ ключом пользователя
        if (key && key.startsWith(USER_PREFIX)) {
          const userJson = localStorage.getItem(key);
          
          if (userJson) {
            try {
              const userData = JSON.parse(userJson);
              // Проверяем совпадение email и пароля
              if (userData.email === email && userData.password === password) {
                // Обновляем счетчик при успешном входе
                this.updateLoginAttempts(email, true);
                
                // Возвращаем пользователя без пароля
                const { password: _, ...userWithoutPassword } = userData;
                return {
                  success: true,
                  data: userWithoutPassword as User
                };
              }
              // Если email совпадает, но пароль нет
              if (userData.email === email) {
                // Обновляем счетчик неудачных попыток
                this.updateLoginAttempts(email, false);
                
                return {
                  success: false,
                  error: 'Неверный пароль'
                };
              }
            } catch (error) {
              console.error('Ошибка при парсинге данных пользователя:', error);
            }
          }
        }
      }
      
      // Если пользователь не найден
      return {
        success: false,
        error: 'Пользователь с таким email не найден'
      };
    } catch (error) {
      console.error('Ошибка при входе через localStorage:', error);
      return {
        success: false,
        error: 'Произошла ошибка при входе'
      };
    }
  },
  
  /**
   * Поиск локального пользователя по email
   */
  findLocalUserByEmail(email: string): (User & { password?: string }) | null {
    // Перебор всех ключей в localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Проверка, является ли ключ ключом пользователя
      if (key && key.startsWith(USER_PREFIX)) {
        const userJson = localStorage.getItem(key);
        
        if (userJson) {
          try {
            const userData = JSON.parse(userJson);
            if (userData.email === email) {
              return userData;
            }
          } catch (error) {
            console.error('Ошибка при парсинге данных пользователя:', error);
          }
        }
      }
    }
    
    return null;
  },
  
  /**
   * Миграция прогресса пользователя из localStorage в Supabase
   */
  async migrateUserProgressToSupabase(localUserId: string, supabaseUserId: string): Promise<boolean> {
    try {
      // Получаем прогресс пользователя из localStorage
      const progressKey = `${PROGRESS_PREFIX}${localUserId}`;
      const progressJson = localStorage.getItem(progressKey);
      
      if (!progressJson) {
        return false;
      }
      
      const progress = JSON.parse(progressJson) as UserProgress;
      
      // Сохраняем прогресс в Supabase
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: supabaseUserId,
          start_date: new Date(progress.startDate).toISOString(),
          current_day: progress.currentDay,
          days: progress.days,
          week_reflections: progress.weekReflections,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Ошибка при миграции прогресса в Supabase:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при миграции прогресса пользователя:', error);
      return false;
    }
  },
  
  /**
   * Обновление данных пользователя
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      // Сначала пробуем обновить данные в Supabase
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authUser && authUser.user && authUser.user.id === userId) {
        // Обновляем метаданные пользователя в Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            name: userData.name,
            telegram_nickname: userData.telegramNickname
          }
        });
        
        if (updateError) {
          console.error('Ошибка при обновлении данных пользователя в Supabase:', updateError);
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
            console.error('Ошибка при обновлении профиля пользователя в Supabase:', profileError);
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
      
      // Сохранение обновленных данных
      localStorage.setItem(`${USER_PREFIX}${userId}`, JSON.stringify(updatedUserData));
      
      // Возвращаем пользователя без пароля
      const { password: _, ...userWithoutPassword } = updatedUserData;
      
      return {
        success: true,
        data: userWithoutPassword as User
      };
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении данных пользователя'
      };
    }
  },
  
  /**
   * Получение прогресса пользователя
   */
  async getUserProgress(userId: string): Promise<ApiResponse<UserProgress>> {
    try {
      // Сначала пробуем получить прогресс из Supabase
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!progressError && progressData) {
        // Преобразуем данные из Supabase в формат UserProgress
        const progress: UserProgress = {
          startDate: new Date(progressData.start_date),
          currentDay: progressData.current_day,
          days: progressData.days || {},
          weekReflections: progressData.week_reflections || {}
        };
        
        return {
          success: true,
          data: progress
        };
      }
      
      // Если не удалось получить из Supabase, пробуем из localStorage
      const progressJson = localStorage.getItem(`${PROGRESS_PREFIX}${userId}`);
      
      if (!progressJson) {
        // Если прогресс не найден, инициализируем его
        const newProgress = await this.initUserProgress(userId);
        
        return {
          success: true,
          data: newProgress
        };
      }
      
      const progress = JSON.parse(progressJson) as UserProgress;
      
      // Преобразование строковой даты в объект Date
      progress.startDate = new Date(progress.startDate);
      
      return {
        success: true,
        data: progress
      };
    } catch (error) {
      console.error('Ошибка при получении прогресса пользователя:', error);
      return {
        success: false,
        error: 'Произошла ошибка при получении прогресса пользователя'
      };
    }
  },
  
  /**
   * Обновление прогресса пользователя
   */
  async updateUserProgress(userId: string, progressData: UserProgress): Promise<ApiResponse<UserProgress>> {
    try {
      // Добавляем флаг для отслеживания статуса синхронизации
      let syncStatus: SyncStatus = {
        synced: false,
        lastAttempt: new Date(),
        error: null
      };
      
      // Сохраняем статус синхронизации в localStorage
      localStorage.setItem(`${SYNC_STATUS_PREFIX}${userId}`, JSON.stringify(syncStatus));
      
      // Пробуем обновить прогресс в Supabase с повторными попытками
      let attempts = 0;
      const maxAttempts = 3;
      let progressError = null;
      
      while (attempts < maxAttempts) {
        try {
          const { error } = await supabase
            .from('user_progress')
            .upsert({
              user_id: userId,
              start_date: progressData.startDate.toISOString(),
              current_day: progressData.currentDay,
              days: progressData.days,
              week_reflections: progressData.weekReflections,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
          
          if (!error) {
            // Успешное обновление
            syncStatus = {
              synced: true,
              lastAttempt: new Date(),
              error: null
            };
            localStorage.setItem(`${SYNC_STATUS_PREFIX}${userId}`, JSON.stringify(syncStatus));
            
            return {
              success: true,
              data: progressData
            };
          }
          
          progressError = error;
          attempts++;
          
          // Ждем перед следующей попыткой (экспоненциальная задержка)
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
          }
        } catch (e) {
          progressError = e instanceof Error ? e : new Error(String(e));
          attempts++;
          
          // Ждем перед следующей попыткой
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
          }
        }
      }
      
      // Если все попытки не удались, сохраняем в localStorage и обновляем статус синхронизации
      localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(progressData));
      
      syncStatus = {
        synced: false,
        lastAttempt: new Date(),
        error: progressError ? (progressError instanceof Error ? progressError.message : String(progressError)) : 'Неизвестная ошибка'
      };
      localStorage.setItem(`${SYNC_STATUS_PREFIX}${userId}`, JSON.stringify(syncStatus));
      
      // Добавляем в очередь синхронизации для повторной попытки позже
      this.addToSyncQueue(userId, 'progress', progressData);
      
      return {
        success: false,
        error: 'Не удалось синхронизировать данные с сервером. Данные сохранены локально и будут синхронизированы позже.',
        data: progressData
      };
    } catch (error) {
      console.error('Ошибка при обновлении прогресса пользователя:', error);
      
      // В случае ошибки сохраняем в localStorage
      localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(progressData));
      
      // Обновляем статус синхронизации
      const syncStatus: SyncStatus = {
        synced: false,
        lastAttempt: new Date(),
        error: error instanceof Error ? error.message : String(error)
      };
      localStorage.setItem(`${SYNC_STATUS_PREFIX}${userId}`, JSON.stringify(syncStatus));
      
      // Добавляем в очередь синхронизации
      this.addToSyncQueue(userId, 'progress', progressData);
      
      return {
        success: false,
        error: 'Произошла ошибка при обновлении прогресса пользователя. Данные сохранены локально и будут синхронизированы позже.',
        data: progressData
      };
    }
  },
  
  /**
   * Инициализация прогресса пользователя
   */
  async initUserProgress(userId: string): Promise<UserProgress> {
    // Получение текущей даты начала спринта
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Использование текущего календарного дня
    const calendarDay = today.getDate();
    const currentDay = Math.min(Math.max(calendarDay, 1), 28); // Между 1 и 28
    
    // Создание нового прогресса
    const newProgress: UserProgress = {
      startDate,
      currentDay,
      days: {},
      weekReflections: {}
    };
    
    try {
      // Сначала пробуем сохранить в Supabase
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          start_date: startDate.toISOString(),
          current_day: currentDay,
          days: {},
          week_reflections: {}
        });
      
      if (error) {
        console.error('Ошибка при инициализации прогресса в Supabase:', error);
        // Если не удалось сохранить в Supabase, сохраняем локально
        localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(newProgress));
      }
    } catch (error) {
      console.error('Ошибка при инициализации прогресса:', error);
      // В случае ошибки сохраняем локально
      localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(newProgress));
    }
    
    return newProgress;
  },
  
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
      console.error('Ошибка при получении пользователей из Supabase:', error);
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
            console.error('Ошибка при парсинге данных пользователя:', error);
          }
        }
      }
    }
    
    return users;
  }
};
