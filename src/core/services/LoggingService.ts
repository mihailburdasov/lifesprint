/**
 * Simple logging service with different log levels
 */

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Log contexts
export enum LogContext {
  ALL = 'all',
  DAY_CONTENT = 'day_content',
  SYNC = 'sync',
  AUTH = 'auth',
  SYSTEM = 'system',
  DASHBOARD = 'dashboard'
}

// Get log level from environment variables or use defaults
const getLogLevelFromEnv = (): LogLevel => {
  const envLogLevel = process.env.REACT_APP_LOG_LEVEL;
  
  if (envLogLevel) {
    switch (envLogLevel.toUpperCase()) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: break;
    }
  }
  
  // Default log level for different environments
  return process.env.NODE_ENV === 'production' 
    ? LogLevel.ERROR  // Only show errors in production
    : LogLevel.INFO;  // Show info, warnings and errors in development
};

const DEFAULT_LOG_LEVEL = getLogLevelFromEnv();

// Default log context filter
const DEFAULT_LOG_CONTEXT = LogContext.ALL;

/**
 * Logging service class
 */
export class LoggingService {
  private logLevel: LogLevel;
  private logContext: LogContext;

  constructor(logLevel: LogLevel = DEFAULT_LOG_LEVEL, logContext: LogContext = DEFAULT_LOG_CONTEXT) {
    this.logLevel = logLevel;
    this.logContext = logContext;
  }

  /**
   * Set the current log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Set the current log context filter
   */
  setLogContext(context: LogContext): void {
    this.logContext = context;
  }

  /**
   * Check if the given context should be logged
   */
  private shouldLogContext(context: LogContext): boolean {
    return this.logContext === LogContext.ALL || this.logContext === context;
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(`❌ ERROR: ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(`⚠️ WARNING: ${message}`, ...args);
    }
  }

  /**
   * Log an info message with context
   */
  info(message: string, context: LogContext = LogContext.SYSTEM, ...args: any[]): void {
    if (this.logLevel >= LogLevel.INFO && this.shouldLogContext(context)) {
      console.log(`ℹ️ INFO [${context}]: ${message}`, ...args);
    }
  }

  /**
   * Log a debug message with context
   */
  debug(message: string, context: LogContext = LogContext.SYSTEM, ...args: any[]): void {
    if (this.logLevel >= LogLevel.DEBUG && this.shouldLogContext(context)) {
      console.log(`🔍 DEBUG [${context}]: ${message}`, ...args);
    }
  }

  /**
   * Log a success message with context (always shown at INFO level)
   */
  success(message: string, context: LogContext = LogContext.SYSTEM, ...args: any[]): void {
    if (this.logLevel >= LogLevel.INFO && this.shouldLogContext(context)) {
      console.log(`✅ SUCCESS [${context}]: ${message}`, ...args);
    }
  }

  /**
   * Log a sync message with context (shown at DEBUG level)
   */
  sync(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.DEBUG && this.shouldLogContext(LogContext.SYNC)) {
      console.log(`🔄 SYNC [${LogContext.SYNC}]: ${message}`, ...args);
    }
  }

  /**
   * Log a day content message (shown at INFO level)
   */
  dayContent(message: string, level: LogLevel = LogLevel.INFO, ...args: any[]): void {
    if (this.logLevel >= level && this.shouldLogContext(LogContext.DAY_CONTENT)) {
      const prefix = level === LogLevel.ERROR ? '❌ ERROR' : 
                    level === LogLevel.WARN ? '⚠️ WARNING' : 
                    level === LogLevel.INFO ? 'ℹ️ INFO' : '🔍 DEBUG';
      console.log(`${prefix} [${LogContext.DAY_CONTENT}]: ${message}`, ...args);
    }
  }
  
  /**
   * Log a dashboard message (shown at DEBUG level by default)
   */
  dashboard(message: string, level: LogLevel = LogLevel.DEBUG, ...args: any[]): void {
    if (this.logLevel >= level && this.shouldLogContext(LogContext.DASHBOARD)) {
      const prefix = level === LogLevel.ERROR ? '❌ ERROR' : 
                    level === LogLevel.WARN ? '⚠️ WARNING' : 
                    level === LogLevel.INFO ? 'ℹ️ INFO' : '🔍 DEBUG';
      console.log(`${prefix} [${LogContext.DASHBOARD}]: ${message}`, ...args);
    }
  }
}

// Export a singleton instance
export const logger = new LoggingService();

// Allow changing log level and context via console for debugging
(window as any).setLogLevel = (level: LogLevel) => {
  logger.setLogLevel(level);
  console.log(`Log level set to ${LogLevel[level]}`);
};

(window as any).setLogContext = (context: LogContext) => {
  logger.setLogContext(context);
  console.log(`Log context filter set to ${context}`);
};

// Set default context to DAY_CONTENT to only show day content logs
logger.setLogContext(LogContext.DAY_CONTENT);
