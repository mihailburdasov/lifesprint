import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../features/dashboard/components/Sidebar';
import { useUser } from '../../../context/UserContext';
import { useProgress } from '../../../features/day/context';
import { DayProgress } from '../../../features/day/types/progress';
import { FaUser, FaChartLine, FaCog } from 'react-icons/fa';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useUser();
  const { progress, getDayCompletion } = useProgress();
  
  // Статистика пользователя
  const [userStats, setUserStats] = useState({
    thanksCount: 0,
    achievementsCount: 0,
    goalsCount: 0,
    goalsCompletedCount: 0,
    streak: 0,
    completionPercentage: 0
  });
  
  // Перенаправляем на страницу входа, если пользователь не авторизован
  useEffect(() => {
  if (!isAuthenticated && !isLoading) {
    navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Вычисляем статистику при загрузке и при изменении прогресса
  useEffect(() => {
    if (!progress) return;
    
    let thanksCount = 0;
    let achievementsCount = 0;
    let goalsCount = 0;
    let completedDays = 0;
    let streak = 0;
    let currentStreak = 0;
    
    // Получаем текущую дату
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Получаем дату начала спринта
    const startDate = new Date(progress.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    // Вычисляем количество дней с начала спринта
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalAccessibleDays = Math.min(daysSinceStart, 31); // Максимум 31 день в спринте
    
    // Подсчет благодарностей, достижений и целей
    let goalsCompletedCount = 0;
    
    Object.entries(progress.days).forEach(([dayNumberStr, day]: [string, DayProgress]) => {
      const dayNumber = parseInt(dayNumberStr, 10);
      
      // Подсчет благодарностей
      thanksCount += day.gratitude.filter(item => item.trim() !== '').length;
      
      // Подсчет достижений
      achievementsCount += day.achievements.filter(item => item.trim() !== '').length;
      
      // Подсчет целей
      goalsCount += day.goals.filter(goal => goal.text.trim() !== '').length;
      
      // Подсчет выполненных целей
      goalsCompletedCount += day.goals.filter(goal => goal.completed).length;
      
      // Проверяем, заполнен ли день
      const dayCompletion = getDayCompletion(dayNumber);
      if (dayCompletion >= 50) { // Считаем день заполненным, если выполнено хотя бы 50%
        completedDays++;
        
        // Проверяем, является ли день частью текущей серии
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayNumber - 1);
        
        // Если день сегодняшний или вчерашний, увеличиваем текущую серию
        const isToday = dayDate.getTime() === today.getTime();
        const isYesterday = dayDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000;
        
        if (isToday || isYesterday || currentStreak > 0) {
          currentStreak++;
        }
      }
    });
    
    // Вычисляем процент заполнения профиля
    const completionPercentage = totalAccessibleDays > 0 
      ? Math.round((completedDays / totalAccessibleDays) * 100) 
      : 0;
    
    // Устанавливаем серию дней
    streak = currentStreak;
    
    setUserStats({
      thanksCount,
      achievementsCount,
      goalsCount,
      goalsCompletedCount,
      streak,
      completionPercentage
    });
  }, [progress, getDayCompletion]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-6 flex justify-center items-center">
          <div className="text-center">
            <p className="text-lg">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-3 sm:p-4 md:p-6 pt-16 md:pt-6">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Профиль</h1>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <FaUser className="text-2xl text-white" />
            </div>
              <div>
                <h2 className="text-xl font-semibold">{user?.name}</h2>
                <p className="text-text-light-light dark:text-text-light-dark">{user?.email}</p>
                {user?.telegramNickname && (
                  <p className="text-text-light-light dark:text-text-light-dark">
                    Telegram: {user.telegramNickname}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Статистика пользователя */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Ваша статистика</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary mb-2">{userStats.thanksCount}</div>
                <div className="text-sm text-text-light-light dark:text-text-light-dark">
                  {userStats.thanksCount === 1 ? 'Благодарность' : 
                   userStats.thanksCount >= 2 && userStats.thanksCount <= 4 ? 'Благодарности' : 
                   'Благодарностей'}
                </div>
              </div>
              
              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary mb-2">{userStats.achievementsCount}</div>
                <div className="text-sm text-text-light-light dark:text-text-light-dark">
                  {userStats.achievementsCount === 1 ? 'Достижение' : 
                   userStats.achievementsCount >= 2 && userStats.achievementsCount <= 4 ? 'Достижения' : 
                   'Достижений'}
                </div>
            </div>
            
              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
            <div>
                    <div className="text-3xl font-bold text-gray-500">{userStats.goalsCount}</div>
                    <div className="text-sm text-text-light-light dark:text-text-light-dark">
                      {userStats.goalsCount === 1 ? 'Задача поставлена' : 
                       userStats.goalsCount >= 2 && userStats.goalsCount <= 4 ? 'Задачи поставлены' : 
                       'Задач поставлено'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{userStats.goalsCompletedCount}</div>
                    <div className="text-sm text-text-light-light dark:text-text-light-dark">
                      {userStats.goalsCompletedCount === 1 ? 'Задача выполнена' : 
                       userStats.goalsCompletedCount >= 2 && userStats.goalsCompletedCount <= 4 ? 'Задачи выполнены' : 
                       'Задач выполнено'}
                    </div>
                  </div>
            </div>
            
                {userStats.goalsCount > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full shadow-sm" 
                        style={{ width: `${(userStats.goalsCompletedCount / userStats.goalsCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-right mt-1 text-text-light-light dark:text-text-light-dark">
                      {Math.round((userStats.goalsCompletedCount / userStats.goalsCount) * 100)}% выполнено
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Прогресс спринта</div>
                  <div className="text-sm font-bold">{userStats.completionPercentage}%</div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-primary h-2.5 rounded-full shadow-sm" 
                    style={{ width: `${userStats.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary mb-2">{userStats.streak}</div>
                <div className="text-sm text-text-light-light dark:text-text-light-dark">
                  {userStats.streak === 1 ? 'День подряд' : 
                   userStats.streak >= 2 && userStats.streak <= 4 ? 'Дня подряд' : 
                   'Дней подряд'}
                </div>
              </div>
            </div>
          </div>

          {/* Действия */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center space-x-2 p-4 bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <FaChartLine className="text-xl text-primary" />
              <span>Продолжить спринт</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center space-x-2 p-4 bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <FaCog className="text-xl text-primary" />
              <span>Настройки</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
