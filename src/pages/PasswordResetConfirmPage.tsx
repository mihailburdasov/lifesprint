import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Button from '../components/common/Button';
import Sidebar from '../components/layout/Sidebar';

const PasswordResetConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  // Проверяем, есть ли хэш для сброса пароля в URL
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      setMessage({
        text: 'Недействительная или истекшая ссылка для сброса пароля',
        isError: true
      });
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setMessage({ text: 'Пожалуйста, введите новый пароль', isError: true });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({ text: 'Пароли не совпадают', isError: true });
      return;
    }
    
    if (password.length < 6) {
      setMessage({ text: 'Пароль должен содержать не менее 6 символов', isError: true });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setMessage({ text: `Ошибка: ${error.message}`, isError: true });
      } else {
        setMessage({ 
          text: 'Пароль успешно изменен! Сейчас вы будете перенаправлены на страницу входа.', 
          isError: false 
        });
        
        // Перенаправляем на страницу входа через 3 секунды
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage({ text: `Ошибка: ${errorMessage}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="password-reset-confirm-page flex min-h-screen bg-background iphone11pro-fix">
      <Sidebar />
      
      <div className="content flex-1 md:ml-64 p-4 md:p-8 flex justify-center items-center pt-16 md:pt-0 safe-area-inset">
        <div className="reset-confirm-card bg-surface rounded-xl shadow-lg p-5 md:p-8 w-full max-w-md mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">
            Создание нового пароля
          </h1>
          
          <p className="mb-6 text-center">
            Введите новый пароль для вашей учетной записи.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-light mb-1">
                Новый пароль
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full h-11 text-base"
                placeholder="Введите новый пароль"
                disabled={!!message?.isError}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input w-full h-11 text-base"
                placeholder="Повторите новый пароль"
                disabled={!!message?.isError}
              />
            </div>
            
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading || !!message?.isError}
              >
                {isLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
              </Button>
            </div>
          </form>
          
          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-primary hover:underline focus:outline-none min-h-[44px] inline-flex items-center"
            >
              Вернуться на страницу входа
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirmPage;
