/**
 * Сервис для работы с API
 * В реальном приложении здесь были бы настоящие запросы к серверу
 * Для демонстрации используем localStorage с имитацией задержки сети
 */

import { User } from '../context/UserContext';
import { UserProgress } from '../context/ProgressContext';

// Имитация задержки сети
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
 * Сервис для работы с API
 */
export const apiService = {
  /**
   * Регистрация пользователя
   */
  async register(name: string, email: string, password: string, telegramNickname?: string): Promise<ApiResponse<User>> {
    try {
      // Имитация задержки сети
      await delay(800);
      
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
      
      // Сохранение пользователя
      localStorage.setItem(`${USER_PREFIX}${newUser.id}`, JSON.stringify(newUser));
      
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
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      // Имитация задержки сети
      await delay(800);
      
      // В реальном приложении здесь была бы проверка email и пароля на сервере
      // Для демонстрации просто ищем пользователя по email
      const users = this.getAllUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return {
          success: false,
          error: 'Пользователь с таким email не найден'
        };
      }
      
      // В реальном приложении здесь была бы проверка пароля
      // Для демонстрации просто проверяем, что пароль не пустой
      if (!password) {
        return {
          success: false,
          error: 'Неверный пароль'
        };
      }
      
      return {
        success: true,
        data: user
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
  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      // Имитация задержки сети
      await delay(500);
      
      // Получение текущих данных пользователя
      const userJson = localStorage.getItem(`${USER_PREFIX}${userId}`);
      
      if (!userJson) {
        return {
          success: false,
          error: 'Пользователь не найден'
        };
      }
      
      const currentUser = JSON.parse(userJson) as User;
      
      // Обновление данных пользователя
      const updatedUser = {
        ...currentUser,
        ...userData
      };
      
      // Сохранение обновленных данных
      localStorage.setItem(`${USER_PREFIX}${userId}`, JSON.stringify(updatedUser));
      
      return {
        success: true,
        data: updatedUser
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
      // Имитация задержки сети
      await delay(500);
      
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
  async updateUserProgress(userId: string, progressData: UserProgress): Promise<ApiResponse<UserProgress>> {
    try {
      // Имитация задержки сети
      await delay(300);
      
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
            const user = JSON.parse(userJson) as User;
            users.push(user);
          } catch (error) {
            console.error('Ошибка при парсинге данных пользователя:', error);
          }
        }
      }
    }
    
    return users;
  }
};
