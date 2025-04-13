import React, { useState, useEffect } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { formatDate, formatDateRussian } from '../../../../core/utils/dateUtils';
import { getDailyContent, getMotivationalPhrase, getStepAudioSrc } from '../../../../data/dailyContent';
import { Button, AudioPlayer } from '../../../../core/components';
import { useContentService } from '../../hooks/useContentService';

// Define interfaces locally
interface DailyContent {
  thought: {
    text: string;
    author?: string;
  };
  exercise: string;
  audioSrc: string;
  withAudio?: boolean;
}

interface DayProgress {
  completed: boolean;
  gratitude: string[];
  achievements: string[];
  goals: { text: string; completed: boolean }[];
  exerciseCompleted: boolean;
  withAudio?: boolean;
  reflection?: string;
}

interface DayContentProps {
  dayNumber: number;
  isStepMode?: boolean;
  currentStep?: number;
  onStepComplete?: () => void;
  onPreviousStep?: () => void;
  onNextStep?: () => void;
}

const DayContent: React.FC<DayContentProps> = ({
  dayNumber,
  isStepMode = false,
  currentStep = 0,
  onStepComplete,
  onPreviousStep,
  onNextStep
}) => {
  const { progress, updateDayProgress, updateWeekReflection, isReflectionDay: checkReflectionDay, isDayAccessible } = useProgress();
  const { getDayTitle } = useContentService();
  const [gratitude, setGratitude] = useState<string[]>(['', '', '']);
  const [achievements, setAchievements] = useState<string[]>(['', '', '']);
  const [goals, setGoals] = useState<{ text: string; completed: boolean }[]>([
    { text: '', completed: false },
    { text: '', completed: false },
    { text: '', completed: false }
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  
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
    exerciseCompleted: false,
    withAudio: false,
    reflection: ''
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
    exerciseCompleted: false,
    withAudio: false
  }) : null;
  
  // Get daily content
  const dailyContent: DailyContent = getDailyContent(dayNumber);
  
  useEffect(() => {
    const newDayData = progress.days[dayNumber] || {
      completed: false,
      gratitude: ['', '', ''],
      achievements: ['', '', ''],
      goals: [
        { text: '', completed: false },
        { text: '', completed: false },
        { text: '', completed: false }
      ],
      exerciseCompleted: false,
      withAudio: false,
      reflection: ''
    };
    setGratitude(newDayData.gratitude);
    setAchievements(newDayData.achievements);
    setGoals(newDayData.goals);
    setExerciseCompleted(newDayData.exerciseCompleted);
  }, [dayNumber, progress.days]);
  
  // Handle regular day input changes
  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitude = [...gratitude];
    newGratitude[index] = value;
    setGratitude(newGratitude);
    updateDayProgress(dayNumber, { ...dayData, gratitude: newGratitude });
  };
  
  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...achievements];
    newAchievements[index] = value;
    setAchievements(newAchievements);
    updateDayProgress(dayNumber, { ...dayData, achievements: newAchievements });
  };
  
  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], text: value };
    setGoals(newGoals);
    updateDayProgress(dayNumber, { ...dayData, goals: newGoals });
  };
  
  const handleGoalToggle = (index: number) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], completed: !newGoals[index].completed };
    setGoals(newGoals);
    updateDayProgress(dayNumber, { ...dayData, goals: newGoals });
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
  
  // Render regular day step
  const renderRegularStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          <div className="step-content space-y-6">
            <h3 className="text-xl sm:text-2xl font-medium mb-4">Добро пожаловать в новый день!</h3>
            <p className="text-base mb-6">Давай выполним несколько полезных дел</p>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={dayData.withAudio}
                onChange={() => updateDayProgress(dayNumber, { withAudio: !dayData.withAudio })}
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
      case 3:
      case 4:
      case 5:
      case 6:
        const stepAudioSrc = getStepAudioSrc(dayNumber, step);
        return (
          <div className="step-content space-y-6">
            {/* Аудиоплеер отображается в начале каждого шага */}
            {dayData.withAudio && stepAudioSrc && (
              <AudioPlayer 
                src={stepAudioSrc} 
                className="w-full mb-4"
                autoPlay={true}
              />
            )}
            
            {step === 2 && (
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
            )}
            
            {step === 3 && (
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
            )}
            
            {step === 4 && (
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
            )}
            
            {step === 5 && (
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
            )}
            
            {step === 6 && (
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
                  <span>Упражнение выполнено</span>
                </div>
              </div>
            )}
          </div>
        );
      
      
      default:
        return null;
    }
  };
  
  // Render reflection day step
  const renderReflectionStep = (step: number) => {
    if (!reflectionData) return null;
    
    switch (step) {
      case 1:
        return (
          <div className="step-content space-y-6">
            <h3 className="text-xl sm:text-2xl font-medium mb-4">Добро пожаловать в недельную рефлексию!</h3>
            <p className="text-base mb-6">Давай подведем итоги недели</p>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={reflectionData.withAudio}
                onChange={() => updateWeekReflection(weekNumber, { withAudio: !reflectionData.withAudio })}
                className="checkbox mr-3"
              />
              <span>Выполняю рефлексию с аудио-практикой*</span>
            </div>
            <p className="text-sm text-text-light-light dark:text-text-light-dark">
              *Если включено, аудио будет автоматически запускаться на каждом шаге.
            </p>
          </div>
        );
      
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        const reflectionStepAudioSrc = getStepAudioSrc(dayNumber, step);
        return (
          <div className="step-content space-y-6">
            {/* Аудиоплеер отображается в начале каждого шага */}
            {reflectionData.withAudio && reflectionStepAudioSrc && (
              <AudioPlayer 
                src={reflectionStepAudioSrc} 
                className="w-full mb-4"
                autoPlay={true}
              />
            )}
            
            {step === 2 && (
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
            )}
            
            {step === 3 && (
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
            )}
            
            {step === 4 && (
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
            )}
            
            {step === 5 && (
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
            )}
            
            {step === 6 && (
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
            )}
            
            {step === 7 && (
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
            )}
            
            {step === 8 && (
              <>
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
                
                <div className="motivational-phrase text-center py-4">
                  <h3 className="text-lg sm:text-xl font-bold text-primary">{getMotivationalPhrase(weekNumber)}</h3>
                </div>
              </>
            )}
          </div>
        );
      
      
      default:
        return null;
    }
  };
  
  // Render navigation buttons
  const renderNavigation = () => {
    if (!isStepMode) return null;
    
    const totalSteps = isReflection ? 8 : 6;
    const isLastStep = currentStep === totalSteps;
    
    return (
      <div className="mt-8 flex justify-between">
        {currentStep > 1 ? (
          <Button variant="outline" onClick={onPreviousStep}>
            ← Назад
          </Button>
        ) : (
          <div></div>
        )}
        
        <Button variant="primary" onClick={isLastStep ? onStepComplete : onNextStep}>
          {isLastStep ? 'Готово' : 'Далее →'}
        </Button>
      </div>
    );
  };
  
  // Render content based on day type and step
  const renderContent = () => {
    if (!isAccessible) {
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
        </div>
      );
    }
    
    return (
      <>
        <div className="flex flex-col mb-4 sm:mb-6 space-y-4">
          <div className="flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-center">
              День {dayNumber}: {getDayTitle(dayNumber)}
              <span className="block text-base sm:text-lg font-normal text-text-light-light dark:text-text-light-dark">
                ({formatDateRussian(dayDate)})
              </span>
            </h1>
            
            {isStepMode && (
              <div className="mt-2 text-sm text-text-light-light dark:text-text-light-dark">
                Шаг {currentStep} из {isReflection ? 8 : 6}
              </div>
            )}
          </div>
        </div>
        
        {isReflection ? renderReflectionStep(currentStep) : renderRegularStep(currentStep)}
        {renderNavigation()}
      </>
    );
  };
  
  return (
    <div className="day-content">
      {renderContent()}
    </div>
  );
};

export default DayContent;
