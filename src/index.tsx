import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as Sentry from '@sentry/react';
import { setupTokenRefresh } from './utils/supabaseClient';

// Инициализация Sentry для мониторинга ошибок
// В продакшене нужно заменить DSN на реальный
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
  // Настройка частоты отправки данных
  // В продакшене рекомендуется установить меньшее значение
  sampleRate: 1.0, // Отправлять 100% ошибок
  
  // Установка окружения
  environment: process.env.NODE_ENV,
  
  // Установка версии релиза
  release: '1.0.2',
  
  // Игнорирование ошибок, которые не нужно отслеживать
  ignoreErrors: [
    // Ошибки сети
    'Network Error',
    'Failed to fetch',
    // Ошибки CORS
    'Cross-Origin Request Blocked',
    // Ошибки расширений браузера
    'Extension context invalidated',
    // Ошибки, связанные с отменой запросов
    'AbortError',
    // Ошибки, связанные с закрытием вкладки
    'The operation was aborted'
  ]
});

// Инициализация автоматического обновления токенов
setupTokenRefresh();

// Добавляем версию к URL для обхода кэша, если еще нет параметра nocache
if (!window.location.search.includes('nocache=')) {
  const version = '1.0.2'; // Обновлена версия
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

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker зарегистрирован:', registration);
      })
      .catch(error => {
        console.error('Ошибка при регистрации Service Worker:', error);
      });
  });
}
