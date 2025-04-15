/**
 * Input component
 */

import React from 'react';
import { InputProps } from '../types/components';

/**
 * Input component
 */
export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  error,
  label,
  name,
  required = false,
  autoFocus = false,
  className = '',
  ...rest
}) => {
  // Generate a unique ID for the input
  const id = name || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        required={required}
        autoFocus={autoFocus}
        className={`
          w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary focus:shadow-md
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-primary'}
          ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800'}
          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
        `}
        {...rest}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
