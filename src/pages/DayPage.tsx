import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useTheme } from '../context/ThemeContext';
import { formatDate, getDayTitle } from '../utils/dateUtils';
import { getDailyContent, getMotivationalPhrase } from '../data/dailyContent';
import { FaLock } from 'react-icons/fa';
import useInputFocus from '../hooks/useInputFocus';
import Sidebar from '../components/layout/Sidebar';
import AudioPlayer from '../components/common/AudioPlayer';
import Button from '../components/common/Button';

interface DayParams {
  dayId: string;
  [key: string]: string;
}

const DayPage: React.FC = () => {
  const { dayId } = useParams<DayParams>();
  const navigate = useNavigate();
  const { progress, updateDayProgress, updateWeekReflection, isReflectionDay: checkReflectionDay, getDayCompletion, isDayAccessible } = useProgress();
  const { theme } = useTheme();
  
  // Используем хук для предотвращения перекрытия полей ввода мобильной клавиатурой
  useInputFocus();
  
  const dayNumber = parseInt(dayId || '1', 10);
  const isReflection = checkReflectionDay(dayNumber);
  const weekNumber = Math.ceil(dayNumber / 7);
  
  // Get day date
  const dayDate = new Date(progress.startDate);
  dayDate.setDate(dayDate.getDate() + dayNumber - 1);
  
  // Get day data
  const dayData = progress.days[dayNumber] || {
    completed: false,
    gratitude: [
      'Я благодарю за',
      'Я благодарю за',
      'Я благодарю за'
    ],
    achievements: [
      'Я горжусь тем, что',
      'Я горжусь тем, что',
      'Я горжусь тем, что'
    ],
    goals: [
      { text: '', completed: false },
      { text: '', completed: false },
      { text: '', completed: false }
    ],
    additionalGratitude: [],
    additionalAchievements: [],
    exerciseCompleted: false,
    thoughtsCompleted: false,
    audioCompleted: false,
    reflectionCompleted: false
  };
  
  // Get week reflection data if it's a reflection day
  const reflectionData = isReflection ? (progress.weekReflections[weekNumber] || {
    gratitudeSelf: 'Я благодарю себя за',
    gratitudeOthers: 'Я благодарю окружающих за',
    gratitudeWorld: 'Я благодарю мир за',
    achievements: [
      'Я горжусь тем, что',
      'Я горжусь тем, что',
      'Я горжусь тем, что'
    ],
    improvements: ['', '', ''],
    insights: ['', '', ''],
    rules: ['', '', ''],
    exerciseCompleted: false
  }) : null;
  
  // State for additional gratitude and achievement fields
  const isCurrentDay = dayNumber === progress.currentDay;
  const [additionalGratitude, setAdditionalGratitude] = useState<string[]>(
    dayData.additionalGratitude || []
  );
  const [additionalAchievements, setAdditionalAchievements] = useState<string[]>(
    dayData.additionalAchievements || []
  );
  
  // State to track button active states
  const [isPrevButtonActive, setIsPrevButtonActive] = useState(false);
  const [isNextButtonActive, setIsNextButtonActive] = useState(false);
  
  // References to store timeout IDs
  const prevButtonTimeoutRef = useRef<number | null>(null);
  const nextButtonTimeoutRef = useRef<number | null>(null);
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (prevButtonTimeoutRef.current) {
        window.clearTimeout(prevButtonTimeoutRef.current);
      }
      if (nextButtonTimeoutRef.current) {
        window.clearTimeout(nextButtonTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle navigation to previous/next day
  const goToPreviousDay = () => {
    if (dayNumber > 1) {
      if (prevButtonTimeoutRef.current) {
        window.clearTimeout(prevButtonTimeoutRef.current);
      }
      
      setIsPrevButtonActive(true);
      navigate(`/day/${dayNumber - 1}`);
      
      const timeoutId = window.setTimeout(() => {
        setIsPrevButtonActive(false);
        prevButtonTimeoutRef.current = null;
      }, 150);
      
      prevButtonTimeoutRef.current = timeoutId;
    }
  };
  
  const goToNextDay = () => {
    if (dayNumber < 28) {
      if (nextButtonTimeoutRef.current) {
        window.clearTimeout(nextButtonTimeoutRef.current);
      }
      
      setIsNextButtonActive(true);
      navigate(`/day/${dayNumber + 1}`);
      
      const timeoutId = window.setTimeout(() => {
        setIsNextButtonActive(false);
        nextButtonTimeoutRef.current = null;
      }, 150);
      
      nextButtonTimeoutRef.current = timeoutId;
    }
  };
  
  // Handle regular day input changes
  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitude = [...dayData.gratitude];
    newGratitude[index] = value;
    updateDayProgress(dayNumber, { gratitude: newGratitude });
  };
  
  const handleAdditionalGratitudeChange = (index: number, value: string) => {
    const newAdditionalGratitude = [...additionalGratitude];
    newAdditionalGratitude[index] = value;
    setAdditionalGratitude(newAdditionalGratitude);
    updateDayProgress(dayNumber, { additionalGratitude: newAdditionalGratitude });
  };
  
  const addGratitudeField = () => {
    if (additionalGratitude.length < 4) {
      const newAdditionalGratitude = [...additionalGratitude, ''];
      setAdditionalGratitude(newAdditionalGratitude);
      updateDayProgress(dayNumber, { additionalGratitude: newAdditionalGratitude });
    }
  };
  
  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...dayData.achievements];
    newAchievements[index] = value;
    updateDayProgress(dayNumber, { achievements: newAchievements });
  };
  
  const handleAdditionalAchievementChange = (index: number, value: string) => {
    const newAdditionalAchievements = [...additionalAchievements];
    newAdditionalAchievements[index] = value;
    setAdditionalAchievements(newAdditionalAchievements);
    updateDayProgress(dayNumber, { additionalAchievements: newAdditionalAchievements });
  };
  
  const addAchievementField = () => {
    if (additionalAchievements.length < 4) {
      const newAdditionalAchievements = [...additionalAchievements, ''];
      setAdditionalAchievements(newAdditionalAchievements);
      updateDayProgress(dayNumber, { additionalAchievements: newAdditionalAchievements });
    }
  };
  
  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...dayData.goals];
    newGoals[index] = { ...newGoals[index], text: value };
    updateDayProgress(dayNumber, { goals: newGoals });
  };
  
  const handleGoalToggle = (index: number) => {
    if (!dayData.goals[index].text.trim()) {
      alert('Пожалуйста, заполните задачу перед тем, как отметить её выполненной.');
      return;
    }
    
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
    } else if (type === 'others') {
      updateWeekReflection(weekNumber, { gratitudeOthers: value });
    } else if (type === 'world') {
      updateWeekReflection(weekNumber, { gratitudeWorld: value });
    }
  };
  
  const handleReflectionAchievementChange = (index: number, value: string) => {
    if (!reflectionData) return;
    
    const newAchievements = [...reflectionData.achievements];
    newAchievements[index] = value;
    updateWeekReflection(weekNumber, { achievements: newAchievements });
  };
  
  const handleReflectionImprovementChange = (index: number, value: string) => {
    if (!reflectionData) return;
    
    const newImprovements = [...reflectionData.improvements];
    newImprovements[index] = value;
    updateWeekReflection(weekNumber, { improvements: newImprovements });
  };
  
  const handleReflectionInsightChange = (index: number, value: string) => {
    if (!reflectionData) return;
    
    const newInsights = [...reflectionData.insights];
    newInsights[index] = value;
    updateWeekReflection(weekNumber, { insights: newInsights });
  };
  
  const handleReflectionRuleChange = (index: number, value: string) => {
    if (!reflectionData) return;
    
    const newRules = [...reflectionData.rules];
    newRules[index] = value;
    updateWeekReflection(weekNumber, { rules: newRules });
  };
  
  const handleReflectionExerciseComplete = () => {
    if (!reflectionData) return;
    
    updateWeekReflection(weekNumber, { exerciseCompleted: !reflectionData.exerciseCompleted });
  };
  
  // Get daily content
  const dailyContent = getDailyContent(dayNumber);
  
  // Check if this is a bonus day (days 29-31)
  const isBonusDay = dayNumber >= 29 && dayNumber <= 31;
  
  // Check if the day is accessible
  const isAccessible = isDayAccessible(dayNumber);
  
  // Render regular day content
  const renderRegularDayContent = () => {
    const motivationalPhrase = getMotivationalPhrase(weekNumber);
    
    return (
      <div className="regular-day-content space-y-6">
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

        {/* Gratitude Section */}
        <section className="gratitude-section">
          <h3 className="text-xl font-semibold mb-2">Дневник благодарностей</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
                  className="input flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            ))}
            {additionalGratitude.map((item, index) => (
              <div key={`additional-${index}`} className="flex items-center">
                <span className="mr-2">🙏</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleAdditionalGratitudeChange(index, e.target.value)}
                  placeholder="Я благодарю за"
                  className="input flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            ))}
            <button
              onClick={addGratitudeField}
              className="text-gray-500 text-sm hover:text-gray-700 mt-2 flex items-center"
            >
              <span className="mr-1">+</span> Добавить благодарностей
            </button>
          </div>
        </section>

        {/* Achievements Section */}
        <section className="achievements-section">
          <h3 className="text-xl font-semibold mb-2">Копилка достижений</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Какими достижениями я могу гордиться за последние 24 часа?
          </p>
          <div className="space-y-3">
            {dayData.achievements.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2">✓</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleAchievementChange(index, e.target.value)}
                  placeholder="Я горжусь тем, что"
                  className="input flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            ))}
            {additionalAchievements.map((item, index) => (
              <div key={`additional-${index}`} className="flex items-center">
                <span className="mr-2">✓</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleAdditionalAchievementChange(index, e.target.value)}
                  placeholder="Я горжусь тем, что"
                  className="input flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            ))}
            <button
              onClick={addAchievementField}
              className="text-gray-500 text-sm hover:text-gray-700 mt-2 flex items-center"
            >
              <span className="mr-1">+</span> Добавить достижений
            </button>
          </div>
        </section>

        {/* Goals Section */}
        <section className="goals-section">
          <h3 className="text-xl font-semibold mb-2">Целеполагание</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Какие 3 задачи я поставлю перед собой на день?
          </p>
          <div className="space-y-3">
            {dayData.goals.map((goal, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => handleGoalToggle(index)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={goal.text}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                  placeholder={`Моя ${index + 1} задача`}
                  className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    goal.completed ? 'line-through text-gray-500' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Exercise Section */}
        <section className="exercise-section">
          <h3 className="text-xl font-semibold mb-2">#упражнение_на_осознанность</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md mb-4 text-sm sm:text-base">
            {dailyContent.exercise}
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={dayData.exerciseCompleted}
              onChange={handleExerciseComplete}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-base">Упражнение выполнено</span>
          </div>
        </section>

        {/* Motivational Quote */}
        <div className="motivational-quote p-4 bg-primary bg-opacity-10 rounded-lg">
          <p className="text-lg italic text-center">{motivationalPhrase}</p>
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
            За что на этой неделе я испытываю благодарность? (к себе, окружающим, миру)?
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
          <h3 className="text-base sm:text-lg font-medium mb-2">
            Подводим итоги {
              weekNumber === 1 ? 'первой' : 
              weekNumber === 2 ? 'второй' : 
              weekNumber === 3 ? 'третьей' : 
              weekNumber === 4 ? 'четвёртой' : ''
            } недели
          </h3>
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
                  placeholder="У меня получилось"
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
                  placeholder="Я могу сделать лучше"
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
                  placeholder={`Моё ${['первое', 'второе', 'третье'][index]} озарение`}
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
            Что я улучшу в себе и своём подходе на следующую неделю?
          </p>
          
          <div className="space-y-3">
            {reflectionData.rules.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2 text-blue-500">📘</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleReflectionRuleChange(index, e.target.value)}
                  placeholder={`Моё ${['первое', 'второе', 'третье'][index]} новое правило`}
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
              checked={reflectionData.exerciseCompleted}
              onChange={handleReflectionExerciseComplete}
              className="checkbox mr-3"
            />
            <span>Упражнение выполнено</span>
          </div>
        </div>
        
        {/* Motivational Phrase */}
        <div className="motivational-phrase text-center py-4">
          <h3 className="text-lg sm:text-xl font-bold text-primary">{getMotivationalPhrase(weekNumber)}</h3>
        </div>
      </div>
    );
  };
  
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
        {!isAccessible ? (
          // Render access denied content
          <div className="flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-4">
              День {dayNumber}: {getDayTitle(dayNumber)}
            </h1>
            
            {renderAccessDeniedContent()}
          </div>
        ) : isBonusDay ? (
          // Render bonus day content
          <div className="flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-4">
              Бонусный день {dayNumber - 28}
            </h1>
            
            {renderBonusDayContent()}
          </div>
        ) : (
          // Render regular day content
          <>
            <div className="flex flex-col mb-4 sm:mb-6 space-y-4">
              <div className="flex flex-col items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-center">
                  День {dayNumber}: {getDayTitle(dayNumber)}
                  <span className="block text-base sm:text-lg font-normal text-text-light-light dark:text-text-light-dark">
                    ({formatDate(dayDate)})
                  </span>
                </h1>
                
                <div className="mt-2 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 border border-gray-300 dark:border-gray-600">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        background: `conic-gradient(#4F46E5 ${getDayCompletion(dayNumber)}%, #f3f4f6 0)`,
                        color: getDayCompletion(dayNumber) > 50 ? 'white' : 'inherit',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.05) inset'
                      }}
                    >
                      {getDayCompletion(dayNumber)}%
                    </div>
                  </div>
                  <div className="text-sm text-text-light-light dark:text-text-light-dark">
                    Прогресс дня
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center gap-4 px-2">
                {dayNumber > 1 ? (
                  <Button 
                    variant="outline" 
                    size="md"
                    onClick={goToPreviousDay}
                    className="flex-1"
                    isActive={isPrevButtonActive}
                  >
                    Пред. день
                  </Button>
                ) : (
                  <div className="flex-1"></div>
                )}
                
                <Button 
                  variant="outline" 
                  size="md"
                  onClick={goToNextDay}
                  disabled={dayNumber >= 28}
                  className="flex-1"
                  isActive={isNextButtonActive}
                >
                  След. день
                </Button>
              </div>
            </div>
            
            {isReflection ? renderReflectionDayContent() : renderRegularDayContent()}
            
            {/* "Done" button at the bottom of each day */}
            <div className="mt-8 text-center">
              <Link to="/">
                <Button variant="primary">
                  Готово
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DayPage;
