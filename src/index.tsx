import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App.simple'; // Используем упрощенную версию App без Supabase

// Константа для определения, нужно ли использовать Supabase
const USE_SUPABASE = false;

// Добавляем версию к URL для обхода кэша, если еще нет параметра nocache
if (!window.location.search.includes('nocache=')) {
  const version = '1.0.3'; // Обновлена версия
  const separator = window.location.search ? '&' : '?';
  const newUrl = `${window.location.pathname}${window.location.search}${separator}v=${version}${window.location.hash}`;
  window.history.replaceState(null, '', newUrl);
}

// Инициализация Sentry только если нужно
if (USE_SUPABASE) {
  try {
    // Импортируем Sentry и Supabase динамически
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: process.env.REACT_APP_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
        sampleRate: 1.0,
        environment: process.env.NODE_ENV,
        release: '1.0.3',
        ignoreErrors: [
          'Network Error',
          'Failed to fetch',
          'Cross-Origin Request Blocked',
          'Extension context invalidated',
          'AbortError',
          'The operation was aborted'
        ]
      });
      console.log('Sentry инициализирован успешно');
    });
    
    // Инициализация Supabase
    import('./utils/supabaseClient').then(({ setupTokenRefresh }) => {
      setupTokenRefresh();
      console.log('Supabase инициализирован успешно');
    });
  } catch (error) {
    console.error('Ошибка при инициализации внешних сервисов:', error);
  }
}

// Проверка наличия элемента root
const rootElement = document.getElementById('root');
console.log('Элемент root найден:', !!rootElement);

// Проверка, не содержит ли root уже тестовый контент
const hasTestContent = rootElement && rootElement.innerHTML.includes('Тестовая страница LifeSprint');
console.log('Root содержит тестовый контент:', hasTestContent);

// Если root содержит тестовый контент, не пытаемся рендерить React
if (hasTestContent) {
  console.log('Пропускаем рендеринг React, так как root уже содержит тестовый контент');
} else {
  try {
    console.log('Перед рендерингом App');
    
    // Используем старый метод ReactDOM.render вместо createRoot для совместимости
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      document.getElementById('root')
    );
    
    console.log('После рендеринга App');
  } catch (error) {
    console.error('Ошибка при инициализации React:', error);
    
    // В случае ошибки, добавляем контент напрямую в DOM
    try {
      const rootEl = document.getElementById('root');
      if (rootEl && !rootEl.innerHTML.includes('Тестовая страница')) {
        rootEl.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
            <h1 style="color: #4F46E5;">Ошибка инициализации React</h1>
            <p>Произошла ошибка при инициализации React.</p>
            <p>Детали ошибки: ${error instanceof Error ? error.message : String(error)}</p>
          </div>
        `;
      }
    } catch (domError) {
      console.error('Ошибка при добавлении контента в DOM:', domError);
    }
  }
}

// Отключаем регистрацию Service Worker для упрощения отладки
// Раскомментируйте этот код, когда приложение будет стабильно работать
/*
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
*/
