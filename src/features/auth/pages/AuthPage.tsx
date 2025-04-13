import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../features/dashboard/components/Sidebar';
import { Button } from '../../../core/components';
import { useUser } from '../../../context/UserContext';

// Типы для формы авторизации
type AuthMode = 'login' | 'register';

interface FormData {
  email: string;
  password: string;
  name?: string;
  telegramNickname?: string;
}

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, error: authError, login, register } = useUser();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    telegramNickname: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Перенаправление на главную, если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Переключение между режимами входа и регистрации
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
  };

  // Обработка изменений в полях формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Очистка ошибки при изменении поля
    if (errors[name as keyof FormData]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    // Проверка email
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }
    
    // Проверка пароля
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    
    // Проверка имени при регистрации
    if (mode === 'register' && !formData.name) {
      newErrors.name = 'Имя обязательно';
    }
    
    // Telegram никнейм не обязателен, поэтому не проверяем
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        await register({
          name: formData.name || '',
          email: formData.email,
          password: formData.password,
          telegramNickname: formData.telegramNickname
        });
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-screen bg-background iphone11pro-fix">
      <Sidebar />
      
      <div className="content flex-1 md:ml-64 p-4 md:p-8 flex justify-center items-center pt-16 md:pt-0 safe-area-inset">
        <div className="auth-card bg-surface rounded-xl shadow-lg p-5 md:p-8 w-full max-w-md mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">
            {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-light mb-1">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input w-full h-11 text-base ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Введите ваше имя"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="telegramNickname" className="block text-sm font-medium text-text-light mb-1">
                    Никнейм в Telegram (по желанию)
                  </label>
                  <input
                    type="text"
                    id="telegramNickname"
                    name="telegramNickname"
                    value={formData.telegramNickname}
                    onChange={handleChange}
                    className="input w-full h-11 text-base"
                    placeholder="@username"
                  />
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-light mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input w-full h-11 text-base ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Введите ваш email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-light mb-1">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input w-full h-11 text-base ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Введите ваш пароль"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </div>
          </form>
          
          {authError && (
            <div className="mt-3 md:mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {authError}
            </div>
          )}
          
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-text-light">
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 text-primary hover:underline focus:outline-none min-h-[44px] inline-flex items-center"
              >
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </div>
          
          {mode === 'login' && (
            <div className="mt-3 md:mt-4 text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline focus:outline-none min-h-[44px] inline-flex items-center justify-center px-2"
              >
                Забыли пароль?
              </button>
            </div>
          )}
          
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
            <p className="text-xs text-text-light text-center">
              Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
