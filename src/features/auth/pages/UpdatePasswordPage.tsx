import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../core/components';
import { useUser } from '../../../context/UserContext';

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatePassword, isLoading: authLoading, error: authError } = useUser();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Обработка изменения пароля
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  };

  // Обработка изменения подтверждения пароля
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setError(null);
  };

  // Валидация формы
  const validateForm = (): boolean => {
    if (!password) {
      setError('Пароль обязателен');
      return false;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }

    return true;
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      
      // Перенаправление на страницу входа через 3 секунды
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (e) {
      console.error('Ошибка обновления пароля:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-screen bg-background iphone11pro-fix">
      <div className="content flex-1 p-4 md:p-8 flex justify-center items-center pt-16 md:pt-8 safe-area-inset">
        <div className="absolute top-4 left-4">
          <Link to="/" className="text-xl font-bold text-primary">LifeSprint</Link>
        </div>
        <div className="auth-card bg-surface rounded-xl shadow-lg p-5 md:p-8 w-full max-w-md mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">
            Создание нового пароля
          </h1>
          
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-light mb-1">
                  Новый пароль
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="input w-full h-11 text-base"
                  placeholder="Введите новый пароль"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-light mb-1">
                  Подтверждение пароля
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className="input w-full h-11 text-base"
                  placeholder="Подтвердите новый пароль"
                />
              </div>
              
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full mt-2"
                >
                  {isLoading ? 'Загрузка...' : 'Обновить пароль'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-4 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg mb-4">Пароль успешно обновлен!</p>
              <p className="text-sm text-text-light-light">Вы будете перенаправлены на страницу входа через несколько секунд...</p>
            </div>
          )}
          
          {(error || authError) && (
            <div className="mt-3 md:mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error || authError}
            </div>
          )}
          
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-text-light">
              Вспомнили пароль?
              <Link to="/login" className="ml-2 text-primary hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
