/**
 * useClickOutside hook
 */

import { useEffect, RefObject } from 'react';

/**
 * A hook for detecting clicks outside of a specified element
 * @param ref Reference to the element to detect clicks outside of
 * @param handler Function to call when a click outside is detected
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    // Define the listener function
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      
      // Call the handler only if the click is outside the element
      handler(event);
    };
    
    // Add event listeners
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    // Remove event listeners on cleanup
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Re-run if ref or handler changes
}

export default useClickOutside;
