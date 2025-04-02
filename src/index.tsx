import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Protection against developer tools
const addDevToolsProtection = () => {
  if (process.env.NODE_ENV === 'production') {
    // Disable right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Function to detect DevTools with improved mobile compatibility
    const detectDevTools = () => {
      // Enhanced mobile detection - check multiple indicators
      const userAgentMobile = /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
      const screenMobile = window.screen.width < 768; // Common mobile breakpoint
      const touchEnabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      
      // If ANY mobile indicator is true, skip detection completely
      if (userAgentMobile || screenMobile || touchEnabled) {
        return;
      }
      
      // More conservative thresholds to reduce false positives
      const widthThreshold = window.outerWidth - window.innerWidth > 250;
      const heightThreshold = window.outerHeight - window.innerHeight > 250;
      
      // Only trigger if both dimensions suggest DevTools are open
      // This reduces false positives significantly
      if (widthThreshold && heightThreshold) {
        // If DevTools is detected, you can take action
        document.body.innerHTML = '<h1>Developer tools detected!</h1><p>This action has been logged.</p>';
      }
    };
    
    // Check on resize events
    window.addEventListener('resize', detectDevTools);
    
    // Check periodically but less frequently to reduce performance impact
    setInterval(detectDevTools, 2000);
    
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
