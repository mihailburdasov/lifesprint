import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/common/Button';
import { useUser } from '../context/UserContext';
import { apiService } from '../utils/apiService';

interface ProfileFormData {
  name: string;
  email: string;
  telegramNickname?: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useUser();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    telegramNickname: user?.telegramNickname || '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Перенаправляем на страницу входа, если пользователь не авторизован
  React.useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Обработка изменений в полях формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    
    setFormData(updatedFormData);
    
    // Сохраняем данные при изменении
    saveUserData(updatedFormData);
  };
  
  // Функция для сохранения данных пользователя
  const saveUserData = async (data: ProfileFormData) => {
    if (!user) return;
    
    try {
      // Обновляем данные пользователя через API
      const response = await apiService.updateUser(user.id, {
        name: data.name,
        email: data.email,
        telegramNickname: data.telegramNickname,
      });
      
      if (!response.success) {
        console.error('Ошибка при сохранении данных пользователя:', response.error);
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных пользователя:', error);
    }
  };
  
  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Обновляем данные пользователя через API
      const response = await apiService.updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        telegramNickname: formData.telegramNickname,
      });
      
      if (response.success && response.data) {
        setMessage({
          text: 'Профиль успешно обновлен',
          type: 'success',
        });
        
        setIsEditing(false);
      } else {
        setMessage({
          text: response.error || 'Ошибка при обновлении профиля',
          type: 'error',
        });
      }
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
  
  return (
    <div className="settings-page flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      {isLoading ? (
        <div className="content flex-1 md:ml-64 p-6 flex justify-center items-center">
          <div className="text-center">
            <p className="text-lg">Загрузка...</p>
          </div>
        </div>
      ) : !isAuthenticated ? null : (
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
                  className={`input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
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
                  className={`input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
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
                  className={`input w-full ${!isEditing ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                  placeholder="@username"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || '',
                          email: user?.email || '',
                          telegramNickname: user?.telegramNickname || '',
                        });
                        setMessage(null);
                      }}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setIsEditing(true);
                      setMessage(null);
                    }}
                  >
                    Редактировать
                  </Button>
                )}
              </div>
            </form>
            
            {/* Настройки аккаунта */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Настройки аккаунта</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium mb-2">Изменить пароль</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // В реальном приложении здесь был бы переход на страницу смены пароля
                      alert('Функция смены пароля будет доступна в следующей версии');
                    }}
                  >
                    Сменить пароль
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-2">Удаление аккаунта</h3>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      // В реальном приложении здесь был бы запрос на удаление аккаунта
                      if (window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
                        alert('Функция удаления аккаунта будет доступна в следующей версии');
                      }
                    }}
                  >
                    Удалить аккаунт
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
