import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { migrateLocalDataToSupabase, clearLocalUserData } from '../utils/migrationScript';
import { logService } from '../utils/logService';
import { authService } from '../utils/authService';
import { userService } from '../utils/userService';
import { syncService } from '../utils/syncService';
import { encryptionService } from '../utils/encryptionService';

// Определение типов для пользователя
export interface User {
  id: string;
  name: string;
  email: string;
  telegramNickname?: string;
}

// Тип для статуса миграции
export interface MigrationStatus {
  inProgress: boolean;
  message: string | null;
  success: boolean | null;
  migratedUsers: number;
  totalUsers: number;
}

// Данные для регистрации
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  telegramNickname?: string;
}

// Данные для входа
export interface LoginData {
  email: string;
  password: string;
}

// Тип контекста пользователя
interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  emailVerified: boolean;
  register: (data: RegisterData) => Promise<boolean>;
  login: (data: LoginData) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutFromAllDevices: () => Promise<void>;
  checkEmailVerification: (userId: string) => Promise<boolean>;
  migrationStatus: MigrationStatus;
  migrateToSupabase: () => Promise<boolean>;
  clearLocalData: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  syncStatus: {
    lastSync: number;
    inProgress: boolean;
    error: string | null;
    pendingOperations: number;
  };
  syncData: () => Promise<boolean>;
}

// Создание контекста
const UserContext = createContext<UserContextType | undefined>(undefined);

