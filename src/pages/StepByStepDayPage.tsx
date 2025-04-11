import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import AudioPlayer from '../components/common/AudioPlayer';
import Button from '../components/common/Button';
import { useProgress } from '../context/ProgressContext';
import { formatDate, getDayTitle } from '../utils/dateUtils';
import { getStepContent, getMotivationalPhrase } from '../data/dailyContent';
import useInputFocus from '../hooks/useInputFocus';

interface StepParams {
  dayId: string;
  stepId: string;
  [key: string]: string;
}

const StepByStepDayPage: React.FC = () => {
  const { dayId, stepId } = useParams<StepParams>();
  const navigate = useNavigate();
  const { progress, updateDayProgress, updateWeekReflection, isDayAccessible, isReflectionDay: checkReflectionDay } = useProgress();
  
  // Используем хук для предотвращения перекрытия полей ввода мобильной клавиатурой
  useInputFocus();
  
  const dayNumber = parseInt(dayId || '1', 10);
  const stepNumber = parseInt(stepId || '1', 10);
  
  // Check if the day is accessible and if it's a reflection day
  const isAccessible = isDayAccessible(dayNumber);
  const isReflection = checkReflectionDay(dayNumber);
  const weekNumber = Math.ceil(dayNumber / 7);
  
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
  
  // State for audio auto-play option
  const [withAudio, setWithAudio] = useState(true);
  
  // State for additional gratitude and achievement fields
  // Only allow adding additional fields for the current day
  const isCurrentDay = dayNumber === progress.currentDay;
  
  const [additionalGratitude, setAdditionalGratitude] = useState<string[]>(
    dayData.additionalGratitude || []
  );
  const [additionalAchievements, setAdditionalAchievements] = useState<string[]>(
    dayData.additionalAchievements || []
  );
  
  // Get content for the current step
  const stepContent = getStepContent(dayNumber, stepNumber);
  
  // Handle navigation to previous/next step
  const goToPreviousStep = () => {
    if (stepNumber > 1) {
      navigate(`/day/${dayNumber}/step/${stepNumber - 1}`);
    }
  };
  
  const goToNextStep = () => {
    if (stepNumber < (isReflection ? 8 : 6)) {
      navigate(`/day/${dayNumber}/step/${stepNumber + 1}`);
    } else {
      // If it's the last step, mark the day as completed and go to dashboard
      if (isReflection) {
        updateWeekReflection(weekNumber, { exerciseCompleted: true });
      } else {
        updateDayProgress(dayNumber, { completed: true });
      }
      navigate('/');
    }
  };
  
  // Handle input changes for regular days
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
    if (additionalGratitude.length < 4) { // Max 7 total (3 default + 4 additional)
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
    if (additionalAchievements.length < 4) { // Max 7 total (3 default + 4 additional)
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
    // Prevent toggling completion for empty goals
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
  
  // Render content based on the current step for regular days
  const renderRegularStepContent = () => {
    switch (stepNumber) {
      case 1:
        return (
          <div className="step-content space-y-6">
            <h3 className="text-xl sm:text-2xl font-medium mb-4">Добро пожаловать в новый день!</h3>
            <p className="text-base mb-6">Давай выполним несколько полезных дел</p>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={withAudio}
                onChange={() => setWithAudio(!withAudio)}
                className="checkbox mr-3"
              />
              <span>Выполняю день с аудио-практикой*</span>
            </div>
            <p className="text-sm text-text-light-light dark:text-text-light-dark">
              *Если включено, аудио будет автоматически запускаться на каждом шаге.
            </p>
          </div>
        );
      
      case 2:
        return (
          <div className="step-content space-y-6">
            {/* Thought of the day */}
            <div className="thought-of-day">
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {stepContent.thought.author 
                  ? `#мысльдня от ${stepContent.thought.author}:` 
                  : '#мысльдня'}
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md italic text-sm sm:text-base">
                {stepContent.thought.text}
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="step-content space-y-6">
            {/* Gratitude Journal */}
            <div className="gratitude-journal">
              <h3 className="text-base sm:text-lg font-medium mb-2">Дневник благодарностей</h3>
              <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
                За что я чувствую благодарность в своей жизни за последние 24 часа?
              </p>
              
              <div className="space-y-3">
                {dayData.gratitude.map((item, index) => (
                  <div key={`gratitude-${index}`} className="flex items-center">
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
                
                {/* Additional gratitude fields */}
                {additionalGratitude.map((item, index) => (
                  <div key={`additional-gratitude-${index}`} className="flex items-center">
                    <span className="mr-2">🙏</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleAdditionalGratitudeChange(index, e.target.value)}
                      placeholder="Я благодарю за"
                      className="input flex-1"
                    />
                  </div>
                ))}
                
                {/* Add button for gratitude (only for current day and non-reflection days) */}
                {isCurrentDay && !isReflection && additionalGratitude.length < 4 && (
                  <button
                    onClick={addGratitudeField}
                    className="text-gray-500 text-sm hover:text-gray-700 mt-2 flex items-center"
                  >
                    <span className="mr-1">+</span> Добавить благодарностей
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="step-content space-y-6">
            {/* Achievements */}
            <div className="achievements">
              <h3 className="text-base sm:text-lg font-medium mb-2">Копилка достижений</h3>
              <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
                Какими достижениями я могу гордиться за последние 24 часа?
              </p>
              
              <div className="space-y-3">
                {dayData.achievements.map((item, index) => (
                  <div key={`achievement-${index}`} className="flex items-center">
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
                
                {/* Additional achievement fields */}
                {additionalAchievements.map((item, index) => (
                  <div key={`additional-achievement-${index}`} className="flex items-center">
                    <span className="mr-2">😎</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleAdditionalAchievementChange(index, e.target.value)}
                      placeholder="Я горжусь собой"
                      className="input flex-1"
                    />
                  </div>
                ))}
                
                {/* Add button for achievements (only for current day and non-reflection days) */}
                {isCurrentDay && !isReflection && additionalAchievements.length < 4 && (
                  <button
                    onClick={addAchievementField}
                    className="text-gray-500 text-sm hover:text-gray-700 mt-2 flex items-center"
                  >
                    <span className="mr-1">+</span> Добавить достижений
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="step-content space-y-6">
            {/* Goals */}
            <div className="goals">
              <h3 className="text-base sm:text-lg font-medium mb-2">Целеполагание</h3>
              <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
                Какие 3 задачи я поставлю перед собой на день?
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
          </div>
        );
      
      case 6:
        return (
          <div className="step-content space-y-6">
            {/* Exercise */}
            <div className="exercise">
              <h3 className="text-base sm:text-lg font-medium mb-2">#упражнение_на_осознанность</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md mb-3 text-sm sm:text-base">
                {stepContent.exercise}
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={dayData.exerciseCompleted}
                  onChange={handleExerciseComplete}
                  className="checkbox mr-3"
                />
                <span>Упражнение выполнено</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Неизвестный шаг</div>;
    }
  };
  
  // Render content based on the current step for reflection days
  const renderReflectionStepContent = () => {
    if (!reflectionData) return <div>Ошибка загрузки данных</div>;
    
    switch (stepNumber) {
      case 1:
        return (
          <div className="step-content space-y-6">
            <h3 className="text-xl sm:text-2xl font-medium mb-4">Добро пожаловать в новый день!</h3>
            <p className="text-base mb-6">Давай выполним недельную рефлексию</p>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={withAudio}
                onChange={() => setWithAudio(!withAudio)}
                className="checkbox mr-3"
              />
              <span>Выполняю недельную рефлексию с аудио-практикой*</span>
            </div>
            <p className="text-sm text-text-light-light dark:text-text-light-dark">
              *Если включено, аудио будет автоматически запускаться на каждом шаге.
            </p>
          </div>
        );
      
      case 2:
        return (
          <div className="step-content space-y-6">
            {/* Thought of the day */}
            <div className="thought-of-day">
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {stepContent.thought.author 
                  ? `#мысльдня от ${stepContent.thought.author}:` 
                  : '#мысльдня'}
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md italic text-sm sm:text-base">
                {stepContent.thought.text}
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="step-content space-y-6">
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
          </div>
        );
      
      case 4:
        return (
          <div className="step-content space-y-6">
            {/* Weekly Results - Achievements */}
            <div className="weekly-results">
              <h3 className="text-base sm:text-lg font-medium mb-2">Мои достижения</h3>
              <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
                Что у меня получилось на этой неделе?
              </p>
              
              <div className="space-y-3">
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
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="step-content space-y-6">
            {/* Weekly Results - Improvements */}
            <div className="weekly-results">
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
          </div>
        );
      
      case 6:
        return (
          <div className="step-content space-y-6">
            {/* Insights */}
            <div className="insights">
              <h3 className="text-base sm:text-lg font-medium mb-2">Мои озарения</h3>
              <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
                Какие уроки я получил из событий (успехов, ошибок, бездействия)?
              </p>
              
              <div className="space-y-3">
                {reflectionData.insights.map((item, index) => {
                  const ordinals = ['первое', 'второе', 'третье'];
                  return (
                    <div key={index} className="flex items-center">
                      <span className="mr-2 text-primary">!</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleReflectionInsightChange(index, e.target.value)}
                        placeholder={`Моё ${ordinals[index]} озарение`}
                        className="input flex-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      
      case 7:
        return (
          <div className="step-content space-y-6">
            {/* Updated Rules */}
            <div className="rules">
              <h3 className="text-base sm:text-lg font-medium mb-2">Обновляем правила игры</h3>
              <p className="text-sm text-text-light-light dark:text-text-light-dark mb-3">
                Что я улучшу в себе и своём подходе на следующую неделю?
              </p>
              
              <div className="space-y-3">
                {reflectionData.rules.map((item, index) => {
                  const ordinals = ['первое', 'второе', 'третье'];
                  return (
                    <div key={index} className="flex items-center">
                      <span className="mr-2 text-blue-500">📘</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleReflectionRuleChange(index, e.target.value)}
                        placeholder={`Моё ${ordinals[index]} новое правило`}
                        className="input flex-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      
      case 8:
        return (
          <div className="step-content space-y-6">
            {/* Exercise */}
            <div className="exercise">
              <h3 className="text-base sm:text-lg font-medium mb-2">#упражнение_на_осознанность</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-md mb-3 text-sm sm:text-base">
                {stepContent.exercise}
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
      
      default:
        return <div>Неизвестный шаг</div>;
    }
  };
  
  // Render access denied content
  const renderAccessDeniedContent = () => {
    return (
      <div className="access-denied flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0V7m0 2h2m-2 0H9" />
          </svg>
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
    <div className="step-by-step-page flex min-h-screen bg-background-light dark:bg-background-dark">
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
        ) : (
          // Render step content
          <>
            <div className="flex flex-col mb-4 sm:mb-6 space-y-4">
              <div className="flex flex-col items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-center">
                  День {dayNumber}: {getDayTitle(dayNumber)}
                  <span className="block text-base sm:text-lg font-normal text-text-light-light dark:text-text-light-dark">
                    ({formatDate(dayDate)})
                  </span>
                </h1>
                
                <div className="mt-2 text-sm text-text-light-light dark:text-text-light-dark">
                  Шаг {stepNumber} из {isReflection ? 8 : 6}
                </div>
              </div>
            </div>
            
            {/* Audio player (only for steps 2-6/7/8 and if audio is enabled) */}
            {stepNumber > 1 && (
              <div className="audio-player-container mb-4 sm:mb-6">
                <AudioPlayer 
                  src={stepContent.audioSrc} 
                  className="w-full"
                  autoPlay={withAudio}
                />
              </div>
            )}
            
            {/* Step content */}
            {isReflection ? renderReflectionStepContent() : renderRegularStepContent()}
            
            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              {stepNumber > 1 ? (
                <Button variant="outline" onClick={goToPreviousStep}>
                  ← Назад
                </Button>
              ) : (
                <div></div> // Empty div to maintain layout
              )}
              
              <Button variant="primary" onClick={goToNextStep}>
                {stepNumber < (isReflection ? 8 : 6) ? 'Далее →' : 'Готово'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StepByStepDayPage;
