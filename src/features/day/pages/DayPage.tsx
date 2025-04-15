import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '../../../features/dashboard/components';
import { AudioPlayer, Button } from '../../../core/components';
import { useProgress } from '../context';
import { FaLock } from 'react-icons/fa';
import { getDailyContent, getMotivationalPhrase } from '../../../data/dailyContent';
import { useContentService } from '../hooks/useContentService';

interface DayParams {
  dayNumber: string;
  [key: string]: string;
}

const DayPage: React.FC = () => {
  const { dayNumber: dayNumberParam } = useParams<DayParams>();
  const navigate = useNavigate();
  const { progress, updateDayProgress, updateWeekReflection, isReflectionDay: checkReflectionDay, getDayCompletion, isDayAccessible } = useProgress();
  const { formatDate, getDayTitle } = useContentService();
  
  // Add a counter to force re-render when reflection data changes
  const [updateCounter, setUpdateCounter] = useState(0);
  
  const dayNumber = parseInt(dayNumberParam || '1', 10);
  const isReflection = checkReflectionDay(dayNumber);
  const weekNumber = Math.ceil(dayNumber / 7);
  const isAccessible = isDayAccessible(dayNumber);
  
  // Get day date
  const dayDate = new Date(progress.startDate);
  dayDate.setDate(dayDate.getDate() + dayNumber - 1);
  
  // Get day data
  const dayData = progress.days[dayNumber] || {
    completed: false,
    gratitude: ['', '', ''],
    achievements: ['', '', ''],
    goals: [
      { text: '', completed: false },
      { text: '', completed: false },
      { text: '', completed: false }
    ],
    exerciseCompleted: false
  };
  
  // Get week reflection data if it's a reflection day
  const reflectionData = isReflection ? (progress.weekReflections[weekNumber] || {
    gratitudeSelf: '',
    gratitudeOthers: '',
    gratitudeWorld: '',
    achievements: ['', '', ''],
    improvements: ['', '', ''],
    insights: ['', '', ''],
    rules: ['', '', ''],
    exerciseCompleted: false
  }) : null;
  
  // Handle navigation to previous/next day
  const goToPreviousDay = () => {
    if (dayNumber > 1) {
      navigate(`/day/${dayNumber - 1}`);
    }
  };
  
  const goToNextDay = () => {
    if (dayNumber < 31) {
      navigate(`/day/${dayNumber + 1}`);
    }
  };
  
  // Handle regular day input changes
  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitude = [...dayData.gratitude];
    newGratitude[index] = value;
    updateDayProgress(dayNumber, { gratitude: newGratitude });
  };
  
  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...dayData.achievements];
    newAchievements[index] = value;
    updateDayProgress(dayNumber, { achievements: newAchievements });
  };
  
  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...dayData.goals];
    newGoals[index] = { ...newGoals[index], text: value };
    updateDayProgress(dayNumber, { goals: newGoals });
  };
  
  const handleGoalToggle = (index: number) => {
    const newGoals = [...dayData.goals];
    newGoals[index] = { ...newGoals[index], completed: !newGoals[index].completed };
    updateDayProgress(dayNumber, { goals: newGoals });
  };
  
  const handleExerciseComplete = () => {
    updateDayProgress(dayNumber, { exerciseCompleted: !dayData.exerciseCompleted });
  };
  
  // Handle reflection day input changes
  const handleReflectionGratitudeChange = (type: 'self' | 'others' | 'world', value: string) => {
    if (!reflectionData) return;
    
    if (type === 'self') {
      updateWeekReflection(weekNumber, { gratitudeSelf: value });
      setUpdateCounter(prev => prev + 1); // Force re-render
    } else if (type === 'others') {
      updateWeekReflection(weekNumber, { gratitudeOthers: value });
      setUpdateCounter(prev => prev + 1); // Force re-render
    } else if (type === 'world') {
      updateWeekReflection(weekNumber, { gratitudeWorld: value });
      setUpdateCounter(prev => prev + 1); // Force re-render
    }
  };
  
  const handleReflectionAchievementChange = (index: number, value: string) => {
    if (!reflectionData) return;
    
    const newAchievements = [...reflectionData.achievements];
    newAchievements[index] = value;
    updateWeekReflection(weekNumber, { achievements: newAchievements });
    setUpdateCounter(prev => prev + 1); // Force re-render
  };
  
  const handleReflectionImprovementChange = (index: number, value: string) => {
    if (!reflectionData) return;
    
    const newImprovements = [...reflectionData.improvements];
    newImprovements[index] = value;
    updateWeekReflection(weekNumber, { improvements: newImprovements });
    setUpdateCounter(prev => prev + 1); // Force re-render
  };
  
  const handleReflectionInsightChange = (index: number, value: string) => {
    if (!reflectionData) return;
    
    const newInsights = [...reflectionData.insights];
    newInsights[index] = value;
    updateWeekReflection(weekNumber, { insights: newInsights });
    setUpdateCounter(prev => prev + 1); // Force re-render
  };
  
  const handleReflectionRuleChange = (index: number, value: string) => {
    if (!reflectionData) return;
    
    const newRules = [...reflectionData.rules];
    newRules[index] = value;
    updateWeekReflection(weekNumber, { rules: newRules });
    setUpdateCounter(prev => prev + 1); // Force re-render
  };
  
  const handleReflectionExerciseComplete = () => {
    if (!reflectionData) return;
    
    updateWeekReflection(weekNumber, { exerciseCompleted: !reflectionData.exerciseCompleted });
    setUpdateCounter(prev => prev + 1); // Force re-render
  };
  
  // Get daily content
  const dailyContent = getDailyContent(dayNumber);
  
  // Render regular day content
  const renderRegularDayContent = () => {
    return (
      <div className="day-content space-y-6 sm:space-y-8">
        {/* Thought of the day */}
        <div className="thought-of-day">
          <h3 className="text-base sm:text-lg font-medium mb-2">
            {dailyContent.thought.author 
              ? `#мысльдня от ${dailyContent.thought.author}:` 
              : '#мысльдня'}
          </h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md italic text-sm sm:text-base">
            {dailyContent.thought.text}
          </div>
        </div>
        
        {/* Gratitude Journal */}
        <div className="gratitude-journal">
          <h3 className="text-base sm:text-lg font-medium mb-2">Дневник благодарностей</h3>
          <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
            За что я чувствую благодарность в своей жизни за последние 24 часа?
          </p>
          
          <div className="space-y-3">
            {dayData.gratitude.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2">🙏</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleGratitudeChange(index, e.target.value)}
                  placeholder="Я благодарю за"
                  className="input flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Achievements */}
        <div className="achievements">
          <h3 className="text-base sm:text-lg font-medium mb-2">Копилка достижений</h3>
          <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
            Какими достижениями я могу гордиться за последние 24 часа?
          </p>
          
          <div className="space-y-3">
            {dayData.achievements.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2">😎</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleAchievementChange(index, e.target.value)}
                  placeholder="Я горжусь собой"
                  className="input flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Goals */}
        <div className="goals">
          <h3 className="text-base sm:text-lg font-medium mb-2">Целеполагание</h3>
          <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
            Какие задачи я поставлю перед собой на день?
          </p>
          
          <div className="space-y-3">
            {dayData.goals.map((goal, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => handleGoalToggle(index)}
                  className="checkbox mr-3"
                />
                <input
                  type="text"
                  value={goal.text}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                  placeholder={`Моя ${index + 1} задача`}
                  className="input flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Exercise */}
        <div className="exercise">
          <h3 className="text-base sm:text-lg font-medium mb-2">#упражнение_на_осознанность</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md mb-3 text-sm sm:text-base">
            {dailyContent.exercise}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={dayData.exerciseCompleted}
              onChange={handleExerciseComplete}
              className="checkbox mr-3"
            />
            <span>Я выполнил(а) упражнение</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Render reflection day content
  const renderReflectionDayContent = () => {
    if (!reflectionData) return null;
    
    return (
      <div className="reflection-content space-y-6 sm:space-y-8">
        {/* Thought of the day */}
        <div className="thought-of-day">
          <h3 className="text-base sm:text-lg font-medium mb-2">
            {dailyContent.thought.author 
              ? `#мысльдня от ${dailyContent.thought.author}:` 
              : '#мысльдня'}
          </h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md italic text-sm sm:text-base">
            {dailyContent.thought.text}
          </div>
        </div>
        
        {/* Gratitude Journal */}
        <div className="gratitude-journal">
          <h3 className="text-base sm:text-lg font-medium mb-2">Дневник благодарностей</h3>
          <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
            За что на этой неделе я благодарен себе, окружающим, миру?
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="mr-2">🙏</span>
              <input
                type="text"
                value={reflectionData.gratitudeSelf}
                onChange={(e) => handleReflectionGratitudeChange('self', e.target.value)}
                placeholder="Я благодарю себя за"
                className="input flex-1"
              />
            </div>
            <div className="flex items-center">
              <span className="mr-2">🙏</span>
              <input
                type="text"
                value={reflectionData.gratitudeOthers}
                onChange={(e) => handleReflectionGratitudeChange('others', e.target.value)}
                placeholder="Я благодарю окружающих за"
                className="input flex-1"
              />
            </div>
            <div className="flex items-center">
              <span className="mr-2">🙏</span>
              <input
                type="text"
                value={reflectionData.gratitudeWorld}
                onChange={(e) => handleReflectionGratitudeChange('world', e.target.value)}
                placeholder="Я благодарю мир за"
                className="input flex-1"
              />
            </div>
          </div>
        </div>
        
        {/* Weekly Results */}
        <div className="weekly-results">
          <h3 className="text-base sm:text-lg font-medium mb-2">Мои достижения</h3>
          <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
            Что у меня получилось на этой неделе?
          </p>
          
          <div className="space-y-3 mb-6">
            {reflectionData.achievements.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2 text-green-500">✓</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleReflectionAchievementChange(index, e.target.value)}
                  placeholder={`Достижение ${index + 1}`}
                  className="input flex-1"
                />
              </div>
            ))}
          </div>
          
          <h3 className="text-base sm:text-lg font-medium mb-2">Моя зона роста</h3>
          <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
            Что я могу сделать лучше в следующий раз?
          </p>
          
          <div className="space-y-3">
            {reflectionData.improvements.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2 text-red-500">?</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleReflectionImprovementChange(index, e.target.value)}
                  placeholder={`Улучшение ${index + 1}`}
                  className="input flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Insights */}
        <div className="insights">
          <h3 className="text-base sm:text-lg font-medium mb-2">Мои озарения</h3>
          <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
            Какие уроки я получил из событий (успехов, ошибок, бездействия)?
          </p>
          
          <div className="space-y-3">
            {reflectionData.insights.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2 text-primary">!</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleReflectionInsightChange(index, e.target.value)}
                  placeholder={`Озарение ${index + 1}`}
                  className="input flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Updated Rules */}
        <div className="rules">
          <h3 className="text-base sm:text-lg font-medium mb-2">Обновляем правила игры</h3>
          <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
            Что я улучшу в себе или своём подходе на следующую неделю?
          </p>
          
          <div className="space-y-3">
            {reflectionData.rules.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2 text-blue-500">📘</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleReflectionRuleChange(index, e.target.value)}
                  placeholder={`Правило ${index + 1}`}
                  className="input flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Exercise */}
        <div className="exercise">
          <h3 className="text-base sm:text-lg font-medium mb-2">#упражнение</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md mb-3 text-sm sm:text-base">
            {dailyContent.exercise}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={reflectionData.exerciseCompleted}
              onChange={handleReflectionExerciseComplete}
              className="checkbox mr-3"
            />
            <span>Я выполнил(а) упражнение</span>
          </div>
        </div>
        
        {/* Motivational Phrase */}
        <div className="motivational-phrase text-center py-4">
          <h3 className="text-lg sm:text-xl font-bold text-primary">{getMotivationalPhrase(weekNumber)}</h3>
        </div>
      </div>
    );
  };
  
  // Check if this is a bonus day (days 29-31)
  const isBonusDay = dayNumber >= 29 && dayNumber <= 31;
  
  // Render bonus day content
  const renderBonusDayContent = () => {
    return (
      <div className="bonus-day-content flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Скоро тут будет интересно</h2>
        <p className="text-lg text-text-light-light dark:text-text-light-dark mb-8">
          Бонусный контент находится в разработке и скоро будет доступен.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">
            Вернуться на главную
          </Button>
        </Link>
      </div>
    );
  };

  // Render access denied content
  const renderAccessDeniedContent = () => {
    return (
      <div className="access-denied flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 text-gray-400">
          <FaLock size={64} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">В данное время у вас нет доступа</h2>
        <p className="text-lg text-text-light-light dark:text-text-light-dark mb-8">
          Этот контент будет доступен позже.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">
            Вернуться на главную
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="day-page flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <div className="content flex-1 md:ml-64 p-3 sm:p-4 md:p-6 pt-20 md:pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          {dayNumber > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToPreviousDay}
              className="w-full sm:w-auto"
            >
              Пред. день
            </Button>
          )}
          
          <div className="flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-center">
              {isBonusDay ? `Бонусный день ${dayNumber - 28}` : `День ${dayNumber}: ${getDayTitle(dayNumber)}`}
              <span className="block text-base sm:text-lg font-normal text-text-light-light dark:text-text-light-dark">
                ({formatDate(dayDate)})
              </span>
            </h1>
            
            <div className="mt-2 flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                {(() => {
                  const dayCompletion = getDayCompletion(dayNumber);
                  console.log(`Day ${dayNumber} completion: ${dayCompletion}%`);
                  return (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        background: `conic-gradient(#4F46E5 ${dayCompletion}%, #f3f4f6 0)`,
                        color: dayCompletion > 50 ? 'white' : 'inherit'
                      }}
                    >
                      {dayCompletion}%
                    </div>
                  );
                })()}
              </div>
              <div className="text-sm text-text-light-light dark:text-text-light-dark">
                Прогресс дня
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToNextDay}
            disabled={dayNumber >= 31}
            className="w-full sm:w-auto"
          >
            След. день
          </Button>
        </div>
        
        <div className="audio-player-container mb-4 sm:mb-6">
          <AudioPlayer 
            src={dailyContent.audioSrc} 
            className="w-full"
          />
        </div>
        
        {isReflection ? renderReflectionDayContent() : renderRegularDayContent()}
        
        {/* Show "Go to Main" button only when the day is filled */}
        {((isReflection && reflectionData && 
           reflectionData.gratitudeSelf && 
           reflectionData.gratitudeOthers && 
           reflectionData.gratitudeWorld && 
           reflectionData.achievements.some(a => a) && 
           reflectionData.improvements.some(i => i) && 
           reflectionData.insights.some(i => i) && 
           reflectionData.rules.some(r => r)) || 
          (!isReflection && 
           dayData.gratitude.some(g => g) && 
           dayData.achievements.some(a => a) && 
           dayData.goals.some(g => g.text))) && (
          <div className="mt-8 text-center">
            <Link to="/">
              <Button variant="outline">
                Перейти на главную
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayPage;