// Провайдер контекста
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    inProgress: false,
    message: null,
    success: null,
    migratedUsers: 0,
    totalUsers: 0
  });
  const [syncStatus, setSyncStatus] = useState({
    lastSync: 0,
    inProgress: false,
    error: null,
    pendingOperations: 0
  });

  // Обновление статуса синхронизации
  const updateSyncStatus = (userId: string) => {
    if (userId) {
      const status = syncService.getSyncStatus(userId);
      setSyncStatus(status);
    }
  };

  // Проверка наличия пользователя при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Сначала проверяем сессию Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          // Пользователь авторизован в Supabase
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser) {
            // Проверяем, подтвержден ли email
            const isVerified = await authService.checkEmailVerification(currentUser.id);
            setEmailVerified(isVerified);
            
            // Проверяем, есть ли у пользователя локальные данные, которые нужно мигрировать
            if (currentUser.email) {
              const localUser = await authService.findLocalUserByEmail(currentUser.email);
              if (localUser && localUser.id !== currentUser.id) {
                // Мигрируем данные прогресса из localStorage в Supabase
                await migrateLocalDataToSupabase(
                  (status) => setMigrationStatus(status)
                );
              }
            }
            
            // Обновляем статус синхронизации
            updateSyncStatus(currentUser.id);
            
            // Запускаем периодическую синхронизацию
            syncService.startPeriodicSync(currentUser.id);
            
            setUser(currentUser);
          }
        } else {
          // Если нет сессии Supabase, проверяем localStorage (для обратной совместимости)
          const storedUserId = localStorage.getItem('lifesprint_current_user_id');
          
          if (storedUserId) {
            const userData = await userService.getUserById(storedUserId);
            
            if (userData) {
              setUser(userData);
              
              // Обновляем статус синхронизации
              updateSyncStatus(storedUserId);
              
              // Запускаем периодическую синхронизацию
              syncService.startPeriodicSync(storedUserId);
            } else {
              logService.warn('Данные пользователя не найдены');
              localStorage.removeItem('lifesprint_current_user_id');
            }
          }
        }
      } catch (error) {
        logService.error('Ошибка при проверке наличия пользователя', error);
        localStorage.removeItem('lifesprint_current_user_id');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Подписываемся на изменения состояния аутентификации
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { user: authUser } = session;
          
          if (authUser) {
            // Получаем дополнительные данные пользователя из метаданных
            const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Пользователь';
            const telegramNickname = authUser.user_metadata?.telegram_nickname;
            
            const newUser = {
              id: authUser.id,
              name,
              email: authUser.email || '',
              telegramNickname
            };
            
            setUser(newUser);
            
            // Обновляем статус синхронизации
            updateSyncStatus(authUser.id);
            
            // Запускаем периодическую синхронизацию
            syncService.startPeriodicSync(authUser.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    // Отписываемся при размонтировании компонента
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Регистрация пользователя
  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Используем authService для регистрации пользователя
      const response = await authService.register(
        data.name,
        data.email,
        data.password,
        data.telegramNickname
      );
      
      if (!response.success) {
        setError(response.error || 'Ошибка при регистрации. Пожалуйста, попробуйте снова.');
        return false;
      }
      
      if (response.data) {
        setUser(response.data);
        
        // Если поддерживается шифрование, генерируем ключ шифрования
        if (encryptionService.isSupported()) {
          try {
            await encryptionService.generateKey(data.password);
          } catch (encryptError) {
            logService.error('Ошибка при генерации ключа шифрования', encryptError);
          }
        }
        
        // Обновляем статус синхронизации
        updateSyncStatus(response.data.id);
        
        // Запускаем периодическую синхронизацию
        syncService.startPeriodicSync(response.data.id);
        
        return true;
      } else {
        setError('Не удалось создать пользователя. Пожалуйста, попробуйте снова.');
        return false;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Ошибка при регистрации: ${errorMessage}`);
      logService.error('Ошибка регистрации', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Вход пользователя
  const login = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Используем authService для входа пользователя
      const response = await authService.login(data.email, data.password);
      
      if (!response.success) {
        setError(response.error || 'Неверный email или пароль.');
        return false;
      }
      
      if (response.data) {
        setUser(response.data);
        
        // Если поддерживается шифрование, получаем ключ шифрования
        if (encryptionService.isSupported()) {
          try {
            await encryptionService.getKey(data.password);
          } catch (encryptError) {
            logService.error('Ошибка при получении ключа шифрования', encryptError);
          }
        }
        
        // Обновляем статус синхронизации
        updateSyncStatus(response.data.id);
        
        // Запускаем периодическую синхронизацию
        syncService.startPeriodicSync(response.data.id);
        
        return true;
      } else {
        setError('Не удалось войти. Пожалуйста, попробуйте снова.');
        return false;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Ошибка при входе: ${errorMessage}`);
      logService.error('Ошибка входа', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход пользователя
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      logService.error('Ошибка при выходе', error);
      setUser(null);
    }
  };
  
  // Миграция данных из localStorage в Supabase
  const migrateToSupabase = async (): Promise<boolean> => {
    setMigrationStatus({
      ...migrationStatus,
      inProgress: true,
      message: 'Начинаем миграцию данных...',
      success: null
    });
    
    try {
      // Передаем функцию обновления статуса миграции
      const result = await migrateLocalDataToSupabase(
        (status) => setMigrationStatus(status)
      );
      
      setMigrationStatus({
        inProgress: false,
        message: result.message,
        success: result.success,
        migratedUsers: result.migratedUsers,
        totalUsers: result.totalUsers
      });
      
      return result.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setMigrationStatus({
        inProgress: false,
        message: `Ошибка миграции: ${errorMessage}`,
        success: false,
        migratedUsers: 0,
        totalUsers: 0
      });
      
      return false;
    }
  };
  
  // Очистка локальных данных
  const clearLocalData = (): void => {
    clearLocalUserData();
  };
  
  // Выход со всех устройств
  const logoutFromAllDevices = async (): Promise<void> => {
    try {
      await authService.logoutFromAllDevices();
      setUser(null);
    } catch (error) {
      logService.error('Ошибка при выходе со всех устройств', error);
      setUser(null);
    }
  };
  
  // Проверка подтверждения email
  const checkEmailVerification = async (userId: string): Promise<boolean> => {
    try {
      const isVerified = await authService.checkEmailVerification(userId);
      setEmailVerified(isVerified);
      return isVerified;
    } catch (error) {
      logService.error('Ошибка при проверке подтверждения email', error);
      setEmailVerified(false);
      return false;
    }
  };
  
  // Обновление данных пользователя
  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) {
      setError('Пользователь не авторизован');
      return false;
    }
    
    try {
      const response = await userService.updateUser(user.id, userData);
      
      if (!response.success) {
        setError(response.error || 'Ошибка при обновлении данных пользователя');
        return false;
      }
      
      if (response.data) {
        setUser(response.data);
        
        // Добавляем операцию в очередь синхронизации
        syncService.addToSyncQueue(user.id, {
          type: 'user',
          action: 'update',
          data: response.data
        });
        
        // Обновляем статус синхронизации
        updateSyncStatus(user.id);
        
        return true;
      } else {
        setError('Не удалось обновить данные пользователя');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Ошибка при обновлении данных пользователя: ${errorMessage}`);
      logService.error('Ошибка при обновлении данных пользователя', error);
      return false;
    }
  };
  
  // Сброс пароля
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await authService.resetPassword(email);
      
      if (!response.success) {
        setError(response.error || 'Ошибка при сбросе пароля');
        return false;
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Ошибка при сбросе пароля: ${errorMessage}`);
      logService.error('Ошибка при сбросе пароля', error);
      return false;
    }
  };
  
  // Обновление пароля
  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const response = await authService.updatePassword(newPassword);
      
      if (!response.success) {
        setError(response.error || 'Ошибка при обновлении пароля');
        return false;
      }
      
      // Если поддерживается шифрование, генерируем новый ключ шифрования
      if (encryptionService.isSupported()) {
        try {
          await encryptionService.generateKey(newPassword);
        } catch (encryptError) {
          logService.error('Ошибка при генерации ключа шифрования', encryptError);
        }
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Ошибка при обновлении пароля: ${errorMessage}`);
      logService.error('Ошибка при обновлении пароля', error);
      return false;
    }
  };
  
  // Синхронизация данных
  const syncData = async (): Promise<boolean> => {
    if (!user) {
      setError('Пользователь не авторизован');
      return false;
    }
    
    try {
      const response = await syncService.syncData(user.id);
      
      // Обновляем статус синхронизации
      updateSyncStatus(user.id);
      
      if (!response.success) {
        setError(response.error || 'Ошибка при синхронизации данных');
        return false;
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Ошибка при синхронизации данных: ${errorMessage}`);
      logService.error('Ошибка при синхронизации данных', error);
      
      // Обновляем статус синхронизации
      updateSyncStatus(user.id);
      
      return false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        emailVerified,
        register,
        login,
        logout,
        logoutFromAllDevices,
        checkEmailVerification,
        migrationStatus,
        migrateToSupabase,
        clearLocalData,
        updateUser,
        resetPassword,
        updatePassword,
        syncStatus,
        syncData
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Хук для использования контекста пользователя
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
