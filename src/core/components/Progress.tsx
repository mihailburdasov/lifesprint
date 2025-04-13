/**
 * Progress component
 */

import React from 'react';
import { ProgressProps } from '../types/components';

/**
 * Progress component
 */
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showLabel = true,
  className = '',
  ...rest
}) => {
  // Calculate percentage
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  // Format percentage
  const formattedPercentage = `${Math.round(percentage)}%`;
  
  return (
    <div className={`${className}`} {...rest}>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          
          {showLabel && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formattedPercentage}
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: formattedPercentage }}
        />
      </div>
    </div>
  );
};

export default Progress;
