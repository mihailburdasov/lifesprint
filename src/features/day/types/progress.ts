/**
 * Type definitions for progress tracking in the LifeSprint application
 */

// Define types for day progress
export interface DayProgress {
  completed: boolean;
  gratitude: string[];
  achievements: string[];
  goals: { text: string; completed: boolean }[];
  exerciseCompleted: boolean;
  withAudio: boolean;
  reflection?: string;
}

// Define types for week reflection
export interface WeekReflection {
  gratitudeSelf: string;
  gratitudeOthers: string;
  gratitudeWorld: string;
  achievements: string[];
  improvements: string[];
  insights: string[];
  rules: string[];
  exerciseCompleted: boolean;
  withAudio: boolean;
}

// Define sync status type
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

// Define types for user progress
export interface UserProgress {
  currentDay: number;
  days: Record<number, DayProgress>;
  weekReflections: Record<number, WeekReflection>;
  weeks?: Record<number, Record<number, DayProgress>>; // Optional for backward compatibility
  completedDays: number;
  totalDays: number;
  startDate: string;
  lastUpdated?: string; // Timestamp of when the progress was last updated
  lastSyncTimestamp?: number; // Timestamp of the last successful sync
  syncStatus?: SyncStatus; // Current sync status
  userId?: string; // User ID for data ownership
}

// Define types for daily content
export interface DailyContent {
  thought: {
    text: string;
    author?: string;
  };
  exercise: string;
  audioSrc?: string;
  withAudio: boolean;
}

// Define types for progress context
export interface ProgressContextType {
  progress: UserProgress;
  updateDayProgress: (dayNumber: number, data: Partial<DayProgress>, forceSync?: boolean) => Promise<void>;
  updateWeekReflection: (weekNumber: number, data: Partial<WeekReflection>, forceSync?: boolean) => Promise<void>;
  getDayCompletion: (dayNumber: number) => number;
  isReflectionDay: (dayNumber: number) => boolean;
  isDayAccessible: (dayNumber: number) => boolean;
  isWeekAccessible: (weekNumber: number) => boolean;
  isLoading: boolean;
  isSyncing: boolean; // Indicates if sync with server is in progress
  needsSync: boolean; // Indicates if there are unsaved changes
  error: string | null;
  updateCurrentDay: () => Promise<void>;
  reloadProgress: () => Promise<void>; // Function to reload progress from Supabase/localStorage
  forceSyncWithServer: () => Promise<boolean>; // Function to force sync with server, returns success status
  checkSupabaseData: () => Promise<any>; // Function to check if data exists in Supabase
  syncUserData: () => Promise<boolean>; // Function to fetch full user data
  lastSyncTimestamp: number; // Timestamp of the last successful sync
}
