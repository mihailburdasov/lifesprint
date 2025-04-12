/**
 * Date utility functions for the LifeSprint application
 */

// Format date as "DD Month" (e.g., "31 марта")
export const formatDate = (date: Date): string => {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  
  return `${day} ${month}`;
};

// Get the current day number in the sprint (1-28)
export const getCurrentSprintDay = (startDate: Date): number => {
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  // Ensure the day is within the 28-day sprint
  return Math.min(Math.max(diffDays, 1), 28);
};

// Get the week number (1-4) from the day number (1-28)
export const getWeekNumber = (dayNumber: number): number => {
  return Math.ceil(dayNumber / 7);
};

// Get the day number within the week (1-7) from the day number (1-28)
export const getDayInWeek = (dayNumber: number): number => {
  return ((dayNumber - 1) % 7) + 1;
};

// Check if the day is a reflection day (day 7, 14, 21, or 28)
export const isReflectionDay = (dayNumber: number): boolean => {
  return dayNumber % 7 === 0;
};

// Get the start date of the current month's sprint
export const getCurrentMonthSprintStart = (): Date => {
  // Set the start date to the first day of the current month
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1); // Use current month instead of fixed April
};

// Get the day title based on the day number
export const getDayTitle = (dayNumber: number): string => {
  // For reflection days (7, 14, 21, 28), return special titles
  if (dayNumber % 7 === 0) {
    const weekNumber = dayNumber / 7;
    const weekNames = ['первой', 'второй', 'третьей', 'четвёртой'];
    return `Подводим итоги ${weekNames[weekNumber - 1]} недели`;
  }

  // For regular days, use the predefined titles
  const titles = [
    'Плавный старт', 'Осознанность', 'Благодарность', 'Цели', 'Достижения', 'Практика',
    '', // Day 7 is handled above
    'Новые горизонты', 'Внимательность', 'Энергия', 'Фокус', 'Баланс', 'Рост',
    '', // Day 14 is handled above
    'Преодоление', 'Радость', 'Сила', 'Творчество', 'Связь', 'Гармония',
    '', // Day 21 is handled above
    'Интеграция', 'Мудрость', 'Принятие', 'Видение', 'Действие', 'Празднование',
    '' // Day 28 is handled above
  ];
  
  return titles[dayNumber - 1] || `День ${dayNumber}`;
};

export const dateUtils = {
  // Constants
  DAYS_IN_SPRINT: 28,
  DAYS_IN_WEEK: 7,
  
  // Get the current day number (1-28) based on the current date
  getCurrentDayNumber(): number {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return Math.min(Math.max(dayOfMonth, 1), this.DAYS_IN_SPRINT);
  },
  
  // Get the current week number (1-4) based on the current day
  getCurrentWeekNumber(): number {
    const currentDay = this.getCurrentDayNumber();
    return Math.ceil(currentDay / this.DAYS_IN_WEEK);
  },
  
  // Check if a given day is a reflection day (7, 14, 21, 28)
  isReflectionDay(dayNumber: number): boolean {
    return dayNumber % this.DAYS_IN_WEEK === 0;
  },
  
  // Get the week number for a given day
  getWeekForDay(dayNumber: number): number {
    return Math.ceil(dayNumber / this.DAYS_IN_WEEK);
  },
  
  // Get all days in a given week
  getDaysInWeek(weekNumber: number): number[] {
    const startDay = (weekNumber - 1) * this.DAYS_IN_WEEK + 1;
    return Array.from(
      { length: this.DAYS_IN_WEEK },
      (_, i) => startDay + i
    );
  },
  
  // Format a date as YYYY-MM-DD
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },
  
  // Parse a date string in YYYY-MM-DD format
  parseDate(dateString: string): Date {
    return new Date(dateString);
  },
  
  // Get time until next day
  getTimeUntilNextDay: (): number => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getTime() - now.getTime();
  },
  
  // Format date for display
  formatDateForDisplay: (date: Date): string => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  },
  
  // Format time for display
  formatTime: (date: Date): string => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  },
  
  // Check if date is today
  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  },
  
  // Get days in current sprint (always 28)
  getDaysInSprint: (): number => 28,
  
  // Get weeks in current sprint (always 4)
  getWeeksInSprint: (): number => 4
};
