/**
 * Service interfaces
 */

import { DayProgress, WeekReflection, UserProgress, DailyContent } from '../../../features/day/types/progress';

/**
 * Progress service interface
 */
export interface IProgressService {
  loadProgress(userId?: string): Promise<UserProgress>;
  saveProgress(progress: UserProgress, userId?: string): Promise<void>;
  createDefaultProgress(): UserProgress;
  updateDayProgress(progress: UserProgress, dayNumber: number, data: Partial<DayProgress>, userId?: string): Promise<UserProgress>;
  updateWeekReflection(progress: UserProgress, weekNumber: number, data: Partial<WeekReflection>, userId?: string): Promise<UserProgress>;
  getDayCompletion(progress: UserProgress, dayNumber: number): number;
  isReflectionDay(dayNumber: number): boolean;
  isDayAccessible(dayNumber: number): boolean;
  isWeekAccessible(weekNumber: number): boolean;
  areTasksCompleted(progress: UserProgress, dayNumber: number): boolean;
  isWeekComplete(progress: UserProgress, weekNumber: number): boolean;
  updateCurrentDay(progress: UserProgress, userId?: string): Promise<UserProgress>;
  syncProgressWithSupabase(userId: string): Promise<UserProgress>;
  loadProgressFromSupabase(userId: string): Promise<UserProgress | null>;
  saveProgressToSupabase(userId: string, progress: UserProgress): Promise<void>;
}

/**
 * Content service interface
 */
export interface IContentService {
  getDailyContent(dayNumber: number): DailyContent;
  getStepAudioSrc(dayNumber: number, stepNumber: number): string;
  getMotivationalPhrase(weekNumber: number): string;
  getDayTitle(dayNumber: number): string;
  formatDate(date: Date): string;
}

/**
 * Audio service interface
 */
export interface IAudioService {
  initialize(): void;
  play(src: string): void;
  pause(): void;
  stop(): void;
  setVolume(volume: number): void;
  isPlaying(): boolean;
  getDuration(): number;
  getCurrentTime(): number;
  setCurrentTime(time: number): void;
  playStepAudio(dayNumber: number, stepNumber: number): void;
  playDayAudio(dayNumber: number): void;
}

/**
 * Auth service interface
 */
export interface IAuthService {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  register(email: string, password: string, name: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  isAuthenticated(): boolean;
  getCurrentUser(): any;
}

/**
 * Theme service interface
 */
export interface IThemeService {
  getTheme(): 'light' | 'dark';
  setTheme(theme: 'light' | 'dark'): void;
  toggleTheme(): void;
}
