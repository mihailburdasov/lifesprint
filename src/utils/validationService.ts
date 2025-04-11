import { logService } from './logService';

/**
 * Сервис для валидации данных
 */
export const validationService = {
  /**
   * Валидация email
   */
  validateEmail: (email: string): { valid: boolean; message?: string } => {
    if (!email || email.trim() === '') {
      return { valid: false, message: 'Email не может быть пустым' };
    }
    
    // Регулярное выражение для проверки email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Некорректный формат email' };
    }
    
    return { valid: true };
  },
  
  /**
   * Валидация пароля
   */
  validatePassword: (password: string): { valid: boolean; message?: string } => {
    if (!password || password.trim() === '') {
      return { valid: false, message: 'Пароль не может быть пустым' };
    }
    
    if (password.length < 8) {
      return { valid: false, message: 'Пароль должен содержать не менее 8 символов' };
    }
    
    // Проверка на наличие хотя бы одной заглавной буквы
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Пароль должен содержать хотя бы одну заглавную букву' };
    }
    
    // Проверка на наличие хотя бы одной цифры
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Пароль должен содержать хотя бы одну цифру' };
    }
    
    // Проверка на наличие хотя бы одного специального символа
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Пароль должен содержать хотя бы один специальный символ' };
    }
    
    return { valid: true };
  },
  
  /**
   * Валидация имени пользователя
   */
  validateName: (name: string): { valid: boolean; message?: string } => {
    if (!name || name.trim() === '') {
      return { valid: false, message: 'Имя не может быть пустым' };
    }
    
    if (name.length < 2) {
      return { valid: false, message: 'Имя должно содержать не менее 2 символов' };
    }
    
    if (name.length > 50) {
      return { valid: false, message: 'Имя должно содержать не более 50 символов' };
    }
    
    return { valid: true };
  },
  
  /**
   * Валидация никнейма в Telegram
   */
  validateTelegramNickname: (nickname?: string): { valid: boolean; message?: string } => {
    // Если никнейм не указан, считаем его валидным
    if (!nickname || nickname.trim() === '') {
      return { valid: true };
    }
    
    // Проверка на формат никнейма в Telegram (без @)
    const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
    if (!telegramRegex.test(nickname)) {
      return { 
        valid: false, 
        message: 'Никнейм должен содержать от 5 до 32 символов и может включать только буквы, цифры и знак подчеркивания' 
      };
    }
    
    return { valid: true };
  },
  
  /**
   * Валидация формы регистрации
   */
  validateRegistrationForm: (
    name: string, 
    email: string, 
    password: string, 
    confirmPassword: string,
    telegramNickname?: string
  ): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    // Валидация имени
    const nameValidation = validationService.validateName(name);
    if (!nameValidation.valid) {
      errors.name = nameValidation.message || 'Некорректное имя';
    }
    
    // Валидация email
    const emailValidation = validationService.validateEmail(email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.message || 'Некорректный email';
    }
    
    // Валидация пароля
    const passwordValidation = validationService.validatePassword(password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message || 'Некорректный пароль';
    }
    
    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }
    
    // Валидация никнейма в Telegram
    if (telegramNickname) {
      const telegramValidation = validationService.validateTelegramNickname(telegramNickname);
      if (!telegramValidation.valid) {
        errors.telegramNickname = telegramValidation.message || 'Некорректный никнейм';
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  /**
   * Валидация формы входа
   */
  validateLoginForm: (
    email: string, 
    password: string
  ): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    // Валидация email
    const emailValidation = validationService.validateEmail(email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.message || 'Некорректный email';
    }
    
    // Проверка наличия пароля
    if (!password || password.trim() === '') {
      errors.password = 'Пароль не может быть пустым';
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  /**
   * Санитизация пользовательского ввода
   */
  sanitizeInput: (input: string): string => {
    if (!input) return '';
    
    try {
      // Удаление HTML-тегов
      const withoutTags = input.replace(/<[^>]*>/g, '');
      
      // Экранирование специальных символов
      const escaped = withoutTags
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      return escaped;
    } catch (error) {
      logService.error('Ошибка при санитизации ввода', error);
      return '';
    }
  },
  
  /**
   * Проверка на наличие потенциально опасного контента
   */
  hasDangerousContent: (input: string): boolean => {
    if (!input) return false;
    
    // Проверка на наличие HTML-тегов
    const hasHtmlTags = /<[^>]*>/g.test(input);
    
    // Проверка на наличие JavaScript-кода
    const hasJsCode = /javascript:|on\w+=/gi.test(input);
    
    // Проверка на наличие URL с потенциально опасными протоколами
    const hasDangerousUrl = /data:|javascript:|file:|vbscript:/gi.test(input);
    
    return hasHtmlTags || hasJsCode || hasDangerousUrl;
  }
};
