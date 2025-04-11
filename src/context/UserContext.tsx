import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import { supabase } from '../utils/supabaseClient';
import { migrateLocalDataToSupabase, clearLocalUserData } from '../utils/migrationScript';

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

  // Проверка наличия пользователя при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Сначала проверяем сессию Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          // Пользователь авторизован в Supabase
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Ошибка при получении данных пользователя:', userError);
            setUser(null);
          } else if (userData.user) {
            // Получаем дополнительные данные пользователя из метаданных
            const { id, email } = userData.user;
            const name = userData.user.user_metadata?.name || email?.split('@')[0] || 'Пользователь';
            const telegramNickname = userData.user.user_metadata?.telegram_nickname;
            
            // Проверяем, подтвержден ли email
            const isVerified = !!userData.user.email_confirmed_at;
            setEmailVerified(isVerified);
            
            // Проверяем, есть ли у пользователя локальные данные, которые нужно мигрировать
            if (email) {
              const localUserData = apiService.findLocalUserByEmail(email);
              if (localUserData && localUserData.id !== id) {
                // Мигрируем данные прогресса из localStorage в Supabase
                await apiService.migrateUserProgressToSupabase(localUserData.id, id);
              }
            }
            
            // Обрабатываем очередь синхронизации
            await apiService.processSyncQueue(id);
            
            setUser({
              id,
              name,
              email: email || '',
              telegramNickname
            });
          }
        } else {
          // Если нет сессии Supabase, проверяем localStorage (для обратной совместимости)
          const storedUserId = localStorage.getItem('lifesprint_current_user_id');
          
          if (storedUserId) {
            const userJson = localStorage.getItem(`lifesprint_user_${storedUserId}`);
            
            if (userJson) {
              try {
                const userData = JSON.parse(userJson);
                
                if (userData && userData.id && userData.name && userData.email) {
                  setUser(userData);
                } else {
                  console.error('Данные пользователя неполные или некорректные');
                  localStorage.removeItem('lifesprint_current_user_id');
                }
              } catch (error) {
                console.error('Ошибка при парсинге данных пользователя:', error);
                localStorage.removeItem('lifesprint_current_user_id');
              }
            } else {
              console.error('Данные пользователя не найдены');
              localStorage.removeItem('lifesprint_current_user_id');
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке наличия пользователя:', error);
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
            
            setUser({
              id: authUser.id,
              name,
              email: authUser.email || '',
              telegramNickname
            });
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
      // Используем apiService для регистрации пользователя
      const response = await apiService.register(
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
        return true;
      } else {
        setError('Не удалось создать пользователя. Пожалуйста, попробуйте снова.');
        return false;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Ошибка при регистрации: ${errorMessage}`);
      console.error('Ошибка регистрации:', e);
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
      // Используем apiService для входа пользователя
      const response = await apiService.login(data.email, data.password);
      
      if (!response.success) {
        setError(response.error || 'Неверный email или пароль.');
        return false;
      }
      
      if (response.data) {
        // Сохраняем ID пользователя в localStorage для обратной совместимости
        localStorage.setItem('lifesprint_current_user_id', response.data.id);
        setUser(response.data);
        return true;
      } else {
        setError('Не удалось войти. Пожалуйста, попробуйте снова.');
        return false;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Ошибка при входе: ${errorMessage}`);
      console.error('Ошибка входа:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход пользователя
  const logout = async (): Promise<void> => {
    try {
      // Выход из Supabase
      await supabase.auth.signOut();
      
      // Очищаем localStorage (для обратной совместимости)
      localStorage.removeItem('lifesprint_current_user_id');
      
      // Очищаем состояние пользователя
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // Даже если произошла ошибка, очищаем состояние пользователя
      localStorage.removeItem('lifesprint_current_user_id');
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
      // Выход из всех сессий Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Ошибка при выходе со всех устройств:', error);
        throw error;
      }
      
      // Очищаем localStorage (для обратной совместимости)
      localStorage.removeItem('lifesprint_current_user_id');
      
      // Очищаем состояние пользователя
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе со всех устройств:', error);
      // Даже если произошла ошибка, очищаем состояние пользователя
      localStorage.removeItem('lifesprint_current_user_id');
      setUser(null);
    }
  };
  
  // Проверка подтверждения email
  const checkEmailVerification = async (userId: string): Promise<boolean> => {
    try {
      const { data: userData, error } = await supabase.auth.getUser();
      
      if (error || !userData.user) {
        setEmailVerified(false);
        return false;
      }
      
      // Проверяем, подтвержден ли email
      const isVerified = !!userData.user.email_confirmed_at;
      setEmailVerified(isVerified);
      
      return isVerified;
    } catch (error) {
      console.error('Ошибка при проверке подтверждения email:', error);
      setEmailVerified(false);
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
        clearLocalData
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
