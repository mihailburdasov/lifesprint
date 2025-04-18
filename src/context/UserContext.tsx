import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../features/auth/services/AuthService';
import { progressService } from '../features/day/services/ProgressService';

// Определение типов для пользователя
export interface User {
  id: string;
  name: string;
  email: string;
  telegramNickname?: string;
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
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  registrationCompleted: boolean;
  registrationEmail: string;
  completeRegistration: () => void;
}

// Создание контекста
const UserContext = createContext<UserContextType | undefined>(undefined);

// Провайдер контекста
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationCompleted, setRegistrationCompleted] = useState<boolean>(false);
  const [registrationEmail, setRegistrationEmail] = useState<string>('');

  // Проверка наличия пользователя при загрузке
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const authUser = await AuthService.getCurrentUser();
        if (authUser) {
          setUser({
            id: authUser.id,
            name: authUser.name || '',
            email: authUser.email,
            telegramNickname: authUser.telegramNickname,
          });
        }
      } catch (e) {
        console.error('Ошибка при загрузке пользователя:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Регистрация пользователя
  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authUser = await AuthService.signUp(
        data.email,
        data.password,
        data.name,
        data.telegramNickname
      );
      
      if (authUser) {
        // Вместо установки пользователя, отмечаем, что регистрация завершена
        // и сохраняем email для возможной повторной отправки письма
        setRegistrationCompleted(true);
        setRegistrationEmail(data.email);
        
        // Не устанавливаем пользователя, так как он должен подтвердить email
        // setUser({
        //   id: authUser.id,
        //   name: authUser.name || '',
        //   email: authUser.email,
        //   telegramNickname: authUser.telegramNickname,
        // });
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка при регистрации. Пожалуйста, попробуйте снова.');
      console.error('Ошибка регистрации:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Сброс состояния регистрации
  const completeRegistration = () => {
    setRegistrationCompleted(false);
    setRegistrationEmail('');
  };

  // Вход пользователя
  const login = async (data: LoginData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authUser = await AuthService.signIn(data.email, data.password);
      
      if (authUser) {
        setUser({
          id: authUser.id,
          name: authUser.name || '',
          email: authUser.email,
          telegramNickname: authUser.telegramNickname,
        });
        
        // Загрузка данных пользователя после успешного входа
        if (authUser.id) {
          let retryCount = 0;
          const maxRetries = 3;
          const syncData = async () => {
            try {
              await progressService.fetchUserData(authUser.id);
              // Если синхронизация успешна, сбрасываем ошибку
              if (error && error.includes('синхронизации')) {
                setError(null);
              }
            } catch (syncError) {
              console.error(`Ошибка синхронизации данных при входе (попытка ${retryCount + 1}/${maxRetries}):`, syncError);
              
              if (retryCount < maxRetries - 1) {
                // Повторяем попытку с экспоненциальной задержкой
                retryCount++;
                const delay = 1000 * Math.pow(2, retryCount); // 2, 4, 8 секунд
                setTimeout(syncData, delay);
                
                // Уведомляем пользователя о повторной попытке
                setError(`Проблема с синхронизацией данных. Повторная попытка ${retryCount}/${maxRetries - 1}...`);
              } else {
                // Уведомляем пользователя о проблеме с синхронизацией, но не блокируем вход
                setError('Вход выполнен успешно, но возникла проблема с синхронизацией данных. Ваши данные будут синхронизированы позже.');
              }
            }
          };
          
          // Запускаем процесс синхронизации
          syncData();
        }
      }
    } catch (e: any) {
      setError(e.message || 'Неверный email или пароль.');
      console.error('Ошибка входа:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Выход пользователя
  const logout = async (): Promise<void> => {
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (e) {
      console.error('Ошибка выхода:', e);
    }
  };

  // Сброс пароля
  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await AuthService.resetPassword(email);
    } catch (e: any) {
      setError(e.message || 'Ошибка при сбросе пароля. Пожалуйста, попробуйте снова.');
      console.error('Ошибка сброса пароля:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление пароля
  const updatePassword = async (password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await AuthService.updatePassword(password);
    } catch (e: any) {
      setError(e.message || 'Ошибка при обновлении пароля. Пожалуйста, попробуйте снова.');
      console.error('Ошибка обновления пароля:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        register,
        login,
        logout,
        resetPassword,
        updatePassword,
        registrationCompleted,
        registrationEmail,
        completeRegistration
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
