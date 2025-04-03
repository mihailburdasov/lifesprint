import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Добавляем версию к URL для обхода кэша, если еще нет параметра nocache
if (!window.location.search.includes('nocache=')) {
  const version = '1.0.1';
  const separator = window.location.search ? '&' : '?';
  const newUrl = `${window.location.pathname}${window.location.search}${separator}v=${version}${window.location.hash}`;
  window.history.replaceState(null, '', newUrl);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
