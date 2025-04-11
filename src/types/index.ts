// Common types
export interface ApiResponse<T> {
  data: T;
  error: Error | null;
  status: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Habit types
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  goal: number;
  progress: number;
  startDate: string;
  endDate?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Goal types
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  progress: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// App settings
export interface AppSettings {
  theme: Theme;
  notifications: boolean;
  language: string;
  timezone: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Component props
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// API types
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

// Context types
export interface AppContextType {
  user: User | null;
  settings: AppSettings;
  isLoading: boolean;
  error: AppError | null;
  setUser: (user: User | null) => void;
  setSettings: (settings: AppSettings) => void;
  setError: (error: AppError | null) => void;
} 