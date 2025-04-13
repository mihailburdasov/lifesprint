/**
 * Date utility functions
 */

/**
 * Format a date to a string
 * @param date The date to format
 * @param format The format to use (default: 'YYYY-MM-DD')
 * @returns The formatted date string
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // Pad with leading zeros
  const pad = (num: number): string => num.toString().padStart(2, '0');
  
  // Replace format tokens
  return format
    .replace('YYYY', year.toString())
    .replace('MM', pad(month))
    .replace('DD', pad(day))
    .replace('HH', pad(hours))
    .replace('mm', pad(minutes))
    .replace('ss', pad(seconds));
}

/**
 * Format date as "DD Month" (e.g., "31 марта")
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDateRussian(date: Date): string {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  
  return `${day} ${month}`;
}

/**
 * Get the difference in days between two dates
 * @param date1 The first date
 * @param date2 The second date (default: current date)
 * @returns The difference in days
 */
export function getDaysDifference(date1: Date, date2: Date = new Date()): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / oneDay);
}

/**
 * Add days to a date
 * @param date The date to add days to
 * @param days The number of days to add
 * @returns A new date with the days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if a date is today
 * @param date The date to check
 * @returns Whether the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 * @param date The date to check
 * @returns Whether the date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < new Date().getTime();
}

/**
 * Check if a date is in the future
 * @param date The date to check
 * @returns Whether the date is in the future
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > new Date().getTime();
}

/**
 * Get the start of a day
 * @param date The date to get the start of
 * @returns A new date at the start of the day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of a day
 * @param date The date to get the end of
 * @returns A new date at the end of the day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the day of the week
 * @param date The date to get the day of the week for
 * @returns The day of the week (0-6, where 0 is Sunday)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Get the week number
 * @param date The date to get the week number for
 * @returns The week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = getDaysDifference(firstDayOfYear, date);
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Get the current day number in the sprint (1-31)
 * @param startDate The start date of the sprint
 * @returns The current day number
 */
export function getCurrentSprintDay(startDate: Date): number {
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  // Ensure the day is within the 31-day sprint
  return Math.min(Math.max(diffDays, 1), 31);
}

/**
 * Get the week number (1-5) from the day number (1-31)
 * @param dayNumber The day number
 * @returns The week number
 */
export function getWeekNumberFromDay(dayNumber: number): number {
  return Math.ceil(dayNumber / 7);
}

/**
 * Get the day number within the week (1-7) from the day number (1-31)
 * @param dayNumber The day number
 * @returns The day number within the week
 */
export function getDayInWeek(dayNumber: number): number {
  return ((dayNumber - 1) % 7) + 1;
}

/**
 * Check if the day is a reflection day (day 7, 14, 21, 28, or 31)
 * @param dayNumber The day number
 * @returns Whether the day is a reflection day
 */
export function isReflectionDay(dayNumber: number): boolean {
  return dayNumber % 7 === 0 || dayNumber === 31;
}

/**
 * Get the start date of the current month's sprint
 * @returns The start date of the current month's sprint
 */
export function getCurrentMonthSprintStart(): Date {
  // Set the start date to April 1st of the current year
  const today = new Date();
  return new Date(today.getFullYear(), 3, 1); // Month is 0-indexed, so 3 is April
}
