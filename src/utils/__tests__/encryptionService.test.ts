import { encryptionService } from '../encryptionService';

// Мокаем Web Crypto API
const mockEncrypt = jest.fn();
const mockDecrypt = jest.fn();
const mockImportKey = jest.fn();
const mockDeriveKey = jest.fn();
const mockGetRandomValues = jest.fn();

// Мокаем localStorage
const mockLocalStorage: Record<string, string> = {};

describe('encryptionService', () => {
  // Сохраняем оригинальные объекты
  const originalCrypto = global.crypto;
  const originalTextEncoder = global.TextEncoder;
  const originalTextDecoder = global.TextDecoder;
  const originalLocalStorage = global.localStorage;
  
  beforeAll(() => {
    // Мокаем crypto.subtle
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          encrypt: mockEncrypt,
          decrypt: mockDecrypt,
          importKey: mockImportKey,
          deriveKey: mockDeriveKey
        },
        getRandomValues: mockGetRandomValues
      },
      writable: true
    });
    
    // Мокаем TextEncoder
    global.TextEncoder = jest.fn().mockImplementation(() => ({
      encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]))
    }));
    
    // Мокаем TextDecoder
    global.TextDecoder = jest.fn().mockImplementation(() => ({
      decode: jest.fn().mockReturnValue('{"test":"value"}')
    }));
    
    // Мокаем localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(mockLocalStorage).forEach(key => {
            delete mockLocalStorage[key];
          });
        })
      },
      writable: true
    });
    
    // Мокаем getRandomValues
    mockGetRandomValues.mockImplementation(() => new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
    
    // Мокаем importKey
    mockImportKey.mockResolvedValue('mockKeyMaterial');
    
    // Мокаем deriveKey
    mockDeriveKey.mockResolvedValue('mockCryptoKey');
    
    // Мокаем encrypt
    mockEncrypt.mockResolvedValue(new ArrayBuffer(10));
    
    // Мокаем decrypt
    mockDecrypt.mockResolvedValue(new ArrayBuffer(10));
    
    // Мокаем btoa и atob
    global.btoa = jest.fn().mockReturnValue('base64String');
    global.atob = jest.fn().mockReturnValue('decodedString');
  });
  
  afterAll(() => {
    // Восстанавливаем оригинальные объекты
    global.crypto = originalCrypto;
    global.TextEncoder = originalTextEncoder;
    global.TextDecoder = originalTextDecoder;
    global.localStorage = originalLocalStorage;
  });
  
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();
    Object.keys(mockLocalStorage).forEach(key => {
      delete mockLocalStorage[key];
    });
  });
  
  // Тест на проверку поддержки Web Crypto API
  test('isSupported returns true when Web Crypto API is available', () => {
    expect(encryptionService.isSupported()).toBe(true);
  });
  
  // Тест на генерацию ключа
  test('generateKey generates a key from password', async () => {
    const key = await encryptionService.generateKey('password123');
    
    // Проверяем, что вызваны нужные методы
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockDeriveKey).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith('encryption_salt', expect.any(String));
    
    // Проверяем результат
    expect(key).toBe('mockCryptoKey');
  });
  
  // Тест на получение ключа
  test('getKey retrieves a key using stored salt', async () => {
    // Устанавливаем соль в localStorage
    localStorage.setItem('encryption_salt', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16');
    
    const key = await encryptionService.getKey('password123');
    
    // Проверяем, что вызваны нужные методы
    expect(localStorage.getItem).toHaveBeenCalledWith('encryption_salt');
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockDeriveKey).toHaveBeenCalled();
    
    // Проверяем результат
    expect(key).toBe('mockCryptoKey');
  });
  
  // Тест на шифрование данных
  test('encrypt encrypts data', async () => {
    const data = { test: 'value' };
    const key = 'mockCryptoKey';
    
    const encrypted = await encryptionService.encrypt(data, key as unknown as CryptoKey);
    
    // Проверяем, что вызваны нужные методы
    expect(mockEncrypt).toHaveBeenCalled();
    expect(global.btoa).toHaveBeenCalled();
    
    // Проверяем результат
    expect(encrypted).toBe('base64String');
  });
  
  // Тест на дешифрование данных
  test('decrypt decrypts data', async () => {
    const encryptedData = 'base64String';
    const key = 'mockCryptoKey';
    
    const decrypted = await encryptionService.decrypt(encryptedData, key as unknown as CryptoKey);
    
    // Проверяем, что вызваны нужные методы
    expect(global.atob).toHaveBeenCalledWith(encryptedData);
    expect(mockDecrypt).toHaveBeenCalled();
    
    // Проверяем результат
    expect(decrypted).toEqual({ test: 'value' });
  });
  
  // Тест на безопасное сохранение данных
  test('secureSet encrypts and saves data to localStorage', async () => {
    const key = 'testKey';
    const data = { test: 'value' };
    const encryptionKey = 'mockCryptoKey';
    
    await encryptionService.secureSet(key, data, encryptionKey as unknown as CryptoKey);
    
    // Проверяем, что вызваны нужные методы
    expect(mockEncrypt).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(key, 'base64String');
  });
  
  // Тест на безопасное получение данных
  test('secureGet retrieves and decrypts data from localStorage', async () => {
    const key = 'testKey';
    const encryptionKey = 'mockCryptoKey';
    
    // Устанавливаем зашифрованные данные в localStorage
    localStorage.setItem(key, 'base64String');
    
    const data = await encryptionService.secureGet(key, encryptionKey as unknown as CryptoKey);
    
    // Проверяем, что вызваны нужные методы
    expect(localStorage.getItem).toHaveBeenCalledWith(key);
    expect(mockDecrypt).toHaveBeenCalled();
    
    // Проверяем результат
    expect(data).toEqual({ test: 'value' });
  });
  
  // Тест на обработку ошибок при генерации ключа
  test('generateKey handles errors', async () => {
    // Мокаем ошибку
    mockImportKey.mockRejectedValueOnce(new Error('Import key error'));
    
    // Проверяем, что метод выбрасывает ошибку
    await expect(encryptionService.generateKey('password123')).rejects.toThrow('Не удалось создать ключ шифрования');
  });
  
  // Тест на обработку ошибок при получении ключа
  test('getKey handles missing salt', async () => {
    // Удаляем соль из localStorage
    localStorage.removeItem('encryption_salt');
    
    // Проверяем, что метод выбрасывает ошибку
    await expect(encryptionService.getKey('password123')).rejects.toThrow('Соль для шифрования не найдена');
  });
  
  // Тест на обработку ошибок при шифровании
  test('encrypt handles errors', async () => {
    // Мокаем ошибку
    mockEncrypt.mockRejectedValueOnce(new Error('Encrypt error'));
    
    // Проверяем, что метод выбрасывает ошибку
    await expect(encryptionService.encrypt({ test: 'value' }, 'mockCryptoKey' as unknown as CryptoKey)).rejects.toThrow('Не удалось зашифровать данные');
  });
  
  // Тест на обработку ошибок при дешифровании
  test('decrypt handles errors', async () => {
    // Мокаем ошибку
    mockDecrypt.mockRejectedValueOnce(new Error('Decrypt error'));
    
    // Проверяем, что метод выбрасывает ошибку
    await expect(encryptionService.decrypt('base64String', 'mockCryptoKey' as unknown as CryptoKey)).rejects.toThrow('Не удалось расшифровать данные');
  });
  
  // Тест на обработку ошибок при безопасном получении данных
  test('secureGet returns null when data is not found', async () => {
    // Удаляем данные из localStorage
    localStorage.removeItem('testKey');
    
    // Проверяем, что метод возвращает null
    const result = await encryptionService.secureGet('testKey', 'mockCryptoKey' as unknown as CryptoKey);
    expect(result).toBeNull();
  });
});
