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

// Define types for user progress
export interface UserProgress {
  currentDay: number;
  days: Record<number, DayProgress>;
  weekReflections: Record<number, WeekReflection>;
  weeks?: Record<number, Record<number, DayProgress>>; // Optional for backward compatibility
  completedDays: number;
  totalDays: number;
  startDate: string;
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
  updateDayProgress: (dayNumber: number, data: Partial<DayProgress>) => void;
  updateWeekReflection: (weekNumber: number, data: Partial<WeekReflection>) => void;
  getDayCompletion: (dayNumber: number) => number;
  isReflectionDay: (dayNumber: number) => boolean;
  isDayAccessible: (dayNumber: number) => boolean;
  isWeekAccessible: (weekNumber: number) => boolean;
  isLoading: boolean;
  error: string | null;
  updateCurrentDay: () => void;
  reloadProgress: () => void; // Add the new function to reload progress from localStorage
}
