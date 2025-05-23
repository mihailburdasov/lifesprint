/**
 * useMediaQuery hook
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * A hook for detecting if a media query matches
 * @param query The media query to match
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state - wrapped in useCallback to avoid recreating on every render
  const getMatches = useCallback((): boolean => {
    // Prevent build error "window is undefined" but keep working
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  }, [query]);

  // State to store the match result
  const [matches, setMatches] = useState<boolean>(getMatches);

  // Listen for changes
  useEffect(() => {
    // Handle change event - moved inside useEffect to avoid dependency issues
    function handleChange() {
      setMatches(getMatches());
    }
    
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen for subsequent changes
    if (matchMedia.addListener) {
      // For older browsers
      matchMedia.addListener(handleChange);
    } else {
      // For modern browsers
      matchMedia.addEventListener('change', handleChange);
    }

    // Cleanup
    return () => {
      if (matchMedia.removeListener) {
        // For older browsers
        matchMedia.removeListener(handleChange);
      } else {
        // For modern browsers
        matchMedia.removeEventListener('change', handleChange);
      }
    };
  }, [query, getMatches]); // Include getMatches in the dependencies

  return matches;
}

// Common media query helpers
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');

export default useMediaQuery;
