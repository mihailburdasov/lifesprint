import * as Sentry from '@sentry/react';

/**
 * Уровни логирования
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Текущий уровень логирования (по умолчанию INFO)
let currentLogLevel = LogLevel.INFO;

/**
 * Сервис для централизованного логирования
 */
export const logService = {
  /**
   * Получение текущего уровня логирования
   */
  getLogLevel: (): LogLevel => {
    return currentLogLevel;
  },
  
  /**
   * Установка уровня логирования
   */
  setLogLevel: (level: LogLevel): void => {
    currentLogLevel = level;
  },
  
  /**
   * Логирование информационных сообщений
   */
  info: (message: string, data?: any): void => {
    if (currentLogLevel <= LogLevel.INFO) {
      const timestamp = new Date(Date.now()).toISOString().split('T')[1].split('.')[0];
      console.info(`[${timestamp}] [INFO] ${message}`, data !== undefined ? data : '');
      
      // В продакшене можно отправлять в Sentry или другую систему
      if (process.env.NODE_ENV === 'production') {
        Sentry.addBreadcrumb({
          category: 'info',
          message,
          data,
          level: 'info'
        });
      }
    }
  },
  
  /**
   * Логирование предупреждений
   */
  warn: (message: string, data?: any): void => {
    if (currentLogLevel <= LogLevel.WARN) {
      const timestamp = new Date(Date.now()).toISOString().split('T')[1].split('.')[0];
      console.warn(`[${timestamp}] [WARN] ${message}`, data !== undefined ? data : '');
      
      if (process.env.NODE_ENV === 'production') {
        Sentry.addBreadcrumb({
          category: 'warning',
          message,
          data,
          level: 'warning'
        });
      }
    }
  },
  
  /**
   * Логирование ошибок
   */
  error: (message: string, error?: any): void => {
    if (currentLogLevel <= LogLevel.ERROR) {
      const timestamp = new Date(Date.now()).toISOString().split('T')[1].split('.')[0];
      console.error(`[${timestamp}] [ERROR] ${message}`, error !== undefined ? error : '');
      
      if (process.env.NODE_ENV === 'production') {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            extra: { message }
          });
        } else {
          Sentry.captureMessage(message, {
            level: 'error',
            extra: { error }
          });
        }
      }
    }
  },
  
  /**
   * Логирование отладочной информации (только в режиме разработки)
   */
  debug: (message: string, data?: any): void => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      const timestamp = new Date(Date.now()).toISOString().split('T')[1].split('.')[0];
      console.debug(`[${timestamp}] [DEBUG] ${message}`, data !== undefined ? data : '');
    }
  },
  
  /**
   * Логирование с произвольным уровнем
   */
  log: (level: LogLevel, message: string, data?: any): void => {
    switch (level) {
      case LogLevel.INFO:
        logService.info(message, data);
        break;
      case LogLevel.WARN:
        logService.warn(message, data);
        break;
      case LogLevel.ERROR:
        logService.error(message, data);
        break;
      case LogLevel.DEBUG:
        logService.debug(message, data);
        break;
      default:
        // Используем приведение типа, чтобы избежать ошибки TypeScript
        const timestamp = new Date(Date.now()).toISOString().split('T')[1].split('.')[0];
        console.log(`[${timestamp}] [${LogLevel[level]}] ${message}`, data !== undefined ? data : '');
    }
  },
  
  /**
   * Группировка логов
   */
  group: (name: string, fn: () => void): void => {
    console.group(name);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  },
  
  /**
   * Измерение времени выполнения
   */
  time: (name: string, fn: () => any): any => {
    console.time(name);
    try {
      return fn();
    } finally {
      console.timeEnd(name);
    }
  }
};
