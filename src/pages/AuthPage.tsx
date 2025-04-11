import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/common/Button';
import { useUser } from '../context/UserContext';
import { validationService } from '../utils/validationService';
import { logService } from '../utils/logService';

// Типы для формы авторизации
type AuthMode = 'login' | 'register' | 'verification';

interface FormData {
  email: string;
  password: string;
  name?: string;
  telegramNickname?: string;
}

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, error: authError, login, register } = useUser();
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

  // Валидация формы с использованием validationService
  const validateForm = (): boolean => {
    if (mode === 'login') {
      // Валидация формы входа
      const validation = validationService.validateLoginForm(
        formData.email,
        formData.password
      );
      
      setErrors(validation.errors);
      return validation.valid;
    } else {
      // Валидация формы регистрации
      const validation = validationService.validateRegistrationForm(
        formData.name || '',
        formData.email,
        formData.password,
        formData.password, // Здесь должен быть confirmPassword, но в текущей форме его нет
        formData.telegramNickname
      );
      
      setErrors(validation.errors);
      return validation.valid;
    }
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
        const loginResult = await login({
          email: formData.email,
          password: formData.password
        });
        
        // Если вход успешен, перенаправление произойдет автоматически через useEffect
        if (loginResult) {
          // Проверяем, есть ли локальные данные, которые нужно мигрировать
          const localUserData = localStorage.getItem(`lifesprint_user_${formData.email}`);
          if (localUserData) {
            // Предлагаем пользователю перейти на страницу миграции
            if (window.confirm('У вас есть локальные данные, которые можно перенести в облачное хранилище. Хотите перейти на страницу миграции?')) {
              navigate('/migration');
            }
          }
        }
      } else if (mode === 'register') {
        const result = await register({
          name: formData.name || '',
          email: formData.email,
          password: formData.password,
          telegramNickname: formData.telegramNickname
        });
        
        // Если регистрация прошла успешно, перенаправляем на страницу подтверждения email
        if (result) {
          navigate('/verify-email', { state: { email: formData.email } });
        }
      }
    } catch (error) {
      logService.error('Ошибка авторизации', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Рендер формы в зависимости от режима
  const renderForm = () => {
    if (mode === 'verification') {
      return (
        <div className="text-center py-6">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-3">Регистрация успешна!</h2>
          <p className="mb-6">
            Ваш аккаунт успешно создан. Проверьте вашу электронную почту для подтверждения аккаунта.
          </p>
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={() => {
              setMode('login');
            }}
          >
            Перейти к входу
          </Button>
        </div>
      );
    }
    
    return (
      <>
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
                    value={validationService.sanitizeInput(formData.name || '')}
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
                    value={validationService.sanitizeInput(formData.telegramNickname || '')}
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
                value={validationService.sanitizeInput(formData.email)}
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
                fullWidth
                disabled={isLoading}
                className="mt-2"
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
              onClick={() => {
                const email = formData.email;
                navigate('/reset-password', { state: { email } });
              }}
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
      </>
    );
  };

  return (
    <div className="auth-page flex min-h-screen bg-background iphone11pro-fix">
      <Sidebar />
      
      <div className="content flex-1 md:ml-64 p-4 md:p-8 flex justify-center items-center pt-16 md:pt-0 safe-area-inset">
        <div className="auth-card bg-surface rounded-xl shadow-lg p-5 md:p-8 w-full max-w-md mx-auto">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
