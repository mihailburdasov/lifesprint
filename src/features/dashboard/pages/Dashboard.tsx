import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { Sidebar } from '../../../features/dashboard/components';
import { useProgress } from '../../../features/day/context';
import { Button } from '../../../core/components';
import StepByStepDay from '../../../features/day/components/steps/StepByStepDay';
import { Dialog } from '@headlessui/react';
import { useContentService } from '../../../features/day/hooks/useContentService';
import { useProgressService } from '../../../features/day/hooks/useProgressService';
import { useTheme } from '../../../context/ThemeContext';

const Dashboard: React.FC = () => {
  const { progress, updateCurrentDay } = useProgress();
  const { getDayCompletion, isReflectionDay, updateDayProgress, /* isDayAccessible, */ isWeekAccessible, /* areTasksCompleted, */ isWeekComplete } = useProgressService();
  const { formatDate, getDayTitle } = useContentService();
  const { theme } = useTheme();
  
  // Use the progress from context
  const safeProgress = progress;
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]); // Начальное состояние - пустой массив
  const [isStepByStepOpen, setIsStepByStepOpen] = useState(false);
  const [isAttemptingClose, setIsAttemptingClose] = useState(false);
  const [attemptedEmptyTaskIndex, setAttemptedEmptyTaskIndex] = useState<number | null>(null);
  // Add a counter to force re-render when progress data changes
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Add local state for current day goals
  const currentDayNumber = safeProgress.currentDay;
  const currentDayData = safeProgress.days[currentDayNumber] || { 
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
  const [currentDayGoals, setCurrentDayGoals] = useState(currentDayData.goals);
  
  // Update local state when progress changes
  useEffect(() => {
    const dayData = safeProgress.days[currentDayNumber] || { 
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
    console.log('Progress changed, updating currentDayGoals from:', currentDayGoals);
    console.log('To:', dayData.goals);
    setCurrentDayGoals(dayData.goals);
    
    // Принудительно обновляем счетчик для перерисовки прогресса
    setUpdateCounter(prev => prev + 1);
  }, [safeProgress, currentDayNumber]);
  
  // Update current day when component mounts
  useEffect(() => {
    // Update current day based on the current date
    updateCurrentDay();
    console.log('Current day updated to:', progress.currentDay);
  }, [updateCurrentDay, progress.currentDay]);
  
  // Force re-render every second to update progress circles
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateCounter(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get active week number
  const activeWeek = Math.ceil(safeProgress.currentDay / 7);
  
  // Sort weeks based on active week
  const sortedWeeks = useMemo(() => {
    const weeks = [1, 2, 3, 4, 5];
    return weeks.sort((a, b) => {
      // Active week goes first
      if (a === activeWeek) return -1;
      if (b === activeWeek) return 1;
      
      // Week 5 (bonus) always goes last
      if (a === 5) return 1;
      if (b === 5) return -1;
      
      // Other weeks maintain relative order
      if (a < activeWeek && b < activeWeek) return a - b;
      if (a > activeWeek && b > activeWeek) return a - b;
      
      // Weeks before active week go after it
      if (a < activeWeek) return 1;
      if (b < activeWeek) return -1;
      
      return a - b;
    });
  }, [activeWeek]);
  
  // Toggle week expansion
  const toggleWeek = (weekNumber: number) => {
    // Только если неделя доступна и это не текущая неделя
    if (!isWeekAccessible(weekNumber) || weekNumber === activeWeek) return;
    
    if (expandedWeeks.includes(weekNumber)) {
      setExpandedWeeks(expandedWeeks.filter(week => week !== weekNumber));
    } else {
      setExpandedWeeks([...expandedWeeks, weekNumber]);
    }
  };
  
  // Check if a week is expanded
  const isWeekExpanded = (weekNumber: number) => {
    // Текущая неделя всегда раскрыта
    if (weekNumber === activeWeek) return true;
    return expandedWeeks.includes(weekNumber);
  };
  
  // Generate days for a week
  const renderWeekDays = (weekNumber: number) => {
    const startDay = (weekNumber - 1) * 7 + 1;
    const days = [];
    
    // Special handling for bonus week (week 5)
    if (weekNumber === 5) {
      for (let i = 0; i < 3; i++) {
        const dayNumber = 29 + i; // Days 29, 30, 31
        
        const dayDate = new Date(safeProgress.startDate);
        dayDate.setDate(dayDate.getDate() + dayNumber - 1);
        
        days.push(
        <Link 
          to={`/day/${dayNumber}`}
          key={dayNumber}
          className="day-card bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border-l-4 border-green-500"
        >
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm dark:text-white">
                  {dayNumber}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base text-black dark:text-white truncate">Бонусный день {i + 1}</h3>
                <p className="text-sm text-text-light-light dark:text-text-light-dark">{formatDate(dayDate)}</p>
              </div>
              
              <div className="ml-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{
                      background: `conic-gradient(#4F46E5 0%, ${theme === 'dark' ? '#374151' : '#f3f4f6'} 0)`,
                      color: 'inherit'
                    }}
                  >
                    0%
                  </div>
                </div>
              </div>
            </div>
        </Link>
        );
      }
      
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        {days}
      </div>
    );
    }
    
    // Regular weeks (1-4)
    for (let i = 0; i < 7; i++) {
      const dayNumber = startDay + i;
      if (dayNumber > 31) break; // Only 31 days in the regular sprint
      
      const dayDate = new Date(safeProgress.startDate);
      dayDate.setDate(dayDate.getDate() + dayNumber - 1);
      
      // Получаем значение завершенности для логирования
      const dayCompletion = getDayCompletion ? getDayCompletion(dayNumber) : 0;
      console.log(`Current reflection day ${dayNumber} completion: ${dayCompletion}%`);
      console.log(`Reflection day ${dayNumber} completion: ${dayCompletion}%`);
      const isReflection = isReflectionDay ? isReflectionDay(dayNumber) : false;
      
      days.push(
        <Link 
          to={`/day/${dayNumber}`} 
          key={dayNumber}
          className={`day-card bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${isReflection ? 'border-l-4 border-green-500' : ''}`}
        >
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-4">
            {dayCompletion === 100 ? (
              <FaCheckCircle className="text-green-500" size={20} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm dark:text-white">
                {dayNumber}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base text-black dark:text-white truncate">{getDayTitle(dayNumber)}</h3>
            <p className="text-sm text-text-light-light dark:text-text-light-dark">{formatDate(dayDate)}</p>
          </div>
          
          <div className="ml-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              {(() => {
                // Force re-calculation of completion with updateCounter
                const currentCompletion = getDayCompletion ? getDayCompletion(dayNumber) : 0;
                return (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{
                      background: `conic-gradient(#4F46E5 ${currentCompletion}%, ${theme === 'dark' ? '#374151' : '#f3f4f6'} 0)`,
                      color: currentCompletion > 50 ? 'white' : 'inherit'
                    }}
                  >
                    {currentCompletion}%
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        </Link>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        {days}
      </div>
    );
  };
  
  // Handle closing the widget
  const handleCloseWidget = () => {
    // Всегда закрываем виджет без проверки задач
    setIsStepByStepOpen(false);
  };
  
  // Handle toggling task completion
  const handleGoalToggle = (dayNumber: number, index: number) => {
    // Используем локальное состояние для текущего дня, иначе берем из глобального состояния
    const isCurrentDay = dayNumber === currentDayNumber;
    const goals = isCurrentDay ? currentDayGoals : (safeProgress.days[dayNumber]?.goals || [
      { text: '', completed: false },
      { text: '', completed: false },
      { text: '', completed: false }
    ]);
    
    const goal = goals[index];
    
    // Если задача пустая и пытаемся отметить её как выполненную
    if (goal.text.trim() === '' && !goal.completed) {
      setAttemptedEmptyTaskIndex(index);
      return;
    }
    
    // Создаем новый массив задач с обновленным статусом
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], completed: !newGoals[index].completed };
    
    console.log(`Toggling task ${index + 1} to ${!goal.completed ? 'completed' : 'incomplete'}`);
    console.log('Before update - currentDayGoals:', currentDayGoals);
    
    // Сначала обновляем глобальное состояние
    updateDayProgress(dayNumber, { goals: newGoals });
    
    // Затем обновляем локальное состояние для текущего дня
    if (isCurrentDay) {
      setCurrentDayGoals(newGoals);
      console.log('After update - currentDayGoals will be set to:', newGoals);
    }
    
    // Принудительно обновляем счетчик для перерисовки прогресса
    // Это важно для обновления прогресс-бара "Задачи"
    setUpdateCounter(prev => prev + 1);
    
    // Расчет процента выполнения для прогресс-бара
    const completedTasksPercent = (newGoals.filter(g => g.completed).length / 3) * 100;
    console.log(`Progress bar will be updated to: ${completedTasksPercent}%`);
  };
  
  // Current day block
  const currentDayBlock = () => {
    const dayNumber = safeProgress.currentDay;
    const dayDate = new Date(safeProgress.startDate);
    dayDate.setDate(dayDate.getDate() + dayNumber - 1);
    const isReflection = isReflectionDay(dayNumber);
    
    // Если это день рефлексии
    if (isReflection) {
      const weekNumber = Math.ceil(dayNumber / 7);
      const reflection = safeProgress.weekReflections[weekNumber] || {
        gratitudeSelf: '',
        gratitudeOthers: '',
        gratitudeWorld: '',
        achievements: ['', '', ''],
        improvements: ['', '', ''],
        insights: ['', '', ''],
        rules: ['', '', ''],
        exerciseCompleted: false
      };
      
      // Используем переменную dayCompletion для совместимости
      const dayCompletion = getDayCompletion ? getDayCompletion(dayNumber) : 0;
      
      return (
        <div className="current-day bg-surface-light dark:bg-surface-dark rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0">
              День {dayNumber} ({formatDate ? formatDate(dayDate) : dayDate.toLocaleDateString()})
            </h2>
            
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {(() => {
                // Force re-calculation of completion with updateCounter
                const currentCompletion = getDayCompletion ? getDayCompletion(dayNumber) : 0;
                console.log(`Current reflection day ${dayNumber} completion: ${currentCompletion}%, updateCounter: ${updateCounter}`);
                return (
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      background: `conic-gradient(#4F46E5 ${currentCompletion}%, ${theme === 'dark' ? '#374151' : '#f3f4f6'} 0)`,
                      color: currentCompletion > 50 ? 'white' : 'inherit'
                    }}
                  >
                    {currentCompletion}%
                  </div>
                );
              })()}
            </div>
          </div>
          
          <div className="progress-indicators flex flex-col space-y-2 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 mb-4">
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Благодарности</div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${Math.min(100, (
                      (reflection.gratitudeSelf.trim() !== '' ? 33.3 : 0) +
                      (reflection.gratitudeOthers.trim() !== '' ? 33.3 : 0) +
                      (reflection.gratitudeWorld.trim() !== '' ? 33.3 : 0)
                    ))}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Достижения</div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${Math.min(100, (reflection.achievements.filter(a => a.trim() !== '').length / 3) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Улучшения</div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${Math.min(100, (reflection.improvements.filter(i => i.trim() !== '').length / 3) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Озарения</div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${Math.min(100, (reflection.insights.filter(i => i.trim() !== '').length / 3) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Правила</div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${Math.min(100, (reflection.rules.filter(r => r.trim() !== '').length / 3) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Упражнение</div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${reflection.exerciseCompleted ? 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              variant="primary"
              onClick={() => setIsStepByStepOpen(true)}
            >
              Заполнить
            </Button>
          </div>
        </div>
      );
    }
    
    // Для обычных дней
    const dayProgress = safeProgress.days[dayNumber] || { 
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
    
    // Используем переменную dayCompletion для совместимости
    const dayCompletion = getDayCompletion ? getDayCompletion(dayNumber) : 0;
    
    return (
      <div className="current-day bg-surface-light dark:bg-surface-dark rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0">
            День {dayNumber} ({formatDate ? formatDate(dayDate) : dayDate.toLocaleDateString()})
          </h2>
          
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {(() => {
              // Force re-calculation of completion with updateCounter
              const currentCompletion = getDayCompletion ? getDayCompletion(dayNumber) : 0;
              console.log(`Current regular day ${dayNumber} completion: ${currentCompletion}%, updateCounter: ${updateCounter}`);
              return (
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{
                    background: `conic-gradient(#4F46E5 ${currentCompletion}%, ${theme === 'dark' ? '#374151' : '#f3f4f6'} 0)`,
                    color: currentCompletion > 50 ? 'white' : 'inherit'
                  }}
                >
                  {currentCompletion}%
                </div>
              );
            })()}
          </div>
        </div>
        
        <div className="tasks space-y-2 mb-4">
          <h3 className="font-medium">Задачи на день:</h3>
          {currentDayGoals.map((goal, index) => (
            <div key={index} className="flex items-center">
              <input 
                type="checkbox" 
                checked={goal.completed}
                onChange={() => handleGoalToggle(dayNumber, index)}
                className="checkbox mr-3 cursor-pointer"
              />
              <span className={
                goal.completed 
                  ? 'line-through text-text-light-light dark:text-text-light-dark' 
                  : goal.text.trim() === '' 
                    ? 'text-gray-400 dark:text-gray-500' // Серый цвет для незаполненных задач
                    : ''
              }>
                {goal.text || 'Задача не задана'}
              </span>
            </div>
          ))}
        </div>
        
        <div className="progress-indicators flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Благодарность</div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ 
                  width: `${Math.min(100, (dayProgress.gratitude.filter(g => g.trim() !== '').length / 3) * 100)}%` 
                }}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Достижения</div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ 
                  width: `${Math.min(100, (dayProgress.achievements.filter(a => a.trim() !== '').length / 3) * 100)}%` 
                }}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Задачи</div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ 
                  width: `${Math.min(100, 
                    // Новая логика: 1 задача = 33.3%, 3 задачи = 100%
                    // Используем currentDayGoals вместо dayProgress.goals для мгновенного обновления
                    (currentDayGoals.filter(g => g.completed).length / 3) * 100
                  )}%` 
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="primary"
            onClick={() => setIsStepByStepOpen(true)}
          >
            Заполнить
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dashboard flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        
        <div className="content flex-1 md:ml-64 p-3 sm:p-4 md:p-6 pt-16 md:pt-6">
          
          {currentDayBlock()}
          
          <div className="weeks space-y-3 sm:space-y-4">
            {sortedWeeks.map(weekNumber => (
              <div 
                key={weekNumber} 
                className="week bg-surface-light dark:bg-surface-dark rounded-xl shadow-md overflow-hidden"
              >
                <div 
                  className="week-header flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleWeek(weekNumber)}
                >
                  <h2 className="text-lg font-semibold flex items-center">
                    {isWeekComplete(weekNumber) && (
                      <FaCheckCircle className="text-green-500 mr-2" size={18} />
                    )}
                    {weekNumber === 5 ? 'Бонус' : `Неделя ${weekNumber}`}
                  </h2>
                  <div className="flex items-center">
                    {isWeekExpanded(weekNumber) ? (
                      <FaChevronDown className="text-text-light-light dark:text-text-light-dark" />
                    ) : (
                      <FaChevronRight className="text-text-light-light dark:text-text-light-dark" />
                    )}
                  </div>
                </div>
                
                {isWeekExpanded(weekNumber) && (
                  <div className="week-content p-4 pt-0">
                    {renderWeekDays(weekNumber)}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          
          <StepByStepDay
            dayNumber={safeProgress.currentDay}
            isOpen={isStepByStepOpen}
            onClose={handleCloseWidget}
          />
          
          {/* Предупреждение при попытке закрыть виджет с незавершенными задачами */}
          {isAttemptingClose && (
            <Dialog
              open={isAttemptingClose}
              onClose={() => setIsAttemptingClose(false)}
              className="relative z-[60]"
            >
              <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
              
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg overflow-hidden p-6">
                  <Dialog.Title className="text-lg font-medium mb-4">
                    Незавершенные задачи
                  </Dialog.Title>
                  
                  <p className="mb-6">
                    У вас есть незавершенные задачи. Пожалуйста, завершите их перед закрытием.
                  </p>
                  
                  <div className="flex justify-end space-x-4">
                    <Button 
                      variant="primary" 
                      onClick={() => setIsAttemptingClose(false)}
                    >
                      Вернуться к задачам
                    </Button>
                  </div>
                </Dialog.Panel>
              </div>
            </Dialog>
          )}
          
          {/* Предупреждение при попытке отметить пустую задачу как выполненную */}
          {attemptedEmptyTaskIndex !== null && (
            <Dialog
              open={attemptedEmptyTaskIndex !== null}
              onClose={() => setAttemptedEmptyTaskIndex(null)}
              className="relative z-[60]"
            >
              <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
              
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg overflow-hidden p-6">
                  <Dialog.Title className="text-lg font-medium mb-4">
                    Пустая задача
                  </Dialog.Title>
                  
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
                </Dialog.Panel>
              </div>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
