import { ApiConfig } from '../types';

export const APP_NAME = 'LifeSprint';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = '31-дневный путь трансформации';

// API Configuration
export const API_CONFIG: ApiConfig = {
  baseUrl: process.env.REACT_APP_API_URL || 'https://api.lifesprint.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_OFFLINE_MODE: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
};

// Cache configuration
export const CACHE_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  VERSION: APP_VERSION,
};

// Security configuration
export const SECURITY_CONFIG = {
  CSP: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", API_CONFIG.baseUrl],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"],
  },
  CORS: {
    origin: process.env.REACT_APP_CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
  },
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  LAZY_LOAD_THRESHOLD: 200,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
};

// Error handling configuration
export const ERROR_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 5000,
};

// Analytics configuration
export const ANALYTICS_CONFIG = {
  ENABLED: FEATURES.ENABLE_ANALYTICS,
  TRACKING_ID: process.env.REACT_APP_GA_TRACKING_ID,
  DEBUG: process.env.NODE_ENV === 'development',
};

// Notification configuration
export const NOTIFICATION_CONFIG = {
  ENABLED: FEATURES.ENABLE_NOTIFICATIONS,
  DEFAULT_TITLE: APP_NAME,
  DEFAULT_OPTIONS: {
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
  },
}; 