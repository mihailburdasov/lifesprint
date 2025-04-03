import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Protection code removed to fix white screen issue

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
