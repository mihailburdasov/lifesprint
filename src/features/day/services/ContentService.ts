/**
 * Service for managing content data
 * Will be implemented later
 */

import { DailyContent } from '../types/progress';

/**
 * Class for managing content
 */
export class ContentService {
  /**
   * Day titles mapping
   * @private
   */
  private dayTitles: Record<number, string> = {
    1: 'Сила',
    2: 'Возможности',
    3: 'Благодарность',
    4: 'Цели',
    5: 'Достижения',
    6: 'Практика',
    7: 'Рефлексия',
    8: 'Горизонты',
    9: 'Внимательность',
    10: 'Энергия',
    11: 'Фокус',
    12: 'Баланс',
    13: 'Рост',
    14: 'Рефлексия',
    15: 'Преодоление',
    16: 'Радость',
    17: 'Уверенность',
    18: 'Творчество',
    19: 'Связь',
    20: 'Гармония',
    21: 'Рефлексия',
    22: 'Интеграция',
    23: 'Мудрость',
    24: 'Принятие',
    25: 'Видение',
    26: 'Действие',
    27: 'Празднование',
    28: 'Рефлексия',
    29: 'Подготовка',
    30: 'Завершение',
    31: 'Итоги'
  };
  /**
   * Get daily content
   */
  getDailyContent(dayNumber: number): DailyContent {
    // Placeholder implementation
    return {
      thought: {
        text: 'Placeholder thought',
        author: 'Author'
      },
      exercise: 'Placeholder exercise',
      withAudio: false
    };
  }

  /**
   * Get step audio source
   */
  getStepAudioSrc(dayNumber: number, stepNumber: number): string {
    // Placeholder implementation
    return `/audio/day${dayNumber}${stepNumber > 1 ? `-${stepNumber}` : ''}.mp3`;
  }

  /**
   * Get motivational phrase
   */
  getMotivationalPhrase(weekNumber: number): string {
    // Placeholder implementation
    return `Мотивационная фраза для недели ${weekNumber}`;
  }

  /**
   * Get day title
   */
  getDayTitle(dayNumber: number): string {
    // Return the day title from the mapping or a default value if not found
    return this.dayTitles[dayNumber] || `День ${dayNumber}`;
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    // Форматирование даты без года, только день и месяц
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
  }
}

// Export a singleton instance
export const contentService = new ContentService();
