/**
 * Локальный сервис для работы с данными пользователя
 * Все данные хранятся в localStorage без имитации сетевых запросов
 */

import { User } from '../context/UserContext';
import { UserProgress } from '../context/ProgressContext';

// Префиксы для ключей в localStorage
const USER_PREFIX = 'lifesprint_user_';
const PROGRESS_PREFIX = 'lifesprint_progress_';

// Интерфейс для ответа API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Сервис для работы с локальными данными
 */
export const apiService = {
  /**
   * Регистрация пользователя
   */
  register(name: string, email: string, password: string, telegramNickname?: string): ApiResponse<User> {
    try {
      // Проверка, существует ли пользователь с таким email
      const existingUsers = this.getAllUsers();
      const userExists = existingUsers.some(user => user.email === email);
      
      if (userExists) {
        return {
          success: false,
          error: 'Пользователь с таким email уже существует'
        };
      }
      
      // Создание нового пользователя
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        telegramNickname
      };
      
      // Сохранение пользователя и пароля
      const userData = {
        ...newUser,
        password
      };
      
      localStorage.setItem(`${USER_PREFIX}${newUser.id}`, JSON.stringify(userData));
      
      // Создание пустого прогресса для пользователя
      this.initUserProgress(newUser.id);
      
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
  login(email: string, password: string): ApiResponse<User> {
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
                // Возвращаем пользователя без пароля
                const { password: _, ...userWithoutPassword } = userData;
                return {
                  success: true,
                  data: userWithoutPassword as User
                };
              }
              // Если email совпадает, но пароль нет
              if (userData.email === email) {
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
      console.error('Ошибка при входе:', error);
      return {
        success: false,
        error: 'Произошла ошибка при входе'
      };
    }
  },
  
  /**
   * Обновление данных пользователя
   */
  updateUser(userId: string, userData: Partial<User>): ApiResponse<User> {
    try {
      // Получение текущих данных пользователя
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
  getUserProgress(userId: string): ApiResponse<UserProgress> {
    try {
      // Получение прогресса пользователя
      const progressJson = localStorage.getItem(`${PROGRESS_PREFIX}${userId}`);
      
      if (!progressJson) {
        // Если прогресс не найден, инициализируем его
        const newProgress = this.initUserProgress(userId);
        
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
  updateUserProgress(userId: string, progressData: UserProgress): ApiResponse<UserProgress> {
    try {
      // Сохранение прогресса пользователя
      localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(progressData));
      
      return {
        success: true,
        data: progressData
      };
    } catch (error) {
      console.error('Ошибка при обновлении прогресса пользователя:', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении прогресса пользователя'
      };
    }
  },
  
  /**
   * Инициализация прогресса пользователя
   */
  initUserProgress(userId: string): UserProgress {
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
    
    // Сохранение прогресса
    localStorage.setItem(`${PROGRESS_PREFIX}${userId}`, JSON.stringify(newProgress));
    
    return newProgress;
  },
  
  /**
   * Получение всех пользователей (для демонстрации)
   */
  getAllUsers(): User[] {
    const users: User[] = [];
    
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
