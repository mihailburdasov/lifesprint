import React from 'react';
import { DayProgress } from '../types/progress';
import { DailyContent } from '../types/dailyContent';
import { getDailyContent } from '../data/dailyContent';
import { dateUtils } from '../utils/dateUtils';
import { progressUtils } from '../utils/progressUtils';

interface CurrentDayWidgetProps {
  dayProgress: DayProgress;
  onUpdateProgress: (progress: DayProgress) => void;
}

const CurrentDayWidget: React.FC<CurrentDayWidgetProps> = ({ dayProgress, onUpdateProgress }) => {
  const dailyContent: DailyContent = getDailyContent(dayProgress.dayNumber);
  const progress = progressUtils.calculateDayProgress(dayProgress);
  const statusText = progressUtils.getProgressStatus(progress);

  const handleActivityComplete = (activity: keyof DayProgress) => {
    if (activity === 'dayNumber' || activity === 'date') return;
    
    const newProgress: DayProgress = {
      ...dayProgress,
      [activity]: true
    };
    onUpdateProgress(newProgress);
  };

  return (
    <div className="current-day-widget">
      <h2>День {dayProgress.dayNumber}</h2>
      <p className="thought">{dailyContent.thought.text}</p>
      {dailyContent.thought.author && (
        <p className="author">— {dailyContent.thought.author}</p>
      )}
      <div className="progress">
        <button
          className={`activity-button ${dayProgress.thoughtsCompleted ? 'completed' : ''}`}
          onClick={() => handleActivityComplete('thoughtsCompleted')}
        >
          Мысль дня
        </button>
        <button
          className={`activity-button ${dayProgress.exerciseCompleted ? 'completed' : ''}`}
          onClick={() => handleActivityComplete('exerciseCompleted')}
        >
          Упражнение
        </button>
        <button
          className={`activity-button ${dayProgress.audioCompleted ? 'completed' : ''}`}
          onClick={() => handleActivityComplete('audioCompleted')}
        >
          Аудио
        </button>
      </div>
      <div className="progress">
        <span className="text-gray-600">Today's Progress</span>
        <span className="font-semibold">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 rounded-full h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-600 mb-4">{statusText}</p>
    </div>
  );
};

export default CurrentDayWidget;