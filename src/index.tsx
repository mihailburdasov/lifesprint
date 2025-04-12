import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { setupTokenRefresh } from './utils/supabaseClient';

// Инициализация Supabase
setupTokenRefresh();

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Элемент root не найден');
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
