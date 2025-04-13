import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/index';
import './shared/styles';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
