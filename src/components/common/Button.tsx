import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isActive = false,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: `bg-primary text-white hover:bg-opacity-90 focus:ring-primary ${isActive ? 'bg-opacity-80 shadow-inner' : ''}`,
    secondary: `bg-secondary text-white hover:bg-opacity-90 focus:ring-secondary ${isActive ? 'bg-opacity-80 shadow-inner' : ''}`,
    outline: `border border-gray-300 text-text hover:bg-gray-50 focus:ring-primary ${isActive ? 'bg-gray-100 dark:bg-gray-700 shadow-inner border-gray-400 dark:border-gray-500' : ''}`,
    danger: `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 ${isActive ? 'bg-red-700 shadow-inner' : ''}`,
  };
  
  // Adjusted size classes for better mobile touch targets
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-2.5 min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;
  
  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
