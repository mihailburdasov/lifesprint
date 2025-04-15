/**
 * Service for managing user progress data
 */

import { DayProgress, WeekReflection, UserProgress } from '../types/progress';

/**
 * Default empty day progress
 */
export const defaultDayProgress: DayProgress = {
  completed: false,
  gratitude: ['', '', ''],
  achievements: ['', '', ''],
  goals: [
    { text: '', completed: false },
    { text: '', completed: false },
    { text: '', completed: false }
  ],
  exerciseCompleted: false,
  withAudio: false
};

/**
 * Default empty week reflection
 */
export const defaultWeekReflection: WeekReflection = {
  gratitudeSelf: '',
  gratitudeOthers: '',
  gratitudeWorld: '',
  achievements: ['', '', ''],
  improvements: ['', '', ''],
  insights: ['', '', ''],
  rules: ['', '', ''],
  exerciseCompleted: false,
  withAudio: false
};

/**
 * Class for managing user progress
 */
export class ProgressService {
  private readonly storageKey = 'lifesprint_progress';

  /**
   * Load progress from localStorage
   */
  loadProgress(): UserProgress {
    try {
      const savedProgress = localStorage.getItem(this.storageKey);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        
        // Update currentDay based on the current date
        const startDate = new Date(progress.startDate);
        const today = new Date();
        
        // Check if the current date is within the sprint
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const sprintYear = startDate.getFullYear();
        const sprintMonth = startDate.getMonth();
        
        if (currentYear === sprintYear && currentMonth === sprintMonth) {
          // Standard calculation for the current month of the sprint
          const diffTime = today.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          progress.currentDay = Math.min(Math.max(diffDays, 1), 31);
        } else {
          // If we are in a different month or year
          progress.currentDay = Math.min(today.getDate(), 31);
        }
        
        return progress;
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
    
    return this.createDefaultProgress();
  }

  /**
   * Save progress to localStorage
   */
  saveProgress(progress: UserProgress): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  /**
   * Create default progress object
   */
  createDefaultProgress(): UserProgress {
    const startDate = this.getCurrentMonthSprintStart();
    const today = new Date();
    
    // Проверяем, находится ли текущая дата в пределах спринта
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const sprintYear = startDate.getFullYear();
    const sprintMonth = startDate.getMonth();
    
    let currentDay;
    
    // Если текущий год и месяц совпадают с годом и месяцем спринта (апрель текущего года)
    if (currentYear === sprintYear && currentMonth === sprintMonth) {
      // Стандартный расчет для текущего месяца спринта
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      currentDay = Math.min(Math.max(diffDays, 1), 31);
    } else {
      // Если мы находимся в другом месяце или году
      // Используем текущий день месяца как номер дня спринта, но не больше 31
      currentDay = Math.min(today.getDate(), 31);
    }
    
    return {
      currentDay,
      days: {},
      weekReflections: {},
      completedDays: 0,
      totalDays: 31,
      startDate: startDate.toISOString()
    };
  }

  /**
   * Get the start date of the current month's sprint (April 1st)
   */
  getCurrentMonthSprintStart(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), 3, 1); // Month is 0-indexed, so 3 is April
  }

  /**
   * Update day progress
   */
  updateDayProgress(progress: UserProgress, dayNumber: number, data: Partial<DayProgress>): UserProgress {
    const currentDayProgress = progress.days[dayNumber] || { ...defaultDayProgress };
    const updatedDayProgress = { ...currentDayProgress, ...data };
    
    const newProgress = {
      ...progress,
      days: {
        ...progress.days,
        [dayNumber]: updatedDayProgress
      }
    };
    
    this.saveProgress(newProgress);
    return newProgress;
  }

  /**
   * Update week reflection
   */
  updateWeekReflection(progress: UserProgress, weekNumber: number, data: Partial<WeekReflection>): UserProgress {
    console.log('Updating week reflection:', { weekNumber, data });
    const currentReflection = progress.weekReflections[weekNumber] || { ...defaultWeekReflection };
    console.log('Current reflection:', currentReflection);
    const updatedReflection = { ...currentReflection, ...data };
    console.log('Updated reflection:', updatedReflection);
    
    const newProgress = {
      ...progress,
      weekReflections: {
        ...progress.weekReflections,
        [weekNumber]: updatedReflection
      }
    };
    
    console.log('Saving new progress:', newProgress);
    this.saveProgress(newProgress);
    return newProgress;
  }

  /**
   * Calculate day completion percentage
   */
  getDayCompletion(progress: UserProgress, dayNumber: number): number {
    const dayProgress = progress.days[dayNumber];

    // For regular days
    if (!this.isReflectionDay(dayNumber)) {
      // Check if dayProgress exists
      if (!dayProgress) {
        console.log(`No day progress data found for day ${dayNumber}`);
        return 0;
      }
      
      let total = 0;
      
      // Check gratitude (15% total, 5% each)
      const gratitudeFilled = dayProgress.gratitude.filter(g => g.trim() !== '').length;
      total += gratitudeFilled * 5; // 5% for each gratitude
      
      // Check achievements (15% total, 5% each)
      const achievementsFilled = dayProgress.achievements.filter(a => a.trim() !== '').length;
      total += achievementsFilled * 5; // 5% for each achievement
      
      // Check goals/tasks (15% for filling + 45% for completing)
      const goalsFilled = dayProgress.goals.filter(g => g.text.trim() !== '').length;
      total += goalsFilled * 5; // 5% for each task filled (max 15%)
      
      // Check completed tasks (15% for each completed task)
      const goalsCompleted = dayProgress.goals.filter(g => g.completed).length;
      total += goalsCompleted * 15; // 15% for each completed task (max 45%)
      
      // Check mindfulness exercise completion (10%)
      if (dayProgress.exerciseCompleted) {
        total += 10; // 10% for completing the exercise
      }
      
      // Cap at 100%
      total = Math.min(total, 100);
      
      // Log the calculation details
      console.log(`Regular day ${dayNumber} completion details:
        - Gratitude filled: ${gratitudeFilled} (${gratitudeFilled * 5}%)
        - Achievements filled: ${achievementsFilled} (${achievementsFilled * 5}%)
        - Goals filled: ${goalsFilled} (${goalsFilled * 5}%)
        - Goals completed: ${goalsCompleted} (${goalsCompleted * 15}%)
        - Exercise completed: ${dayProgress.exerciseCompleted ? 'yes (10%)' : 'no (0%)'}
        - Total before cap: ${total}%`);
      
      // Round to nearest integer
      const finalTotal = Math.round(total);
      console.log('Final total after cap and rounding:', finalTotal);
      
      return finalTotal;
    } 
    // For reflection days
    else {
      const weekNumber = Math.ceil(dayNumber / 7);
      console.log('Calculating completion for day:', dayNumber);
      console.log('Week number:', weekNumber);
      const reflection = progress.weekReflections[weekNumber];
      console.log('Reflection data:', reflection);
      
      if (!reflection) {
        console.log(`No reflection data found for day ${dayNumber}, week ${weekNumber}`);
        return 0;
      }
      
      let total = 0;
      
      // Check gratitude (15% total, 5% each)
      let gratitudeCount = 0;
      if (reflection.gratitudeSelf.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeOthers.trim() !== '') gratitudeCount++;
      if (reflection.gratitudeWorld.trim() !== '') gratitudeCount++;
      total += gratitudeCount * 5; // 5% for each gratitude
      
      // Check achievements (15% total, 5% each)
      const achievementsFilled = reflection.achievements.filter(a => a.trim() !== '').length;
      total += achievementsFilled * 5; // 5% for each achievement
      
      // Check improvements (15% total, 5% each)
      const improvementsFilled = reflection.improvements.filter(i => i.trim() !== '').length;
      total += improvementsFilled * 5; // 5% for each improvement
      
      // Check insights (15% total, 5% each)
      const insightsFilled = reflection.insights.filter(i => i.trim() !== '').length;
      total += insightsFilled * 5; // 5% for each insight
      
      // Check rules (30% total, 10% each)
      const rulesFilled = reflection.rules.filter(r => r.trim() !== '').length;
      total += rulesFilled * 10; // 10% for each rule
      
      // Check mindfulness exercise completion (10%)
      if (reflection.exerciseCompleted) {
        total += 10; // 10% for completing the exercise
      }
      
      console.log(`Reflection day ${dayNumber} completion details:
        - Gratitude count: ${gratitudeCount} (${gratitudeCount * 5}%)
        - Achievements filled: ${achievementsFilled} (${achievementsFilled * 5}%)
        - Improvements filled: ${improvementsFilled} (${improvementsFilled * 5}%)
        - Insights filled: ${insightsFilled} (${insightsFilled * 5}%)
        - Rules filled: ${rulesFilled} (${rulesFilled * 10}%)
        - Exercise completed: ${reflection.exerciseCompleted ? 'yes (10%)' : 'no (0%)'}
        - Total before cap: ${total}%`);
      
      // Cap at 100%
      total = Math.min(total, 100);
      
      // Round to nearest integer
      const finalTotal = Math.round(total);
      console.log('Final total after cap and rounding:', finalTotal);
      
      return finalTotal;
    }
  }

  /**
   * Check if a day is a reflection day
   */
  isReflectionDay(dayNumber: number): boolean {
    return dayNumber % 7 === 0;
  }

  /**
   * Check if a day is accessible
   */
  isDayAccessible(dayNumber: number): boolean {
    return true; // All days are accessible
  }

  /**
   * Check if a week is accessible
   */
  isWeekAccessible(weekNumber: number): boolean {
    return true; // All weeks are accessible
  }

  /**
   * Check if all tasks in a day are completed or empty
   */
  areTasksCompleted(progress: UserProgress, dayNumber: number): boolean {
    // Check if progress.days[dayNumber] exists, if not, use default empty goals
    const dayProgress = progress.days[dayNumber] || { 
      goals: [
        { text: '', completed: false },
        { text: '', completed: false },
        { text: '', completed: false }
      ]
    };
    
    // Log for debugging
    console.log(`Checking tasks completion for day ${dayNumber}:`, dayProgress.goals);
    
    // Check if all tasks are either empty or completed
    const allTasksCompletedOrEmpty = dayProgress.goals.every(goal => 
      goal.text.trim() === '' || goal.completed
    );
    
    console.log(`All tasks completed or empty for day ${dayNumber}: ${allTasksCompletedOrEmpty}`);
    
    return allTasksCompletedOrEmpty;
  }

  /**
   * Update the current day based on the current date
   */
  updateCurrentDay(progress: UserProgress): UserProgress {
    const startDate = new Date(progress.startDate);
    const today = new Date();
    
    // Check if the current date is within the sprint
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const sprintYear = startDate.getFullYear();
    const sprintMonth = startDate.getMonth();
    
    let currentDay = progress.currentDay;
    
    if (currentYear === sprintYear && currentMonth === sprintMonth) {
      // Standard calculation for the current month of the sprint
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      currentDay = Math.min(Math.max(diffDays, 1), 31);
    } else {
      // If we are in a different month or year
      currentDay = Math.min(today.getDate(), 31);
    }
    
    if (currentDay !== progress.currentDay) {
      console.log(`Updating current day from ${progress.currentDay} to ${currentDay}`);
      const updatedProgress = { ...progress, currentDay };
      this.saveProgress(updatedProgress);
      return updatedProgress;
    }
    
    return progress;
  }
}

// Export a singleton instance
export const progressService = new ProgressService();
