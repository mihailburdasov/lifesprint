import React, { ButtonHTMLAttributes, memo } from 'react';
import { useStableCallback } from './MemoizedComponent';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Улучшенный компонент кнопки с поддержкой доступности и мемоизацией
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isActive = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  // Базовые классы для всех кнопок
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary';
  
  // Классы для разных вариантов кнопок
  const variantClasses = {
    primary: `bg-primary text-white hover:bg-opacity-90 ${isActive ? 'bg-opacity-80' : ''}`,
    secondary: `bg-secondary text-white hover:bg-opacity-90 ${isActive ? 'bg-opacity-80' : ''}`,
    outline: `border border-gray-300 dark:border-gray-500 text-text dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}`,
    danger: `bg-red-600 text-white hover:bg-red-700 ${isActive ? 'bg-red-700' : ''}`,
  };
  
  // Классы для разных размеров кнопок (улучшены для мобильных устройств)
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-2.5 min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  };
  
  // Классы для ширины кнопки
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Классы для состояния загрузки
  const loadingClass = isLoading ? 'opacity-70 cursor-wait' : '';
  
  // Классы для отключенного состояния
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Объединение всех классов
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${loadingClass} ${disabledClass} ${className}`;
  
  // Мемоизация обработчика клика для предотвращения ненужных перерисовок
  const handleClick = useStableCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) {
      e.preventDefault();
      return;
    }
    
    onClick?.(e);
  }, [onClick, isLoading, disabled]);
  
  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-pressed={isActive}
      type={props.type || 'button'} // По умолчанию 'button', чтобы избежать случайной отправки формы
      {...props}
    >
      {/* Иконка слева */}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      
      {/* Индикатор загрузки или содержимое */}
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
      
      {/* Иконка справа */}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

// Мемоизация компонента для предотвращения ненужных перерисовок
export default memo(Button);
