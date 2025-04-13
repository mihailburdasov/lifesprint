/**
 * Checkbox component
 */

import React from 'react';
import { CheckboxProps } from '../types/components';

/**
 * Checkbox component
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  ...rest
}) => {
  // Generate a unique ID for the checkbox
  const id = `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`flex items-center ${className}`} {...rest}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `}
      />
      
      {label && (
        <label
          htmlFor={id}
          className={`ml-2 block text-sm text-gray-700 dark:text-gray-300 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
