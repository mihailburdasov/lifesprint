import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/common/Button';
import { useUser } from '../context/UserContext';

const MigrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { migrationStatus, migrateToSupabase, clearLocalData } = useUser();
  const [localDataCleared, setLocalDataCleared] = useState<boolean>(false);
  
  // Запуск миграции данных
  const handleMigration = async () => {
    await migrateToSupabase();
  };
  
  // Очистка локальных данных
  const handleClearLocalData = () => {
    clearLocalData();
    setLocalDataCleared(true);
  };
  
  return (
    <div className="migration-page flex min-h-screen bg-background iphone11pro-fix">
      <Sidebar />
      
      <div className="content flex-1 md:ml-64 p-4 md:p-8 flex justify-center items-center pt-16 md:pt-0 safe-area-inset">
        <div className="migration-card bg-surface rounded-xl shadow-lg p-5 md:p-8 w-full max-w-md mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">
            Миграция данных
          </h1>
          
          <div className="mb-6">
            <p className="mb-4">
              Этот процесс перенесет ваши локальные данные в облачную базу данных Supabase.
              Это позволит вам использовать приложение на разных устройствах и не потерять данные.
            </p>
            
            {migrationStatus.message && (
              <div className={`p-3 rounded-md mb-4 ${
                migrationStatus.success === true 
                  ? 'bg-green-100 text-green-700' 
                  : migrationStatus.success === false 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {migrationStatus.message}
                
                {migrationStatus.success === true && (
                  <p className="mt-2 text-sm">
                    Успешно мигрировано {migrationStatus.migratedUsers} из {migrationStatus.totalUsers} пользователей.
                  </p>
                )}
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button
                variant="primary"
                onClick={handleMigration}
                disabled={migrationStatus.inProgress || migrationStatus.success === true}
              >
                {migrationStatus.inProgress 
                  ? 'Миграция...' 
                  : migrationStatus.success === true 
                    ? 'Миграция завершена' 
                    : 'Начать миграцию'}
              </Button>
              
              {migrationStatus.success === true && !localDataCleared && (
                <Button
                  variant="secondary"
                  onClick={handleClearLocalData}
                >
                  Очистить локальные данные
                </Button>
              )}
              
              {(migrationStatus.success === true || localDataCleared) && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/')}
                >
                  Вернуться на главную
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-2">Что будет мигрировано?</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Данные пользователей (имя, email, никнейм в Telegram)</li>
              <li>Прогресс по дням</li>
              <li>Еженедельные рефлексии</li>
            </ul>
            
            <div className="mt-4">
              <p className="text-sm text-text-light">
                <strong>Примечание:</strong> После успешной миграции рекомендуется очистить локальные данные, 
                чтобы избежать конфликтов между локальными и облачными данными.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationPage;
