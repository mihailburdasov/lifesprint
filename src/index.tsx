import React from 'react';
import ReactDOM from 'react-dom';
// Импортируем также старый тип ReactDOM для совместимости
import type { Root } from 'react-dom/client';
import './index.css';
// import App from './App';
import App from './App.simple';
import * as Sentry from '@sentry/react';
import { setupTokenRefresh } from './utils/supabaseClient';

try {
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
  console.log('Supabase и Sentry инициализированы успешно');
} catch (error) {
  console.error('Ошибка при инициализации Supabase или Sentry:', error);
}

// Добавляем версию к URL для обхода кэша, если еще нет параметра nocache
if (!window.location.search.includes('nocache=')) {
  const version = '1.0.2'; // Обновлена версия
  const separator = window.location.search ? '&' : '?';
  const newUrl = `${window.location.pathname}${window.location.search}${separator}v=${version}${window.location.hash}`;
  window.history.replaceState(null, '', newUrl);
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
    console.log('Перед созданием root');
    
    // Проверяем, доступен ли ReactDOM.render
    console.log('ReactDOM.render доступен:', typeof ReactDOM.render === 'function');
    
    // Используем старый метод ReactDOM.render вместо createRoot
    console.log('Перед рендерингом App');
    ReactDOM.render(
      <React.StrictMode>
        <div style={{padding: '20px', textAlign: 'center'}}>
          <h1 style={{color: '#4F46E5'}}>React работает!</h1>
          <p>Это контент, отрендеренный через React.</p>
        </div>
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
