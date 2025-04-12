import { dateUtils } from './dateUtils';

export interface DayProgress {
  dayNumber: number;
  date: string;
  thoughtsCompleted: boolean;
  exerciseCompleted: boolean;
  audioCompleted: boolean;
  reflectionCompleted: boolean;
}

export interface WeekProgress {
  weekNumber: number;
  reflectionCompleted: boolean;
  days: DayProgress[];
}

export const progressUtils = {
  // Create an empty day progress object
  createEmptyDayProgress(dayNumber: number): DayProgress {
    return {
      dayNumber,
      date: dateUtils.formatDate(new Date()),
      thoughtsCompleted: false,
      exerciseCompleted: false,
      audioCompleted: false,
      reflectionCompleted: false
    };
  },

  // Create an empty week progress object
  createEmptyWeekProgress(weekNumber: number): WeekProgress {
    const days = dateUtils.getDaysInWeek(weekNumber).map(day => 
      this.createEmptyDayProgress(day)
    );
    
    return {
      weekNumber,
      reflectionCompleted: false,
      days
    };
  },

  // Calculate progress percentage for a day
  calculateDayProgress(day: DayProgress): number {
    const totalActivities = dateUtils.isReflectionDay(day.dayNumber) ? 4 : 3;
    let completedActivities = 0;
    
    if (day.thoughtsCompleted) completedActivities++;
    if (day.exerciseCompleted) completedActivities++;
    if (day.audioCompleted) completedActivities++;
    if (dateUtils.isReflectionDay(day.dayNumber) && day.reflectionCompleted) {
      completedActivities++;
    }
    
    return (completedActivities / totalActivities) * 100;
  },

  // Calculate progress percentage for a week
  calculateWeekProgress(week: WeekProgress): number {
    const daysProgress = week.days.map(day => this.calculateDayProgress(day));
    const totalProgress = daysProgress.reduce((sum, progress) => sum + progress, 0);
    return totalProgress / dateUtils.DAYS_IN_WEEK;
  },

  // Calculate overall sprint progress
  calculateSprintProgress(weeks: WeekProgress[]): number {
    if (!weeks.length) return 0;
    const weeksProgress = weeks.map(week => this.calculateWeekProgress(week));
    const totalProgress = weeksProgress.reduce((sum, progress) => sum + progress, 0);
    return totalProgress / weeks.length;
  },

  // Get motivational status text based on progress
  getProgressStatus(progress: number): string {
    if (progress === 100) return "Amazing! You've completed everything!";
    if (progress >= 75) return "Great progress! Keep going!";
    if (progress >= 50) return "You're halfway there!";
    if (progress >= 25) return "Good start! Keep pushing!";
    return "Let's get started!";
  }
}; 