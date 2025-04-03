import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Protection against developer tools - modified to be less aggressive
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
      
      // Much more conservative thresholds to reduce false positives
      const widthThreshold = window.outerWidth - window.innerWidth > 350;
      const heightThreshold = window.outerHeight - window.innerHeight > 350;
      
      // Only trigger if both dimensions suggest DevTools are open AND the difference is very significant
      if (widthThreshold && heightThreshold) {
        // Log warning instead of replacing entire page content
        console.warn('Developer tools may be open');
      }
    };
    
    // Check on resize events
    window.addEventListener('resize', detectDevTools);
    
    // Check periodically but less frequently to reduce performance impact
    setInterval(detectDevTools, 5000);
    
    // Simplified debugging protection that won't break the app
    const disableDebugging = () => {
      // Only disable non-critical console methods
      const noop = () => {};
      
      // In production, disable some console methods but keep critical ones
      if (!window.location.hostname.includes('localhost')) {
        console.log = noop;
        console.info = noop;
        console.debug = noop;
        // Keep warn and error for critical issues
      }
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
