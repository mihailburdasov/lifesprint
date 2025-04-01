import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Protection against developer tools
const addDevToolsProtection = () => {
  if (process.env.NODE_ENV === 'production') {
    // Disable right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Function to detect DevTools
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        // If DevTools is detected, you can take action
        document.body.innerHTML = '<h1>Developer tools detected!</h1><p>This action has been logged.</p>';
      }
    };
    
    // Check on resize events
    window.addEventListener('resize', detectDevTools);
    
    // Check periodically
    setInterval(detectDevTools, 1000);
    
    // Additional protection: disable various debugging functions
    const disableDebugging = () => {
      // Override console methods
      const noop = () => {};
      
      // Store original console methods
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
      };
      
      // In production, disable console methods
      console.log = noop;
      console.warn = noop;
      console.info = noop;
      console.debug = noop;
      // Keep error for critical issues
      
      // Detect if someone tries to restore console
      setInterval(() => {
        if (console.log !== noop) {
          console.log = noop;
        }
      }, 1000);
    };
    
    disableDebugging();
  }
};

// Apply protection
addDevToolsProtection();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
