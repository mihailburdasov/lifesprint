export interface Goal {
  text: string;
  completed: boolean;
}

export interface DayProgress {
  dayNumber: number;
  date: string;
  thoughtsCompleted: boolean;
  exerciseCompleted: boolean;
  audioCompleted: boolean;
  reflectionCompleted: boolean;
  gratitude: string[];
  achievements: string[];
  goals: Goal[];
  additionalGratitude: string[];
  additionalAchievements: string[];
  completed: boolean;
}

export const createDefaultDayProgress = (dayNumber: number, date: string): DayProgress => {
  return {
    dayNumber,
    date,
    thoughtsCompleted: false,
    exerciseCompleted: false,
    audioCompleted: false,
    reflectionCompleted: false,
    gratitude: ["Я благодарю за", "Я благодарю за", "Я благодарю за"],
    achievements: ["Я горжусь тем, что", "Я горжусь тем, что", "Я горжусь тем, что"],
    goals: [
      { text: '', completed: false },
      { text: '', completed: false },
      { text: '', completed: false }
    ],
    additionalGratitude: [],
    additionalAchievements: [],
    completed: false
  };
};

export interface WeekReflection {
  gratitudeSelf: string;
  gratitudeOthers: string;
  gratitudeWorld: string;
  achievements: string[];
  improvements: string[];
  insights: string[];
  rules: string[];
  exerciseCompleted: boolean;
  reflectionCompleted: boolean;
  weekNumber: number;
  days: DayProgress[];
}

export interface WeekProgress {
  weekNumber: number;
  reflectionCompleted: boolean;
  days: DayProgress[];
  progress: number;
  gratitudeSelf: string;
  gratitudeOthers: string;
  gratitudeWorld: string;
  achievements: string[];
  improvements: string[];
  insights: string[];
  rules: string[];
  exerciseCompleted: boolean;
}

export interface Progress {
  startDate: string;
  currentDay: number;
  currentWeek: number;
  days: Record<number, DayProgress>;
  weekReflections: Record<number, WeekProgress>;
}

export interface ProgressContextType {
  progress: Progress;
  currentDay: number;
  currentWeek: number;
  weeks: WeekProgress[];
  updateDayProgress: (dayNumber: number, data: Partial<Progress['days'][number]>) => Promise<void>;
  updateWeekReflection: (weekNumber: number, data: Partial<Progress['weekReflections'][number]>) => Promise<void>;
  updateWeekProgress: (weekNumber: number, data: Partial<WeekProgress>) => Promise<void>;
  isDayAccessible: (dayNumber: number) => boolean;
  isWeekAccessible: (weekNumber: number) => boolean;
  isReflectionDay: (dayNumber: number) => boolean;
  getDayProgress: (dayNumber: number) => number;
  getWeekProgress: (weekNumber: number) => number;
  getDayCompletion: (dayNumber: number) => number;
  getReflectionDayWidgetProgress: (dayNumber: number) => {
    gratitude: number;
    achievements: number;
    improvements: number;
    insights: number;
    rules: number;
    exercise: number;
  };
  getDayWidgetProgress: (dayNumber: number) => {
    gratitude: number;
    achievements: number;
    goals: number;
  };
} 