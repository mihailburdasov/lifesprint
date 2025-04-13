/**
 * Card component
 */

import React from 'react';
import { CardProps } from '../types/components';

/**
 * Card component
 */
export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  onClick,
  className = '',
  ...rest
}) => {
  // Base classes
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden';
  
  // Interactive classes
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';
  
  // Combine classes
  const cardClasses = `${baseClasses} ${interactiveClasses} ${className}`;
  
  return (
    <div 
      className={cardClasses} 
      onClick={onClick}
      {...rest}
    >
      {(title || subtitle) && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>}
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {footer && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
