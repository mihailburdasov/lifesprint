import React, { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { /* formatDate, */ formatDateRussian } from '../../../../core/utils/dateUtils';
import { getDailyContent, getMotivationalPhrase, getStepAudioSrc } from '../../../../data/dailyContent';
import { Button, AudioPlayer } from '../../../../core/components';
import { useContentService } from '../../hooks/useContentService';
import { logger, LogLevel } from '../../../../core/services/LoggingService';
import { useDebounce } from '../../../../core/hooks/useDebounce';

// Define interfaces locally
interface DailyContent {
  thought: {
    text: string;
    author?: string;
  };
  exercise: string;
  audioSrc?: string; // Make audioSrc optional to match the imported type
  withAudio?: boolean;
}

// Интерфейс используется для типизации данных, но не используется напрямую
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const { progress, updateDayProgress, updateWeekReflection, isReflectionDay: checkReflectionDay, isDayAccessible, reloadProgress, isSyncing, needsSync } = useProgress();
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
  // State for tracking attempted empty task toggle
  const [attemptedEmptyTaskIndex, setAttemptedEmptyTaskIndex] = useState<number | null>(null);
  
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
  
  // Reload progress when component mounts
  useEffect(() => {
    // This ensures we get the latest data
    const loadData = async () => {
      try {
        await reloadProgress();
        logger.dayContent('Данные прогресса загружены в DayContent');
      } catch (error) {
        logger.dayContent('Ошибка загрузки прогресса:', LogLevel.ERROR, error);
      }
    };
    
    loadData();
  }, [reloadProgress]);
  
  // Update local state when progress changes
  // This is critical for task synchronization between dashboard and day page
  useEffect(() => {
    logger.dayContent('Обновление локального состояния в DayContent', LogLevel.DEBUG);
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
  }, [dayNumber, progress]); // progress dependency ensures updates when tasks are toggled from main page
  
  // Create refs for input fields
  const inputRefs = useRef<{
    gratitude: (HTMLInputElement | null)[];
    achievements: (HTMLInputElement | null)[];
    goals: (HTMLInputElement | null)[];
  }>({
    gratitude: [null, null, null],
    achievements: [null, null, null],
    goals: [null, null, null]
  });
  
  // State for tracking saving status
  const [savingStatus, setSavingStatus] = useState<{
    type: 'gratitude' | 'achievement' | 'goal' | 'goalToggle' | 'exercise' | null;
    index: number | null;
    saving: boolean;
  }>({ type: null, index: null, saving: false });
  
  // Use debounce hook for saving data
  const debouncedSave = useDebounce((type: string, index: number, value: string) => {
    if (!value) return;
    
    logger.dayContent(`Сохранение ${type} ${index}:`, LogLevel.DEBUG, value);
    
    // Set saving status
    setSavingStatus({ type: type as any, index, saving: true });
    
    // Create updated data based on type
    let updateData: Partial<DayProgress> = {};
    
    if (type === 'gratitude') {
      const newGratitude = [...gratitude];
      newGratitude[index] = value;
      updateData = { gratitude: newGratitude };
    } else if (type === 'achievement') {
      const newAchievements = [...achievements];
      newAchievements[index] = value;
      updateData = { achievements: newAchievements };
    } else if (type === 'goal') {
      const newGoals = [...goals];
      newGoals[index] = { ...newGoals[index], text: value };
      updateData = { goals: newGoals };
    }
    
    // Force sync for non-empty values
    const forceSync = value.trim() !== '';
    
    // Update progress
    updateDayProgress(dayNumber, updateData, forceSync)
      .finally(() => {
        setSavingStatus({ type: null, index: null, saving: false });
      });
  }, 500); // 500ms debounce
  
  // Handle input changes with debounce
  const handleInputChange = (type: 'gratitude' | 'achievement' | 'goal', index: number) => {
    // Get current value from ref
    const input = type === 'gratitude' 
      ? inputRefs.current.gratitude[index]
      : type === 'achievement'
        ? inputRefs.current.achievements[index]
        : inputRefs.current.goals[index];
    
    if (input) {
      const value = input.value;
      debouncedSave(type, index, value);
    }
  };
  
  // No unused variables or functions here
  
  const handleGoalToggle = async (index: number) => {
    const goal = goals[index];
    
    // Если задача пустая и пытаемся отметить её как выполненную
    if (goal.text.trim() === '' && !goal.completed) {
      setAttemptedEmptyTaskIndex(index);
      return;
    }
    
    try {
      const newGoals = [...goals];
      newGoals[index] = { ...newGoals[index], completed: !newGoals[index].completed };
      
      // Сначала обновляем локальное состояние для мгновенной обратной связи
      setGoals(newGoals);
      
      // Затем обновляем глобальное состояние
      setSavingStatus({ type: 'goalToggle', index, saving: true });
      
      // Always force sync for goal completion changes - this is important data
      await updateDayProgress(dayNumber, { ...dayData, goals: newGoals }, true);
      
      logger.dayContent(`Задача ${index + 1} отмечена как ${!goal.completed ? 'выполненная' : 'невыполненная'}`);
    } catch (error) {
      logger.dayContent('Ошибка при изменении статуса задачи:', LogLevel.ERROR, error);
      // Revert to previous state if there's an error
      setGoals([...goals]);
    } finally {
      setSavingStatus({ type: null, index: null, saving: false });
    }
  };
  
  // Remove unused variable
  
  const handleExerciseComplete = async () => {
    try {
      setSavingStatus({ type: 'exercise', index: 0, saving: true });
      // Always force sync for exercise completion - this is important data
      await updateDayProgress(dayNumber, { exerciseCompleted: !dayData.exerciseCompleted }, true);
    } catch (error) {
      logger.dayContent('Ошибка при сохранении статуса упражнения:', LogLevel.ERROR, error);
    } finally {
      setSavingStatus({ type: null, index: null, saving: false });
    }
  };
  
  
  // State for tracking loading state of reflection operations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savingReflectionGratitude, setSavingReflectionGratitude] = useState<string | null>(null);
  
  // Handle reflection day input changes with debounce
  const handleReflectionGratitudeBlur = async (type: 'self' | 'others' | 'world', e: React.FocusEvent<HTMLInputElement>) => {
    if (!reflectionData) return;
    
    // Get value directly from the event target
    const newValue = e.target.value;
    
    try {
      setSavingReflectionGratitude(type);
      
      // Add a small delay before saving to avoid conflicts with typing
      setTimeout(() => {
        // Force sync for non-empty values
        const forceSync = newValue.trim() !== '';
        
        if (type === 'self') {
          updateWeekReflection(weekNumber, { gratitudeSelf: newValue }, forceSync)
            .finally(() => {
              setSavingReflectionGratitude(null);
            });
        } else if (type === 'others') {
          updateWeekReflection(weekNumber, { gratitudeOthers: newValue }, forceSync)
            .finally(() => {
              setSavingReflectionGratitude(null);
            });
        } else if (type === 'world') {
          updateWeekReflection(weekNumber, { gratitudeWorld: newValue }, forceSync)
            .finally(() => {
              setSavingReflectionGratitude(null);
            });
        }
      }, 100);
    } catch (error) {
      logger.dayContent('Ошибка при сохранении благодарности в рефлексии:', LogLevel.ERROR, error);
      setSavingReflectionGratitude(null);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savingReflectionAchievement, setSavingReflectionAchievement] = useState<number | null>(null);
  
  const handleReflectionAchievementBlur = async (index: number, e: React.FocusEvent<HTMLInputElement>) => {
    if (!reflectionData) return;
    
    // Get value directly from the event target
    const newValue = e.target.value;
    
    try {
      setSavingReflectionAchievement(index);
      
      // Create a new array with the updated value
      const newAchievements = [...reflectionData.achievements];
      newAchievements[index] = newValue;
      
      // Add a small delay before saving to avoid conflicts with typing
      setTimeout(() => {
        // Force sync for non-empty values
        const forceSync = newValue.trim() !== '';
        updateWeekReflection(weekNumber, { achievements: newAchievements }, forceSync)
          .finally(() => {
            setSavingReflectionAchievement(null);
          });
      }, 100);
    } catch (error) {
      logger.dayContent('Ошибка при сохранении достижения в рефлексии:', LogLevel.ERROR, error);
      setSavingReflectionAchievement(null);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savingReflectionImprovement, setSavingReflectionImprovement] = useState<number | null>(null);
  
  const handleReflectionImprovementBlur = async (index: number, e: React.FocusEvent<HTMLInputElement>) => {
    if (!reflectionData) return;
    
    // Get value directly from the event target
    const newValue = e.target.value;
    
    try {
      setSavingReflectionImprovement(index);
      
      // Create a new array with the updated value
      const newImprovements = [...reflectionData.improvements];
      newImprovements[index] = newValue;
      
      // Add a small delay before saving to avoid conflicts with typing
      setTimeout(() => {
        // Force sync for non-empty values
        const forceSync = newValue.trim() !== '';
        updateWeekReflection(weekNumber, { improvements: newImprovements }, forceSync)
          .finally(() => {
            setSavingReflectionImprovement(null);
          });
      }, 100);
    } catch (error) {
      logger.dayContent('Ошибка при сохранении области улучшения в рефлексии:', LogLevel.ERROR, error);
      setSavingReflectionImprovement(null);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savingReflectionInsight, setSavingReflectionInsight] = useState<number | null>(null);
  
  const handleReflectionInsightBlur = async (index: number, e: React.FocusEvent<HTMLInputElement>) => {
    if (!reflectionData) return;
    
    // Get value directly from the event target
    const newValue = e.target.value;
    
    try {
      setSavingReflectionInsight(index);
      
      // Create a new array with the updated value
      const newInsights = [...reflectionData.insights];
      newInsights[index] = newValue;
      
      // Add a small delay before saving to avoid conflicts with typing
      setTimeout(() => {
        // Force sync for non-empty values
        const forceSync = newValue.trim() !== '';
        updateWeekReflection(weekNumber, { insights: newInsights }, forceSync)
          .finally(() => {
            setSavingReflectionInsight(null);
          });
      }, 100);
    } catch (error) {
      logger.dayContent('Ошибка при сохранении озарения в рефлексии:', LogLevel.ERROR, error);
      setSavingReflectionInsight(null);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savingReflectionRule, setSavingReflectionRule] = useState<number | null>(null);
  
  const handleReflectionRuleBlur = async (index: number, e: React.FocusEvent<HTMLInputElement>) => {
    if (!reflectionData) return;
    
    // Get value directly from the event target
    const newValue = e.target.value;
    
    try {
      setSavingReflectionRule(index);
      
      // Create a new array with the updated value
      const newRules = [...reflectionData.rules];
      newRules[index] = newValue;
      
      // Add a small delay before saving to avoid conflicts with typing
      setTimeout(() => {
        // Force sync for non-empty values
        const forceSync = newValue.trim() !== '';
        updateWeekReflection(weekNumber, { rules: newRules }, forceSync)
          .finally(() => {
            setSavingReflectionRule(null);
          });
      }, 100);
    } catch (error) {
      logger.dayContent('Ошибка при сохранении правила в рефлексии:', LogLevel.ERROR, error);
      setSavingReflectionRule(null);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savingReflectionExercise, setSavingReflectionExercise] = useState<boolean>(false);
  
  const handleReflectionExerciseComplete = async () => {
    if (!reflectionData) return;
    
    try {
      setSavingReflectionExercise(true);
      // Always force sync for exercise completion - this is important data
      await updateWeekReflection(weekNumber, { exerciseCompleted: !reflectionData.exerciseCompleted }, true);
    } catch (error) {
      logger.dayContent('Ошибка при сохранении статуса упражнения в рефлексии:', LogLevel.ERROR, error);
    } finally {
      setSavingReflectionExercise(false);
    }
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
                  <div className="bg-primary-lighter dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-primary italic relative pl-8 pr-6 mb-4 text-sm sm:text-base">
                    <span className="absolute left-3 top-2 text-3xl text-primary-dark dark:text-primary-light opacity-70 font-serif">"</span>
                    {dailyContent.thought.text}
                    <span className="absolute right-3 bottom-0 text-3xl text-primary-dark dark:text-primary-light opacity-70 font-serif">"</span>
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
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          defaultValue={gratitude[index]}
                          ref={el => inputRefs.current.gratitude[index] = el}
                          onChange={() => handleInputChange('gratitude', index)}
                          placeholder="Я благодарю за"
                          className="input w-full"
                        />
                        {savingStatus.type === 'gratitude' && savingStatus.index === index && savingStatus.saving && (
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            Сохранение...
                          </span>
                        )}
                      </div>
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
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          defaultValue={achievements[index]}
                          ref={el => inputRefs.current.achievements[index] = el}
                          onChange={() => handleInputChange('achievement', index)}
                          placeholder="Я горжусь собой"
                          className="input w-full"
                        />
                        {savingStatus.type === 'achievement' && savingStatus.index === index && savingStatus.saving && (
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            Сохранение...
                          </span>
                        )}
                      </div>
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
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          defaultValue={goals[index].text}
                          ref={el => inputRefs.current.goals[index] = el}
                          onChange={() => handleInputChange('goal', index)}
                          placeholder={`Моя ${index + 1} задача`}
                          className="input w-full"
                        />
                        {(savingStatus.type === 'goal' && savingStatus.index === index && savingStatus.saving) || 
                         (savingStatus.type === 'goalToggle' && savingStatus.index === index && savingStatus.saving) ? (
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            Сохранение...
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {step === 6 && (
              <div className="exercise">
                <h3 className="text-base sm:text-lg font-medium mb-2">#упражнение_на_осознанность</h3>
                <div className="bg-primary-lighter dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-primary italic relative pl-8 pr-6 mb-4 text-sm sm:text-base">
                  <span className="absolute left-3 top-2 text-3xl text-primary-dark dark:text-primary-light opacity-70 font-serif">"</span>
                  {dailyContent.exercise}
                  <span className="absolute right-3 bottom-0 text-3xl text-primary-dark dark:text-primary-light opacity-70 font-serif">"</span>
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
                <div className="bg-primary-lighter dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-primary italic relative pl-8 pr-6 mb-4 text-sm sm:text-base">
                  <span className="absolute left-3 top-2 text-3xl text-primary-dark dark:text-primary-light opacity-70 font-serif">"</span>
                  {dailyContent.thought.text}
                  <span className="absolute right-3 bottom-0 text-3xl text-primary-dark dark:text-primary-light opacity-70 font-serif">"</span>
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
                      defaultValue={reflectionData.gratitudeSelf}
                      onBlur={(e) => handleReflectionGratitudeBlur('self', e)}
                      placeholder="Я благодарю себя за"
                      className="input flex-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🙏</span>
                    <input
                      type="text"
                      defaultValue={reflectionData.gratitudeOthers}
                      onBlur={(e) => handleReflectionGratitudeBlur('others', e)}
                      placeholder="Я благодарю окружающих за"
                      className="input flex-1"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🙏</span>
                    <input
                      type="text"
                      defaultValue={reflectionData.gratitudeWorld}
                      onBlur={(e) => handleReflectionGratitudeBlur('world', e)}
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
                        defaultValue={item}
                        onBlur={(e) => handleReflectionAchievementBlur(index, e)}
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
                        defaultValue={item}
                        onBlur={(e) => handleReflectionImprovementBlur(index, e)}
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
                          defaultValue={item}
                          onBlur={(e) => handleReflectionInsightBlur(index, e)}
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
                          defaultValue={item}
                          onBlur={(e) => handleReflectionRuleBlur(index, e)}
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
                  <div className="bg-primary-lighter dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-primary italic relative pl-8 pr-6 mb-4 text-sm sm:text-base">
                    <span className="absolute left-3 top-2 text-3xl text-primary-dark dark:text-primary-light opacity-70 font-serif">"</span>
                    {dailyContent.exercise}
                    <span className="absolute right-3 bottom-0 text-3xl text-primary-dark dark:text-primary-light opacity-70 font-serif">"</span>
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
      
      {/* Предупреждение при попытке отметить пустую задачу как выполненную */}
      {attemptedEmptyTaskIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="mx-auto max-w-md w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg overflow-hidden p-6">
            <h3 className="text-lg font-medium mb-4">
              Пустая задача
            </h3>
            
            <p className="mb-6">
              Нельзя отметить пустую задачу как выполненную. Пожалуйста, сначала заполните текст задачи.
            </p>
            
            <div className="flex justify-end space-x-4">
              <Button 
                variant="primary" 
                onClick={() => setAttemptedEmptyTaskIndex(null)}
              >
                Понятно
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Индикатор состояния синхронизации */}
      {(isSyncing || needsSync) && (
        <div className="fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg text-sm opacity-80 z-10">
          {isSyncing ? 'Синхронизация...' : 'Изменения будут синхронизированы в течение 15 секунд'}
        </div>
      )}
    </div>
  );
};

export default DayContent;
