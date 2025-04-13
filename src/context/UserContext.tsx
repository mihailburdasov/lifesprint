import React, { createContext, useContext, useState, useEffect } from 'react';

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
  logoutFromAllDevices: () => void;
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
    const storedUser = localStorage.getItem('lifesprint_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Ошибка при парсинге данных пользователя:', e);
        localStorage.removeItem('lifesprint_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Регистрация пользователя
  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // В реальном приложении здесь был бы запрос к API для регистрации
      // Генерируем уникальный ID для пользователя (в реальном приложении это делал бы сервер)
      const newUser: User = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        telegramNickname: data.telegramNickname
      };
      
      // Сохраняем пользователя в localStorage (в реальном приложении использовали бы токены)
      localStorage.setItem('lifesprint_user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (e) {
      setError('Ошибка при регистрации. Пожалуйста, попробуйте снова.');
      console.error('Ошибка регистрации:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Вход пользователя
  const login = async (data: LoginData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // В реальном приложении здесь был бы запрос к API для входа
      // Для демонстрации просто проверяем, что email содержит @ и пароль не пустой
      if (!data.email.includes('@') || !data.password) {
        throw new Error('Неверные учетные данные');
      }
      
      // Создаем тестового пользователя (в реальном приложении получали бы от сервера)
      const loggedInUser: User = {
        id: '1',
        name: 'Тестовый пользователь',
        email: data.email
      };
      
      // Сохраняем пользователя в localStorage
      localStorage.setItem('lifesprint_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } catch (e) {
      setError('Неверный email или пароль.');
      console.error('Ошибка входа:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Выход пользователя
  const logout = (): void => {
    localStorage.removeItem('lifesprint_user');
    setUser(null);
  };

  // Выход со всех устройств
  const logoutFromAllDevices = (): void => {
    // В реальном приложении здесь был бы запрос к API для инвалидации всех токенов
    localStorage.removeItem('lifesprint_user');
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
        logout,
        logoutFromAllDevices
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
