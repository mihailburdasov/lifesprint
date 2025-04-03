import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../utils/apiService';

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
  register: (data: RegisterData) => Promise<boolean>;
  login: (data: LoginData) => Promise<boolean>;
  logout: () => void;
}

// Создание контекста
const UserContext = createContext<UserContextType | undefined>(undefined);

// Провайдер контекста
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка наличия пользователя при загрузке
  useEffect(() => {
    // Проверяем, есть ли сохраненный ID пользователя в localStorage
    const storedUserId = localStorage.getItem('lifesprint_current_user_id');
    
    if (storedUserId) {
      // Получаем пользователя напрямую из localStorage вместо вызова API
      const userJson = localStorage.getItem(`lifesprint_user_${storedUserId}`);
      
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          setUser(userData);
        } catch (error) {
          console.error('Ошибка при парсинге данных пользователя:', error);
          localStorage.removeItem('lifesprint_current_user_id');
        }
      } else {
        // Если данные пользователя не найдены, удаляем ID из localStorage
        localStorage.removeItem('lifesprint_current_user_id');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Регистрация пользователя
  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Вызов API для регистрации пользователя
      const response = await apiService.register(
        data.name,
        data.email,
        data.password,
        data.telegramNickname
      );
      
      if (response.success && response.data) {
        // Сохраняем ID пользователя в localStorage
        localStorage.setItem('lifesprint_current_user_id', response.data.id);
        setUser(response.data);
        return true;
      } else {
        setError(response.error || 'Ошибка при регистрации. Пожалуйста, попробуйте снова.');
        return false;
      }
    } catch (e) {
      setError('Ошибка при регистрации. Пожалуйста, попробуйте снова.');
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
      // Вызов API для входа пользователя
      const response = await apiService.login(data.email, data.password);
      
      if (response.success && response.data) {
        // Сохраняем ID пользователя в localStorage
        localStorage.setItem('lifesprint_current_user_id', response.data.id);
        setUser(response.data);
        return true;
      } else {
        setError(response.error || 'Неверный email или пароль.');
        return false;
      }
    } catch (e) {
      setError('Неверный email или пароль.');
      console.error('Ошибка входа:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход пользователя
  const logout = (): void => {
    localStorage.removeItem('lifesprint_current_user_id');
    setUser(null);
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
        logout
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
