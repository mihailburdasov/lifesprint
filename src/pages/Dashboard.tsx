import React, { useState } from 'react';
import { UserProgress } from '../context/ProgressContext';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaChevronDown, FaChevronRight, FaLock } from 'react-icons/fa';
import Sidebar from '../components/layout/Sidebar';
import { useProgress } from '../context/ProgressContext';
import { formatDate, getDayTitle } from '../utils/dateUtils';
import Button from '../components/common/Button';

const Dashboard: React.FC = () => {
  // Вызываем хук useProgress на верхнем уровне компонента
  const { progress, getDayCompletion, isReflectionDay, updateDayProgress, isDayAccessible, isWeekAccessible } = useProgress();
  
  // Создаем состояние для expandedWeeks
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]); // Start with week 1 expanded
  
  // Create a default empty progress object that matches the UserProgress interface
  const emptyProgress: UserProgress = {
    startDate: new Date(),
    currentDay: 1,
    days: {},
    weekReflections: {}
  };
  
  // Use the progress from context or the empty progress if it's undefined
  const safeProgress = progress || emptyProgress;
  
  // Оборачиваем в try-catch только рендеринг, но не вызов хуков
  try {
    
    // Toggle week expansion
    const toggleWeek = (weekNumber: number) => {
      // Only allow toggling if the week is accessible
      if (!isWeekAccessible(weekNumber)) return;
      
      if (expandedWeeks.includes(weekNumber)) {
        setExpandedWeeks(expandedWeeks.filter(week => week !== weekNumber));
      } else {
        setExpandedWeeks([...expandedWeeks, weekNumber]);
      }
    };
    
    // Check if a week is expanded
    const isWeekExpanded = (weekNumber: number) => {
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
          <div 
            key={dayNumber}
            className="day-card bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow border-l-4 border-secondary relative"
          >
              <div className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center mr-2 sm:mr-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs">
                    {dayNumber}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">Бонусный день {i + 1}</h3>
                </div>
                
                <div className="ml-1 sm:ml-2">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                    <div 
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        background: `conic-gradient(#4F46E5 0%, #f3f4f6 0)`,
                        color: 'inherit',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.05) inset'
                      }}
                    >
                      0%
                    </div>
                  </div>
                </div>
              </div>
            <div className="absolute inset-0 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center">
              <FaLock className="text-white text-2xl" />
            </div>
          </div>
          );
        }
        
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mt-3">
            {days}
          </div>
        );
      }
      
      // Regular weeks (1-4)
      for (let i = 0; i < 7; i++) {
        const dayNumber = startDay + i;
        if (dayNumber > 28) break; // Only 28 days in the regular sprint
        
        const dayDate = new Date(safeProgress.startDate);
        dayDate.setDate(dayDate.getDate() + dayNumber - 1);
        
        const completion = getDayCompletion ? getDayCompletion(dayNumber) : 0;
        const isReflection = isReflectionDay ? isReflectionDay(dayNumber) : false;
        
        days.push(
          isDayAccessible(dayNumber) ? (
            <Link 
              to={`/day/${dayNumber}`}
              key={dayNumber}
              className={`day-card bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow ${isReflection ? 'border-l-4 border-secondary' : ''} block`}
            >
              <div className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center mr-2 sm:mr-3">
                  {completion === 100 ? (
                    <FaCheckCircle className="text-green-500" size={18} />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs">
                      {dayNumber}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">{getDayTitle ? getDayTitle(dayNumber) : `День ${dayNumber}`}</h3>
                  <p className="text-sm text-text-light-light dark:text-text-light-dark">{formatDate ? formatDate(dayDate) : dayDate.toLocaleDateString()}</p>
                </div>
                
                <div className="ml-1 sm:ml-2">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                    <div 
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-medium"
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
              </div>
              
            </Link>
          ) : (
            <div 
              key={dayNumber}
              className={`day-card bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm p-3 sm:p-4 transition-shadow relative ${isReflection ? 'border-l-4 border-secondary' : ''}`}
            >
              <div className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center mr-2 sm:mr-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs">
                    {dayNumber}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">{getDayTitle ? getDayTitle(dayNumber) : `День ${dayNumber}`}</h3>
                  <p className="text-sm text-text-light-light dark:text-text-light-dark">{formatDate ? formatDate(dayDate) : dayDate.toLocaleDateString()}</p>
                </div>
                
                <div className="ml-1 sm:ml-2">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                    <div 
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-medium"
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
              </div>
              
              <div className="absolute inset-0 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center">
                <FaLock className="text-white text-2xl" />
              </div>
            </div>
          )
        );
      }
      
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mt-3">
          {days}
        </div>
      );
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
      
      const completion = getDayCompletion ? getDayCompletion(dayNumber) : 0;
      
      return (
        <div className="current-day bg-surface-light dark:bg-surface-dark rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0">
              День {dayNumber} ({formatDate ? formatDate(dayDate) : dayDate.toLocaleDateString()})
              <span className="block sm:inline sm:ml-2 font-normal text-text-light-light dark:text-text-light-dark">
                {getDayTitle ? getDayTitle(dayNumber) : `День ${dayNumber}`}
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
          
          {dayNumber >= 1 && dayNumber <= 31 && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link to={`/day/${dayNumber}/step/1`}>
                <Button variant="primary">
                  {isReflectionDay(dayNumber) ? 'Порефлексировать' : 'Заполнить день'}
                </Button>
              </Link>
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div className="dashboard flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        
        <div className="content flex-1 md:ml-64 p-3 sm:p-4 md:p-6 pt-16 md:pt-6">
          
          {currentDayBlock()}
          
          <div className="weeks space-y-3 sm:space-y-4">
            {[1, 2, 3, 4, 5].map(weekNumber => (
              <div key={weekNumber} className="week bg-surface-light dark:bg-surface-dark rounded-xl shadow-md overflow-hidden">
                <div 
                  className="week-header flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleWeek(weekNumber)}
                >
                  <h2 className="text-lg font-semibold">{weekNumber === 5 ? 'Бонус' : `Неделя ${weekNumber}`}</h2>
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
                    {renderWeekDays(weekNumber)}
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
