/**
 * Button component
 */

import React from 'react';
import { ButtonProps } from '../types/components';

/**
 * Button component
 */
export const Button: React.FC<ButtonProps & { children: React.ReactNode }> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) => {
  // Base classes
  const baseClasses = 'font-medium rounded-md transition-colors focus:outline-none';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-darker disabled:bg-primary-light dark:disabled:bg-gray-700 dark:disabled:text-gray-500',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark active:bg-secondary-darker disabled:bg-secondary-light dark:disabled:bg-gray-700 dark:disabled:text-gray-500',
    outline: 'bg-transparent border border-primary text-primary dark:text-primary-light hover:bg-primary-light dark:hover:bg-gray-700 active:bg-primary-lighter disabled:border-primary-light disabled:text-primary-light dark:disabled:border-gray-600 dark:disabled:text-gray-500',
    text: 'bg-transparent text-primary dark:text-primary-light hover:bg-primary-light dark:hover:bg-gray-700 active:bg-primary-lighter disabled:text-primary-light dark:disabled:text-gray-500',
  };
  
  // Combine classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
