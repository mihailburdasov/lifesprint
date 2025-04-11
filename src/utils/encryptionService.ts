import { logService } from './logService';

/**
 * Сервис для шифрования и дешифрования данных
 * Использует Web Crypto API для безопасного хранения данных в localStorage
 */
export const encryptionService = {
  /**
   * Генерация ключа шифрования на основе пароля пользователя
   * @param password Пароль пользователя
   * @returns Ключ шифрования
   */
  async generateKey(password: string): Promise<CryptoKey> {
    try {
      // Преобразуем пароль в массив байтов
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      
      // Создаем соль для PBKDF2
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Сохраняем соль в localStorage для последующего использования
      localStorage.setItem('encryption_salt', Array.from(salt).join(','));
      
      // Создаем материал ключа из пароля
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Генерируем ключ с использованием PBKDF2
      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      logService.error('Ошибка при генерации ключа шифрования', error);
      throw new Error('Не удалось создать ключ шифрования');
    }
  },
  
  /**
   * Получение ключа шифрования на основе пароля пользователя и сохраненной соли
   * @param password Пароль пользователя
   * @returns Ключ шифрования
   */
  async getKey(password: string): Promise<CryptoKey> {
    try {
      // Получаем сохраненную соль
      const saltString = localStorage.getItem('encryption_salt');
      if (!saltString) {
        throw new Error('Соль для шифрования не найдена');
      }
      
      // Преобразуем строку в массив байтов
      const salt = new Uint8Array(saltString.split(',').map(Number));
      
      // Преобразуем пароль в массив байтов
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      
      // Создаем материал ключа из пароля
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Генерируем ключ с использованием PBKDF2
      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      logService.error('Ошибка при получении ключа шифрования', error);
      throw new Error('Не удалось получить ключ шифрования');
    }
  },
  
  /**
   * Шифрование данных
   * @param data Данные для шифрования
   * @param key Ключ шифрования
   * @returns Зашифрованные данные в виде строки
   */
  async encrypt(data: any, key: CryptoKey): Promise<string> {
    try {
      // Преобразуем данные в JSON-строку
      const jsonString = JSON.stringify(data);
      
      // Преобразуем строку в массив байтов
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(jsonString);
      
      // Создаем вектор инициализации
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Шифруем данные
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        plaintext
      );
      
      // Объединяем вектор инициализации и зашифрованные данные
      const result = new Uint8Array(iv.length + ciphertext.byteLength);
      result.set(iv);
      result.set(new Uint8Array(ciphertext), iv.length);
      
      // Преобразуем результат в base64-строку
      return btoa(String.fromCharCode.apply(null, Array.from(result)));
    } catch (error) {
      logService.error('Ошибка при шифровании данных', error);
      throw new Error('Не удалось зашифровать данные');
    }
  },
  
  /**
   * Дешифрование данных
   * @param encryptedData Зашифрованные данные в виде строки
   * @param key Ключ шифрования
   * @returns Расшифрованные данные
   */
  async decrypt(encryptedData: string, key: CryptoKey): Promise<any> {
    try {
      // Преобразуем base64-строку в массив байтов
      const encryptedBytes = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      
      // Извлекаем вектор инициализации и зашифрованные данные
      const iv = encryptedBytes.slice(0, 12);
      const ciphertext = encryptedBytes.slice(12);
      
      // Дешифруем данные
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        ciphertext
      );
      
      // Преобразуем расшифрованные данные в строку
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decrypted);
      
      // Преобразуем JSON-строку в объект
      return JSON.parse(jsonString);
    } catch (error) {
      logService.error('Ошибка при дешифровании данных', error);
      throw new Error('Не удалось расшифровать данные');
    }
  },
  
  /**
   * Безопасное сохранение данных в localStorage
   * @param key Ключ для localStorage
   * @param data Данные для сохранения
   * @param encryptionKey Ключ шифрования
   */
  async secureSet(key: string, data: any, encryptionKey: CryptoKey): Promise<void> {
    try {
      // Шифруем данные
      const encryptedData = await this.encrypt(data, encryptionKey);
      
      // Сохраняем зашифрованные данные в localStorage
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      logService.error(`Ошибка при безопасном сохранении данных для ключа ${key}`, error);
      throw new Error('Не удалось безопасно сохранить данные');
    }
  },
  
  /**
   * Безопасное получение данных из localStorage
   * @param key Ключ для localStorage
   * @param encryptionKey Ключ шифрования
   * @returns Расшифрованные данные
   */
  async secureGet(key: string, encryptionKey: CryptoKey): Promise<any | null> {
    try {
      // Получаем зашифрованные данные из localStorage
      const encryptedData = localStorage.getItem(key);
      
      // Если данных нет, возвращаем null
      if (!encryptedData) {
        return null;
      }
      
      // Дешифруем данные
      return await this.decrypt(encryptedData, encryptionKey);
    } catch (error) {
      logService.error(`Ошибка при безопасном получении данных для ключа ${key}`, error);
      return null;
    }
  },
  
  /**
   * Проверка поддержки Web Crypto API
   * @returns true, если Web Crypto API поддерживается
   */
  isSupported(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' && 
           typeof TextEncoder !== 'undefined' && 
           typeof TextDecoder !== 'undefined';
  }
};
