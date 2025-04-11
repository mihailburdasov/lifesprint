import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/react';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div className="error-container p-4 bg-red-50 border border-red-200 rounded-md m-4">
    <h2 className="text-lg font-medium text-red-800 mb-2">Что-то пошло не так</h2>
    <p className="text-sm text-red-600 mb-4">{error.message}</p>
    <button 
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
    >
      Попробовать снова
    </button>
  </div>
);

export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, info) => {
      // Отправляем ошибку в Sentry
      Sentry.captureException(error, { 
        extra: { 
          componentStack: info.componentStack 
        } 
      });
      
      // Также можно логировать ошибки в консоль в режиме разработки
      if (process.env.NODE_ENV !== 'production') {
        console.error('Ошибка в компоненте:', error);
        console.error('Информация о компоненте:', info.componentStack);
      }
    }}
    onReset={() => {
      // Действия при сбросе ошибки, например, перезагрузка данных
      window.location.href = '/';
    }}
  >
    {children}
  </ErrorBoundary>
);

// Компонент для тестирования ошибок (можно удалить в продакшене)
export const ErrorThrower: React.FC = () => {
  const [throwError, setThrowError] = React.useState(false);
  
  if (throwError) {
    throw new Error('Это тестовая ошибка!');
  }
  
  return (
    <button 
      onClick={() => setThrowError(true)}
      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
    >
      Вызвать ошибку
    </button>
  );
};
