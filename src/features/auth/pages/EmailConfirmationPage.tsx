import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../core/components';
import { ROUTES } from '../../../shared/constants';
import { supabase } from '../../../core/services/supabase';
import { useUser } from '../../../context/UserContext';

const EmailConfirmationPage: React.FC = () => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const { registrationEmail, completeRegistration } = useUser();
  const navigate = useNavigate();

  // Проверка статуса подтверждения email
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      try {
        setIsChecking(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.email_confirmed_at) {
          console.log('Email подтвержден:', user.email_confirmed_at);
          setIsConfirmed(true);
          
          // Запускаем обратный отсчет для автоматического перенаправления
          let countdown = 5;
          const timer = setInterval(() => {
            countdown -= 1;
            setRedirectCountdown(countdown);
            
            if (countdown <= 0) {
              clearInterval(timer);
              completeRegistration(); // Сбрасываем состояние регистрации
              navigate(ROUTES.PROFILE); // Перенаправляем в профиль
            }
          }, 1000);
          
          return () => clearInterval(timer);
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса email:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkEmailConfirmation();
    
    // Периодически проверяем статус подтверждения email
    const interval = setInterval(checkEmailConfirmation, 5000);
    return () => clearInterval(interval);
  }, [navigate, completeRegistration]);
  
  // Повторная отправка письма с подтверждением
  const resendConfirmationEmail = async () => {
    try {
      const email = registrationEmail || prompt('Введите ваш email:');
      if (!email) return;
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) {
        throw error;
      }
      
      alert('Письмо отправлено повторно. Пожалуйста, проверьте вашу почту.');
    } catch (error) {
      console.error('Ошибка при повторной отправке письма:', error);
      alert('Произошла ошибка при отправке письма. Пожалуйста, попробуйте позже.');
    }
  };

  // Отображаем разный контент в зависимости от статуса подтверждения
  const renderContent = () => {
    if (isChecking) {
      return (
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold mb-2">Проверяем статус подтверждения...</h1>
          <p className="text-text-light mb-4">
            Пожалуйста, подождите, мы проверяем статус подтверждения вашего email.
          </p>
        </div>
      );
    }
    
    if (isConfirmed) {
      return (
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold mb-2">Ваш email подтвержден</h1>
          <p className="text-text-light mb-4">
            Добро пожаловать в приложение LifeSprint! Вы будете перенаправлены в профиль через {redirectCountdown} секунд.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              completeRegistration();
              navigate(ROUTES.PROFILE);
            }}
          >
            Перейти в профиль сейчас
          </Button>
        </div>
      );
    }
    
    return (
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl md:text-2xl font-bold mb-2">Подтвердите ваш email</h1>
        <p className="text-text-light mb-4">
          Мы отправили письмо с ссылкой для подтверждения на ваш email.
          Пожалуйста, проверьте вашу почту и перейдите по ссылке для активации аккаунта.
        </p>
        <p className="text-sm text-text-light-light mb-6">
          Если вы не получили письмо, проверьте папку "Спам" или нажмите кнопку ниже, чтобы отправить письмо повторно.
        </p>
      </div>
    );
  };

  return (
    <div className="auth-page flex min-h-screen bg-background iphone11pro-fix">
      <div className="content flex-1 p-4 md:p-8 flex justify-center items-center pt-16 md:pt-8 safe-area-inset">
        <div className="absolute top-4 left-4">
          <Link to="/" className="text-xl font-bold text-primary">LifeSprint</Link>
        </div>
        <div className="auth-card bg-surface rounded-xl shadow-lg p-5 md:p-8 w-full max-w-md mx-auto">
          {renderContent()}
          
          {!isConfirmed && !isChecking && (
            <div className="space-y-4">
              <Button
                variant="primary"
                className="w-full"
                onClick={resendConfirmationEmail}
              >
                Отправить письмо повторно
              </Button>
              
              <Link to={ROUTES.LOGIN} className="block text-center">
                <Button variant="outline" className="w-full">
                  Вернуться на страницу входа
                </Button>
              </Link>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-text-light">
              Нужна помощь? <a href="mailto:support@lifesprint.ru" className="text-primary hover:underline">Свяжитесь с нами</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;
