/**
 * Custom hook for using the ContentService
 */

import { contentService } from '../services/ContentService';

export const useContentService = () => {
  const getDailyContent = (dayNumber: number) => {
    return contentService.getDailyContent(dayNumber);
  };

  const getStepAudioSrc = (dayNumber: number, stepNumber: number) => {
    return contentService.getStepAudioSrc(dayNumber, stepNumber);
  };

  const getMotivationalPhrase = (weekNumber: number) => {
    return contentService.getMotivationalPhrase(weekNumber);
  };

  const getDayTitle = (dayNumber: number) => {
    return contentService.getDayTitle(dayNumber);
  };

  const formatDate = (date: Date) => {
    return contentService.formatDate(date);
  };

  return {
    getDailyContent,
    getStepAudioSrc,
    getMotivationalPhrase,
    getDayTitle,
    formatDate
  };
};
