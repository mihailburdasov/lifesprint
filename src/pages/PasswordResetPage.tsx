import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Button from '../components/common/Button';
import Sidebar from '../components/layout/Sidebar';

const PasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  // Получаем email из state при переходе на страницу
  useEffect(() => {
    const state = location.state as { email?: string } | null;
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ text: 'Пожалуйста, введите ваш email', isError: true });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-confirm`,
      });
      
      if (error) {
        setMessage({ text: `Ошибка: ${error.message}`, isError: true });
      } else {
        setMessage({ 
          text: 'Инструкции по сбросу пароля отправлены на ваш email', 
          isError: false 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage({ text: `Ошибка: ${errorMessage}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="password-reset-page flex min-h-screen bg-background iphone11pro-fix">
      <Sidebar />
      
      <div className="content flex-1 md:ml-64 p-4 md:p-8 flex justify-center items-center pt-16 md:pt-0 safe-area-inset">
        <div className="reset-card bg-surface rounded-xl shadow-lg p-5 md:p-8 w-full max-w-md mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">
            Восстановление пароля
          </h1>
          
          <p className="mb-6 text-center">
            Введите ваш email, и мы отправим вам ссылку для сброса пароля.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-light mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full h-11 text-base"
                placeholder="Введите ваш email"
              />
            </div>
            
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? 'Отправка...' : 'Отправить инструкции'}
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

export default PasswordResetPage;
