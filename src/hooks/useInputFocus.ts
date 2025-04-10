import { useEffect } from 'react';

/**
 * Hook to ensure input fields are not covered by mobile keyboard
 * Adds focus event listeners to all input and textarea elements
 */
const useInputFocus = () => {
  useEffect(() => {
    // Function to handle input focus
    const handleInputFocus = (event: FocusEvent) => {
      // Only proceed if the focused element is an input or textarea
      if (
        event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement
      ) {
        // Give the browser a moment to show the keyboard
        setTimeout(() => {
          const element = event.target as HTMLElement;
          
          // Get the element's position relative to the viewport
          const rect = element.getBoundingClientRect();
          
          // Calculate the element's position from the top of the viewport
          const elementTop = rect.top;
          
          // Get the viewport height
          const viewportHeight = window.innerHeight;
          
          // Estimate keyboard height (can vary by device)
          // For iOS it's typically around 300px, for Android around 270px
          const estimatedKeyboardHeight = 300;
          
          // Calculate the visible area height (viewport minus keyboard)
          const visibleAreaHeight = viewportHeight - estimatedKeyboardHeight;
          
          // If the element is below the visible area, scroll it into view
          if (elementTop > visibleAreaHeight - 50) { // 50px buffer
            // Scroll the element into view with some padding
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300); // Delay to allow keyboard to appear
      }
    };

    // Add focus event listeners to all inputs and textareas
    document.addEventListener('focusin', handleInputFocus);

    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('focusin', handleInputFocus);
    };
  }, []);
};

export default useInputFocus;
