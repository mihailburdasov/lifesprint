import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../features/dashboard/components/Sidebar';
import { useUser } from '../../../context/UserContext';

interface ProfileFormData {
  name: string;
  email: string;
  telegramNickname?: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logoutFromAllDevices } = useUser();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    telegramNickname: user?.telegramNickname || '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Перенаправляем на страницу входа, если пользователь не авторизован
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Обработка изменений в полях формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Здесь будет запрос к API для обновления данных
      await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация запроса
      
      setMessage({
        text: 'Профиль успешно обновлен',
        type: 'success',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      setMessage({
        text: 'Ошибка при обновлении профиля',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="settings-page flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      <div className="content flex-1 md:ml-64 p-3 sm:p-4 md:p-6 pt-16 md:pt-6">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Настройки пользователя</h1>
          
          {message && (
            <div 
              className={`mb-6 p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Имя
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${
                  !isEditing ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'
                } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${
                  !isEditing ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'
                } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
            
            <div>
              <label htmlFor="telegramNickname" className="block text-sm font-medium mb-1">
                Никнейм в Telegram
              </label>
              <input
                type="text"
                id="telegramNickname"
                name="telegramNickname"
                value={formData.telegramNickname}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="@username"
                className={`w-full px-3 py-2 rounded-md border ${
                  !isEditing ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'
                } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        telegramNickname: user?.telegramNickname || '',
                      });
                      setMessage(null);
                    }}
                    className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setMessage(null);
                  }}
                  className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark"
                >
                  Редактировать
                </button>
              )}
            </div>
          </form>
          
          {/* Настройки аккаунта */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Настройки аккаунта</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium mb-2">Выход со всех устройств</h3>
                <p className="text-sm text-text-light mb-2">
                  Завершите все активные сессии на всех устройствах, где вы вошли в аккаунт.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите выйти со всех устройств? Вам придется войти заново на каждом устройстве.')) {
                      logoutFromAllDevices();
                      navigate('/auth');
                    }
                  }}
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Выйти со всех устройств
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
