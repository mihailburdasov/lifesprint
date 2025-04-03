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
  const baseClasses = 'rounded-md font-medium transition-colors focus:outline-none';
  
  const variantClasses = {
    primary: `bg-primary text-white hover:bg-opacity-90 ${isActive ? 'bg-opacity-80' : ''}`,
    secondary: `bg-secondary text-white hover:bg-opacity-90 ${isActive ? 'bg-opacity-80' : ''}`,
    outline: `border border-gray-300 dark:border-gray-600 text-text hover:bg-gray-50 ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}`,
    danger: `bg-red-600 text-white hover:bg-red-700 ${isActive ? 'bg-red-700' : ''}`,
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
