/**
 * Application constants
 */

// App information
export const APP_NAME = 'LifeSprint';
export const APP_VERSION = '1.0.0';

// Local storage keys
export const STORAGE_KEYS = {
  USER_PROGRESS: 'user_progress',
  USER_SETTINGS: 'user_settings',
  AUTH_TOKEN: 'auth_token',
  THEME: 'theme',
};

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DAY: '/day/:dayNumber',
  STEP_BY_STEP_DAY: '/day/:dayNumber/step-by-step',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

// API endpoints
export const API = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://api.lifesprint.app',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USER: {
    PROFILE: '/user/profile',
    SETTINGS: '/user/settings',
    PROGRESS: '/user/progress',
  },
};

// Time constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

// Program constants
export const PROGRAM = {
  TOTAL_DAYS: 90,
  DAYS_PER_WEEK: 7,
  TOTAL_WEEKS: 13,
  REFLECTION_DAYS: [7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 90],
};

// Media breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
};

// Animation durations
export const ANIMATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};

// Error messages
export const ERRORS = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_EXISTS: 'Email already exists.',
    WEAK_PASSWORD: 'Password is too weak.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
  },
};

// Success messages
export const SUCCESS = {
  AUTH: {
    LOGIN: 'Login successful.',
    REGISTER: 'Registration successful.',
    LOGOUT: 'Logout successful.',
    RESET_PASSWORD: 'Password reset email sent.',
  },
  USER: {
    PROFILE_UPDATE: 'Profile updated successfully.',
    SETTINGS_UPDATE: 'Settings updated successfully.',
    PROGRESS_UPDATE: 'Progress updated successfully.',
  },
};
