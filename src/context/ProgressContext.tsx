import React, { createContext, useContext, useState, useEffect } from 'react';
import { Progress, ProgressContextType, WeekProgress } from '../types/progress';
import { storageUtils } from '../utils/storageUtils';
import { dateUtils } from '../utils/dateUtils';

const ProgressContext = createContext<ProgressContextType | null>(null);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<Progress>(() => {
    const savedProgress = storageUtils.get<Progress>('progress');
    if (savedProgress) {
      return savedProgress;
    }
    // Test data
    return {
      startDate: new Date().toISOString(),
      currentDay: 14, // Set to day 14 to have access to first two weeks
      currentWeek: 2,
      days: {
        1: {
          dayNumber: 1,
          date: new Date().toISOString(),
          thoughtsCompleted: true,
          exerciseCompleted: true,
          audioCompleted: true,
          reflectionCompleted: true,
          gratitude: ['Grateful for family', 'Grateful for health', 'Grateful for opportunities'],
          achievements: ['Completed project', 'Exercised', 'Learned something new'],
          goals: [
            { text: 'Complete task 1', completed: true },
            { text: 'Exercise', completed: true },
            { text: 'Read a book', completed: false }
          ],
          additionalGratitude: [],
          additionalAchievements: [],
          completed: true
        },
        7: { // Reflection day for week 1
          dayNumber: 7,
          date: new Date().toISOString(),
          thoughtsCompleted: true,
          exerciseCompleted: true,
          audioCompleted: true,
          reflectionCompleted: true,
          gratitude: [],
          achievements: [],
          goals: [],
          additionalGratitude: [],
          additionalAchievements: [],
          completed: true
        },
        8: {
          dayNumber: 8,
          date: new Date().toISOString(),
          thoughtsCompleted: true,
          exerciseCompleted: false,
          audioCompleted: true,
          reflectionCompleted: false,
          gratitude: ['Morning coffee', '', ''],
          achievements: ['Started new project', '', ''],
          goals: [
            { text: 'Plan week', completed: true },
            { text: '', completed: false },
            { text: '', completed: false }
          ],
          additionalGratitude: [],
          additionalAchievements: [],
          completed: false
        }
      },
      weekReflections: {
        1: {
          weekNumber: 1,
          reflectionCompleted: true,
          gratitudeSelf: 'Proud of consistency',
          gratitudeOthers: 'Support from team',
          gratitudeWorld: 'Beautiful weather',
          achievements: ['Completed all tasks', 'Maintained exercise routine', 'Improved productivity'],
          improvements: ['Better time management', 'More focus', 'Regular breaks'],
          insights: ['Consistency is key', 'Small steps matter', 'Progress over perfection'],
          rules: ['Start day early', 'Exercise daily', 'Plan ahead'],
          exerciseCompleted: true,
          days: [],
          progress: 0
        },
        2: {
          weekNumber: 2,
          reflectionCompleted: false,
          gratitudeSelf: '',
          gratitudeOthers: 'Family support',
          gratitudeWorld: '',
          achievements: ['Started new project', '', ''],
          improvements: ['Need better planning', '', ''],
          insights: ['Take more initiative', '', ''],
          rules: ['Review goals daily', '', ''],
          exerciseCompleted: false,
          days: [],
          progress: 0
        }
      }
    };
  });

  useEffect(() => {
    storageUtils.set('progress', progress);
  }, [progress]);
  
  const updateDayProgress = async (dayNumber: number, data: Partial<Progress['days'][number]>) => {
    setProgress(prev => ({
        ...prev,
        days: {
          ...prev.days,
        [dayNumber]: {
          ...prev.days[dayNumber],
          ...data
        }
      }
    }));
  };

  const updateWeekReflection = async (weekNumber: number, data: Partial<Progress['weekReflections'][number]>) => {
    setProgress(prev => ({
      ...prev,
      weekReflections: {
        ...prev.weekReflections,
        [weekNumber]: {
          ...prev.weekReflections[weekNumber],
          ...data
        }
      }
    }));
  };

  const updateWeekProgress = async (weekNumber: number, data: Partial<WeekProgress>) => {
    setProgress(prev => ({
        ...prev,
        weekReflections: {
          ...prev.weekReflections,
        [weekNumber]: {
          ...prev.weekReflections[weekNumber],
          ...data
        }
      }
    }));
  };

  const isDayAccessible = (dayNumber: number): boolean => {
    return dayNumber <= progress.currentDay;
  };

  const isWeekAccessible = (weekNumber: number): boolean => {
    return weekNumber <= progress.currentWeek;
  };

  const isReflectionDay = (dayNumber: number): boolean => {
    return dayNumber % 7 === 0;
  };

  const getDayProgress = (dayNumber: number): number => {
    const day = progress.days[dayNumber];
    if (!day) return 0;

    let completedTasks = 0;
    let totalTasks = 0;

    // Check gratitude
    if (day.gratitude.length > 0) {
      totalTasks++;
      if (day.gratitude.every(item => item.trim() !== '')) {
        completedTasks++;
      }
    }

    // Check achievements
    if (day.achievements.length > 0) {
      totalTasks++;
      if (day.achievements.every(item => item.trim() !== '')) {
        completedTasks++;
      }
    }

    // Check goals
    if (day.goals.length > 0) {
      totalTasks++;
      if (day.goals.every(goal => goal.text.trim() !== '')) {
        completedTasks++;
      }
    }

    // Check exercise
    totalTasks++;
    if (day.exerciseCompleted) {
      completedTasks++;
    }

    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  };

  const getWeekProgress = (weekNumber: number): number => {
    const week = progress.weekReflections[weekNumber];
    if (!week) return 0;

    let completedTasks = 0;
    let totalTasks = 0;

    // Check gratitude
    if (week.gratitudeSelf && week.gratitudeOthers && week.gratitudeWorld) {
      totalTasks++;
      if (week.gratitudeSelf.trim() !== '' && 
          week.gratitudeOthers.trim() !== '' && 
          week.gratitudeWorld.trim() !== '') {
        completedTasks++;
      }
    }

    // Check achievements
    if (week.achievements.length > 0) {
      totalTasks++;
      if (week.achievements.every(item => item.trim() !== '')) {
        completedTasks++;
      }
    }

    // Check improvements
    if (week.improvements.length > 0) {
      totalTasks++;
      if (week.improvements.every(item => item.trim() !== '')) {
        completedTasks++;
      }
    }

    // Check insights
    if (week.insights.length > 0) {
      totalTasks++;
      if (week.insights.every(item => item.trim() !== '')) {
        completedTasks++;
      }
    }

    // Check rules
    if (week.rules.length > 0) {
      totalTasks++;
      if (week.rules.every(item => item.trim() !== '')) {
        completedTasks++;
      }
    }

    // Check exercise
    totalTasks++;
    if (week.exerciseCompleted) {
      completedTasks++;
    }

    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  };

  const getDayCompletion = (dayNumber: number): number => {
    const day = progress.days[dayNumber];
    if (!day) return 0;

    // Для дней рефлексии (7, 14, 21, 28)
    if (isReflectionDay(dayNumber)) {
      const weekNumber = Math.ceil(dayNumber / 7);
      const reflection = progress.weekReflections[weekNumber];
      if (!reflection) return 0;
      
      let completionPercentage = 0;

      // Благодарности (максимум 15%)
      const gratitudeCount = [
        reflection.gratitudeSelf,
        reflection.gratitudeOthers,
        reflection.gratitudeWorld
      ].filter(item => item.trim() !== '').length;
      completionPercentage += gratitudeCount * 5; // 5% за каждую благодарность

      // Достижения (максимум 15%)
      const achievementsCount = reflection.achievements.filter(item => item.trim() !== '').length;
      completionPercentage += achievementsCount * 5; // 5% за каждое достижение

      // Зоны роста (максимум 15%)
      const improvementsCount = reflection.improvements.filter(item => item.trim() !== '').length;
      completionPercentage += improvementsCount * 5; // 5% за каждую зону роста

      // Озарения (максимум 15%)
      const insightsCount = reflection.insights.filter(item => item.trim() !== '').length;
      completionPercentage += insightsCount * 5; // 5% за каждое озарение

      // Правила (максимум 30%)
      const rulesCount = reflection.rules.filter(item => item.trim() !== '').length;
      completionPercentage += rulesCount * 10; // 10% за каждое правило

      // Упражнение на осознанность (10%)
      if (reflection.exerciseCompleted) {
        completionPercentage += 10;
      }

      return Math.min(completionPercentage, 100);
    }

    // Для обычных дней - новая логика
    let completionPercentage = 0;
    
    // Благодарности (максимум 15%)
    const gratitudeCount = day.gratitude.filter(item => item.trim() !== '').length;
    completionPercentage += gratitudeCount * 5; // 5% за каждую благодарность
    
    // Достижения (максимум 15%)
    const achievementsCount = day.achievements.filter(item => item.trim() !== '').length;
    completionPercentage += achievementsCount * 5; // 5% за каждое достижение
    
    // Задачи (максимум 60%: 15% за заполнение + 45% за выполнение)
    day.goals.forEach(goal => {
      if (goal.text.trim() !== '') {
        completionPercentage += 5; // 5% за заполнение
        if (goal.completed) {
          completionPercentage += 15; // 15% за выполнение
        }
      }
    });
    
    // Упражнение (10%)
    if (day.exerciseCompleted) {
      completionPercentage += 10;
    }
    
    return Math.min(completionPercentage, 100);
  };

  const getReflectionDayWidgetProgress = (dayNumber: number) => {
    const weekNumber = Math.ceil(dayNumber / 7);
    const weekReflection = progress.weekReflections[weekNumber];
    
    if (!weekReflection) {
      return {
      gratitude: 0,
      achievements: 0,
      improvements: 0,
      insights: 0,
      rules: 0,
      exercise: 0
    };
    }

    return {
      gratitude: weekReflection.gratitudeSelf && weekReflection.gratitudeOthers && weekReflection.gratitudeWorld ? 100 : 0,
      achievements: weekReflection.achievements.filter(a => a.trim() !== '').length * (100 / 3),
      improvements: weekReflection.improvements.filter(i => i.trim() !== '').length * (100 / 3),
      insights: weekReflection.insights.filter(i => i.trim() !== '').length * (100 / 3),
      rules: weekReflection.rules.filter(r => r.trim() !== '').length * (100 / 3),
      exercise: weekReflection.exerciseCompleted ? 100 : 0
    };
  };

  const getDayWidgetProgress = (dayNumber: number) => {
    const day = progress.days[dayNumber];
    if (!day) {
      return {
        gratitude: 0,
        achievements: 0,
        goals: 0
      };
    }

    // Благодарности (каждая = 33.3%)
    const gratitudeProgress = day.gratitude.filter(item => item.trim() !== '').length * (100 / 3);

    // Достижения (каждое = 33.3%)
    const achievementsProgress = day.achievements.filter(item => item.trim() !== '').length * (100 / 3);

    // Задачи (заполнение = 10%, выполнение = 23.33%)
    let goalsProgress = 0;
    day.goals.forEach(goal => {
      if (goal.text.trim() !== '') {
        goalsProgress += 10; // 10% за заполнение
        if (goal.completed) {
          goalsProgress += 23.33; // 23.33% за выполнение
        }
      }
    });

    return {
      gratitude: Math.min(gratitudeProgress, 100),
      achievements: Math.min(achievementsProgress, 100),
      goals: Math.min(goalsProgress, 100)
    };
  };

  const weeks = Object.entries(progress.weekReflections).map(([weekNumber, data]) => ({
    ...data,
    weekNumber: parseInt(weekNumber, 10),
    progress: getWeekProgress(parseInt(weekNumber, 10)),
    days: Object.entries(progress.days)
      .filter(([dayNumber]) => Math.ceil(parseInt(dayNumber, 10) / 7) === parseInt(weekNumber, 10))
      .map(([_, dayData]) => dayData)
  }));

  const value = {
    progress,
    currentDay: progress.currentDay,
    currentWeek: progress.currentWeek,
    weeks,
    updateDayProgress,
    updateWeekReflection,
    updateWeekProgress,
    isDayAccessible,
    isWeekAccessible,
    isReflectionDay,
    getDayProgress,
    getWeekProgress,
    getDayCompletion,
    getReflectionDayWidgetProgress,
    getDayWidgetProgress
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
