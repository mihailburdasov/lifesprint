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
    1: 'Плавный старт',
    2: 'Закрепляем',
    3: 'Продолжаем!',
    4: 'Продолжаем!',
    5: 'Продолжаем!',
    6: 'Продолжаем!',
    7: 'Итоги первой недели',
    8: 'Новый виток!',
    9: 'Хочу!',
    10: 'Могу!',
    11: 'Вперёд!',
    12: 'Иду!',
    13: 'ЙЕХУУУ!',
    14: 'Итоги второй недели',
    15: 'Новый виток!',
    16: 'Я молодец!',
    17: 'Всё отлично!',
    18: 'Ого-го!',
    19: 'Получается',
    20: 'Молодец!',
    21: 'Итоги третьей недели',
    22: 'Бонусный виток!',
    23: 'Расслабься :)',
    24: 'Дыши',
    25: 'Чувствуй',
    26: 'Прислушайся',
    27: 'Столько мыслей',
    28: 'Итоги четвёртой недели',
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
