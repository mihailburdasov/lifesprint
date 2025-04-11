import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Button from '../components/common/Button';
import Sidebar from '../components/layout/Sidebar';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  
  useEffect(() => {
    // Получаем email из state при переходе на страницу
    const state = location.state as { email?: string } | null;
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location]);
  
  // Функция для повторной отправки письма с подтверждением
  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Email не указан');
      return;
    }
    
    setIsResending(true);
    setResendMessage(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      
      if (error) {
        setResendMessage(`Ошибка: ${error.message}`);
      } else {
        setResendMessage('Письмо с подтверждением отправлено повторно');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResendMessage(`Ошибка: ${errorMessage}`);
    } finally {
      setIsResending(false);
    }
  };
  
  // Функция для проверки статуса подтверждения email
  const checkVerificationStatus = async () => {
    if (!email) return;
    
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        return;
      }
      
      if (data.user && data.user.email_confirmed_at) {
        // Email подтвержден, перенаправляем на главную страницу
        navigate('/');
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса подтверждения:', error);
    }
  };
  
  // Проверяем статус подтверждения при загрузке страницы и каждые 5 секунд
  useEffect(() => {
    checkVerificationStatus();
    
    const interval = setInterval(() => {
      checkVerificationStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [email]);
  
  return (
    <div className="email-verification-page flex min-h-screen bg-background iphone11pro-fix">
      <Sidebar />
      
      <div className="content flex-1 md:ml-64 p-4 md:p-8 flex justify-center items-center pt-16 md:pt-0 safe-area-inset">
        <div className="verification-card bg-surface rounded-xl shadow-lg p-5 md:p-8 w-full max-w-md mx-auto">
          <div className="text-center py-6">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold mb-3">Подтвердите ваш email</h2>
            
            <p className="mb-6">
              Мы отправили письмо с подтверждением на адрес{' '}
              <strong>{email || 'ваш email'}</strong>.
              <br />
              Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме.
            </p>
            
            <div className="space-y-3">
              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? 'Отправка...' : 'Отправить письмо повторно'}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => navigate('/auth')}
              >
                Вернуться на страницу входа
              </Button>
            </div>
            
            {resendMessage && (
              <div className={`mt-4 p-3 rounded-md ${
                resendMessage.startsWith('Ошибка') 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {resendMessage}
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-text-light">
              <p>
                Если вы не получили письмо, проверьте папку "Спам" или попробуйте отправить письмо повторно.
              </p>
              <p className="mt-2">
                После подтверждения email вы будете автоматически перенаправлены на главную страницу.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
