import { encryptionService } from './encryptionService';

export const storageUtils = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Queue for offline operations
export class OperationQueue {
  private queue: Array<{
    type: string;
    action: string;
    data: any;
    timestamp: number;
  }> = [];
  
  constructor(private key: string) {
    this.loadQueue();
  }
  
  private loadQueue() {
    const savedQueue = localStorage.getItem(this.key);
    if (savedQueue) {
      this.queue = JSON.parse(savedQueue);
    }
  }
  
  private saveQueue() {
    localStorage.setItem(this.key, JSON.stringify(this.queue));
  }
  
  add(type: string, action: string, data: any) {
    this.queue.push({
      type,
      action,
      data,
      timestamp: Date.now()
    });
    this.saveQueue();
  }
  
  getAll() {
    return [...this.queue];
  }
  
  clear() {
    this.queue = [];
    this.saveQueue();
  }
  
  remove(index: number) {
    this.queue.splice(index, 1);
    this.saveQueue();
  }
}

// System theme detection
export const systemTheme = {
  isDark: (): boolean => 
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
    
  onChange: (callback: (isDark: boolean) => void): (() => void) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
}; 