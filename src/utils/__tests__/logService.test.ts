import { logService, LogLevel } from '../logService';

// Мокаем console методы для тестирования
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleDebug = console.debug;

describe('logService', () => {
  // Мок-функции для console методов
  const mockLog = jest.fn();
  const mockInfo = jest.fn();
  const mockWarn = jest.fn();
  const mockError = jest.fn();
  const mockDebug = jest.fn();
  
  // Сохраняем оригинальный уровень логирования
  let originalLogLevel: LogLevel;
  
  beforeAll(() => {
    // Сохраняем оригинальный уровень логирования
    originalLogLevel = logService.getLogLevel();
    
    // Заменяем console методы на мок-функции
    console.log = mockLog;
    console.info = mockInfo;
    console.warn = mockWarn;
    console.error = mockError;
    console.debug = mockDebug;
  });
  
  afterAll(() => {
    // Восстанавливаем оригинальные console методы
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
    
    // Восстанавливаем оригинальный уровень логирования
    logService.setLogLevel(originalLogLevel);
  });
  
  beforeEach(() => {
    // Очищаем мок-функции перед каждым тестом
    mockLog.mockClear();
    mockInfo.mockClear();
    mockWarn.mockClear();
    mockError.mockClear();
    mockDebug.mockClear();
  });
  
  // Тест на установку и получение уровня логирования
  test('setLogLevel and getLogLevel work correctly', () => {
    logService.setLogLevel(LogLevel.DEBUG);
    expect(logService.getLogLevel()).toBe(LogLevel.DEBUG);
    
    logService.setLogLevel(LogLevel.ERROR);
    expect(logService.getLogLevel()).toBe(LogLevel.ERROR);
  });
  
  // Тест на метод debug
  test('debug method logs correctly', () => {
    logService.setLogLevel(LogLevel.DEBUG);
    
    const message = 'Debug message';
    const data = { key: 'value' };
    
    logService.debug(message, data);
    
    expect(mockDebug).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG]'),
      expect.stringContaining(message),
      data
    );
  });
  
  // Тест на метод info
  test('info method logs correctly', () => {
    logService.setLogLevel(LogLevel.INFO);
    
    const message = 'Info message';
    const data = { key: 'value' };
    
    logService.info(message, data);
    
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      expect.stringContaining(message),
      data
    );
  });
  
  // Тест на метод warn
  test('warn method logs correctly', () => {
    logService.setLogLevel(LogLevel.WARN);
    
    const message = 'Warning message';
    const data = { key: 'value' };
    
    logService.warn(message, data);
    
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('[WARN]'),
      expect.stringContaining(message),
      data
    );
  });
  
  // Тест на метод error
  test('error method logs correctly', () => {
    logService.setLogLevel(LogLevel.ERROR);
    
    const message = 'Error message';
    const error = new Error('Test error');
    
    logService.error(message, error);
    
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      expect.stringContaining(message),
      error
    );
  });
  
  // Тест на фильтрацию логов по уровню
  test('logs are filtered based on log level', () => {
    // Устанавливаем уровень логирования ERROR
    logService.setLogLevel(LogLevel.ERROR);
    
    // Вызываем все методы логирования
    logService.debug('Debug message');
    logService.info('Info message');
    logService.warn('Warning message');
    logService.error('Error message');
    
    // Проверяем, что вызваны только методы с уровнем >= ERROR
    expect(mockDebug).not.toHaveBeenCalled();
    expect(mockInfo).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalled();
    
    // Меняем уровень логирования на INFO
    logService.setLogLevel(LogLevel.INFO);
    
    // Очищаем мок-функции
    mockDebug.mockClear();
    mockInfo.mockClear();
    mockWarn.mockClear();
    mockError.mockClear();
    
    // Вызываем все методы логирования снова
    logService.debug('Debug message');
    logService.info('Info message');
    logService.warn('Warning message');
    logService.error('Error message');
    
    // Проверяем, что вызваны только методы с уровнем >= INFO
    expect(mockDebug).not.toHaveBeenCalled();
    expect(mockInfo).toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalled();
    expect(mockError).toHaveBeenCalled();
  });
  
  // Тест на форматирование времени
  test('logs include formatted timestamp', () => {
    logService.setLogLevel(LogLevel.INFO);
    
    // Мокаем Date.now() для получения предсказуемого времени
    const originalDateNow = Date.now;
    const mockDate = new Date('2025-01-01T12:00:00Z');
    Date.now = jest.fn(() => mockDate.getTime());
    
    logService.info('Test message');
    
    // Восстанавливаем оригинальный Date.now
    Date.now = originalDateNow;
    
    // Проверяем, что лог содержит отформатированное время
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('12:00:00'),
      expect.any(String)
    );
  });
  
  // Тест на обработку объектов с циклическими ссылками
  test('handles objects with circular references', () => {
    logService.setLogLevel(LogLevel.INFO);
    
    // Создаем объект с циклической ссылкой
    const circularObj: any = { name: 'Circular Object' };
    circularObj.self = circularObj;
    
    // Логируем объект с циклической ссылкой
    logService.info('Circular object', circularObj);
    
    // Проверяем, что лог был вызван без ошибок
    expect(mockInfo).toHaveBeenCalled();
  });
});
