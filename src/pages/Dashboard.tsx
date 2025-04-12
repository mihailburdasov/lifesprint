import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaChevronDown, FaChevronRight, FaLock } from 'react-icons/fa';
import Sidebar from '../components/layout/Sidebar';
import { useProgress } from '../context/ProgressContext';
import { formatDate, getDayTitle } from '../utils/dateUtils';
import Button from '../components/common/Button';
import { CircularProgress } from '@mui/material';
import { FaCheck } from 'react-icons/fa';
import { Progress, DayProgress } from '../types/progress';

const Dashboard: React.FC = () => {
  const { progress, getDayCompletion, isReflectionDay, updateDayProgress, isDayAccessible, isWeekAccessible, getReflectionDayWidgetProgress, getDayProgress, getDayWidgetProgress } = useProgress();
  
  // Create a default empty progress object
  const emptyProgress = {
    startDate: new Date().toISOString(),
    currentDay: 1,
    currentWeek: 1,
    days: {},
    weekReflections: {}
  };
  
  // Use the progress from context or the empty progress if it's undefined
  const safeProgress = progress || emptyProgress;
  
  // Определяем активную неделю на основе текущего дня
  const activeWeek = Math.ceil(safeProgress.currentDay / 7);
  
  // Создаем состояние для expandedWeeks
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([activeWeek]);
  
  // Обновляем expandedWeeks при изменении активной недели
  useEffect(() => {
    // Если активная неделя не развернута, разворачиваем её и сворачиваем остальные
    if (!expandedWeeks.includes(activeWeek)) {
      setExpandedWeeks([activeWeek]);
    }
  }, [activeWeek, expandedWeeks]);
  
  // Проверяем, все ли дни недели завершены на 100%
  const isWeekCompleted = (weekNumber: number): boolean => {
    // Для бонусной недели всегда возвращаем false
    if (weekNumber === 5) return false;
    
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = weekNumber * 7;
    
    // Проверяем каждый день в неделе
    for (let dayNumber = startDay; dayNumber <= endDay; dayNumber++) {
      // Если хотя бы один день не завершен на 100%, возвращаем false
      if (getDayCompletion(dayNumber) !== 100) {
        return false;
      }
    }
    
    // Если все дни завершены на 100%, возвращаем true
    return true;
  };
  
  // Toggle week expansion
  const toggleWeek = (weekNumber: number) => {
    // Only allow toggling if the week is accessible
    if (!isWeekAccessible(weekNumber)) return;
    
    if (expandedWeeks.includes(weekNumber)) {
      setExpandedWeeks(expandedWeeks.filter(week => week !== weekNumber));
    } else {
      // Если открываем новую неделю, закрываем все остальные
      setExpandedWeeks([weekNumber]);
    }
  };
  
  // Check if a week is expanded
  const isWeekExpanded = (weekNumber: number) => {
    return expandedWeeks.includes(weekNumber);
  };
  
  // Generate days for a week
  const generateDaysForWeek = (weekNumber: number): React.ReactNode[] => {
    const days: React.ReactNode[] = [];
    const isBonusWeek = weekNumber === 5;
    const dayCount = isBonusWeek ? 3 : 7;

    for (let i = 1; i <= dayCount; i++) {
      const dayNumber = (weekNumber - 1) * 7 + i;
      const isReflection = isReflectionDay(dayNumber);
      const isAccessible = isDayAccessible(dayNumber);
      const dayData = progress?.days[dayNumber];
      const isCompleted = dayData?.completed || false;
      const dayProgress = getDayProgress(dayNumber);
      
      // Calculate the date for this day
      const dayDate = new Date(progress?.startDate || new Date());
      dayDate.setDate(dayDate.getDate() + dayNumber - 1);
      
      // Get day title based on the day number
      const dayTitle = getDayTitle(dayNumber);

      days.push(
        <div
          key={dayNumber}
          className={`relative flex items-center p-4 rounded-lg border ${
            isCompleted
              ? 'border-green-500 bg-green-50'
              : isAccessible
              ? 'border-gray-200'
              : 'border-gray-200 bg-gray-50'
          } ${isReflection ? 'ml-4' : ''}`}
        >
          {isReflection && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  {isCompleted && (
                    <FaCheckCircle className="text-green-500 mr-2" />
                  )}
                  {dayTitle}
                </h3>
                <p className="text-sm text-gray-600">
                  {dayDate.getDate()} {dayDate.toLocaleString('default', { month: 'long' })}
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10">
                  <CircularProgress
                    variant="determinate"
                    value={dayProgress}
                    size={40}
                    thickness={4}
                    className={isCompleted ? 'text-green-500' : 'text-blue-500'}
                  />
                </div>
                {dayProgress === 100 && (
                  <div className="ml-2 text-sm font-medium text-green-500">
                    100%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return days;
  };
  
  // Handle toggling task completion
  const handleGoalToggle = (dayNumber: number, index: number) => {
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
    
    // Prevent toggling completion for empty goals
    if (!dayProgress.goals[index].text.trim()) {
      alert('Пожалуйста, заполните текст задачи перед тем, как отметить её выполненной.');
      return;
    }
    
    const newGoals = [...dayProgress.goals];
    newGoals[index] = { ...newGoals[index], completed: !newGoals[index].completed };
    updateDayProgress(dayNumber, { goals: newGoals });
  };
  
  // Current day block
  const currentDayBlock = () => {
    const dayNumber = safeProgress.currentDay;
    const dayDate = new Date(safeProgress.startDate);
    dayDate.setDate(dayDate.getDate() + dayNumber - 1);
    
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
    
    const completion = getDayCompletion(dayNumber);
    const isReflection = isReflectionDay(dayNumber);
    
    // Get reflection day widget progress
    const reflectionProgress = isReflection && getReflectionDayWidgetProgress ? 
      getReflectionDayWidgetProgress(dayNumber) : null;
    
    return (
      <div className="current-day bg-surface-light dark:bg-surface-dark rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0">
            День {dayNumber} ({formatDate(dayDate)})
            <span className="block sm:inline sm:ml-2 font-normal text-text-light-light dark:text-text-light-dark">
              {getDayTitle(dayNumber)}
            </span>
          </h2>
          
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: `conic-gradient(#4F46E5 ${completion}%, #f3f4f6 0)`,
                color: completion > 50 ? 'white' : 'inherit',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.05) inset'
              }}
            >
              {completion}%
            </div>
          </div>
        </div>
        
        {/* Tasks section - only show for non-reflection days */}
        {!isReflection && (
          <div className="tasks space-y-2 mb-4">
            <h3 className="font-medium">Задачи на день:</h3>
            {dayProgress.goals.map((goal, index) => (
              <div key={index} className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={goal.completed}
                  onChange={() => handleGoalToggle(dayNumber, index)}
                  className="checkbox mr-3 cursor-pointer"
                />
                <span className={goal.completed ? 'line-through text-text-light-light dark:text-text-light-dark' : ''}>
                  {goal.text || 'Задача не задана'}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Progress indicators */}
        {isReflection && reflectionProgress ? (
          <div className="progress-indicators flex flex-col space-y-2 mb-4">
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Благодарности</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${reflectionProgress.gratitude}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Достижения</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${reflectionProgress.achievements}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Улучшения</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${reflectionProgress.improvements}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Озарения</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${reflectionProgress.insights}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Правила</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${reflectionProgress.rules}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Упражнение</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${reflectionProgress.exercise}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="progress-indicators flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="text-sm text-text-light-light dark:text-text-light-dark mb-1">Благодарность</div>
              <div className="h-2 bg-gray-200 rounded-full">
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
              <div className="h-2 bg-gray-200 rounded-full">
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
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${Math.min(100, 
                      (dayProgress.goals.filter(g => g.text.trim() !== '').length * 10) + 
                      (dayProgress.goals.filter(g => g.completed).length * 23.33)
                    )}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {dayNumber >= 1 && dayNumber <= 31 && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link to={`/day/${dayNumber}/step/1`}>
              <Button variant="primary">
                {isReflection ? 'Порефлексировать' : 'Заполнить день'}
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  };
  
  // Создаем массив недель в порядке отображения: сначала активная, затем остальные
  const getOrderedWeeks = (): number[] => {
    // Все недели
    const allWeeks = [1, 2, 3, 4, 5];
    
    // Перемещаем активную неделю в начало
    return [
      activeWeek,
      ...allWeeks.filter(week => week !== activeWeek)
    ];
  };
  
  const renderDayProgress = (dayNumber: number) => {
    const isReflection = isReflectionDay(dayNumber);
    const completion = getDayCompletion(dayNumber);
    const isCompleted = completion === 100;
    
    if (isReflection) {
      const reflectionProgress = getReflectionDayWidgetProgress(dayNumber);
      return (
        <div className="flex flex-col gap-1">
          <div className="progress-bar bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${reflectionProgress.gratitude}%` }}
            />
          </div>
          <div className="progress-bar bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${reflectionProgress.achievements}%` }}
            />
          </div>
          <div className="progress-bar bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-secondary transition-all duration-300 ease-in-out"
              style={{ width: `${reflectionProgress.improvements}%` }}
            />
          </div>
        </div>
      );
    }

    const dayProgress = getDayWidgetProgress(dayNumber);
    return (
      <div className="flex flex-col gap-1">
        <div className="progress-bar bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${dayProgress.gratitude}%` }}
          />
        </div>
        <div className="progress-bar bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${dayProgress.achievements}%` }}
          />
        </div>
        <div className="progress-bar bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary transition-all duration-300 ease-in-out"
            style={{ width: `${dayProgress.goals}%` }}
          />
        </div>
      </div>
    );
  };
  
  try {
    return (
      <div className="dashboard flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        
        <div className="content flex-1 md:ml-64 p-3 sm:p-4 md:p-6 pt-16 md:pt-6">
          
          {currentDayBlock()}
          
          <div className="weeks space-y-3 sm:space-y-4">
            {getOrderedWeeks().map(weekNumber => (
              <div key={weekNumber} className="week bg-surface-light dark:bg-surface-dark rounded-xl shadow-md overflow-hidden">
                <div 
                  className="week-header flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleWeek(weekNumber)}
                >
                  <h2 className="text-lg font-semibold flex items-center">
                    {weekNumber === 5 ? 'Бонус' : `Неделя ${weekNumber}`}
                    {isWeekCompleted(weekNumber) && (
                      <FaCheckCircle className="text-green-500 ml-2" size={18} />
                    )}
                  </h2>
                  <div className="flex items-center">
                    {!isWeekAccessible(weekNumber) && (
                      <FaLock className="text-gray-500 mr-2" />
                    )}
                    {isWeekExpanded(weekNumber) ? (
                      <FaChevronDown className="text-text-light-light dark:text-text-light-dark" />
                    ) : (
                      <FaChevronRight className="text-text-light-light dark:text-text-light-dark" />
                    )}
                  </div>
                </div>
                
                {isWeekExpanded(weekNumber) && (
                  <div className="week-content p-4 pt-0">
                    {generateDaysForWeek(weekNumber)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // В случае ошибки показываем запасной интерфейс
    console.error('Ошибка при рендеринге Dashboard:', error);
    
    return (
      <div className="dashboard flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        
        <div className="content flex-1 md:ml-64 p-3 sm:p-4 md:p-6 pt-16 md:pt-6 flex flex-col items-center justify-center">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-md p-6 max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Произошла ошибка при загрузке данных</h2>
            <p className="mb-6">Не удалось загрузить данные вашего прогресса. Пожалуйста, попробуйте обновить страницу или выйти и войти снова.</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90"
              >
                Обновить страницу
              </button>
              <Link to="/auth" className="text-primary hover:underline">
                Вернуться на страницу входа
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Dashboard;
