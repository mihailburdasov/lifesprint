/**
 * useDebounce hook
 */

import { useState, useEffect } from 'react';

/**
 * A hook for debouncing a value
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      console.log('Debounce timer completed, updating value');
      setDebouncedValue(value);
    }, delay);
    
    console.log('Debounce timer started/reset');
    
    // Clean up the timer if the value or delay changes
    return () => {
      console.log('Debounce timer cleared');
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

export default useDebounce;
