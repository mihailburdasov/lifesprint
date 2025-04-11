import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.simple'; // Используем упрощенную версию App без Supabase

// Константа для определения, нужно ли использовать Supabase
const USE_SUPABASE = false;

// Добавляем версию к URL для обхода кэша, если еще нет параметра nocache
if (!window.location.search.includes('nocache=')) {
  const version = '1.0.4'; // Обновлена версия
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

// Для обратной совместимости с проверками
import * as ReactDOM from 'react-dom';

// Расширенное логирование для диагностики
console.log('=== ДИАГНОСТИКА REACT ===');
console.log('1. index.tsx загружен');
console.log('2. App импортирован из:', './App.simple');
console.log('3. React доступен:', typeof React !== 'undefined');
console.log('4. ReactDOM доступен:', typeof ReactDOM !== 'undefined');
console.log('5. App компонент доступен:', typeof App !== 'undefined');

// Проверка наличия элемента root
const rootElement = document.getElementById('root');
console.log('6. Элемент root найден:', !!rootElement);
console.log('7. Root ID:', rootElement ? rootElement.id : 'не найден');
console.log('8. Root innerHTML:', rootElement ? rootElement.innerHTML : 'не найден');

// Проверка, не содержит ли root уже тестовый контент
const hasTestContent = rootElement && rootElement.innerHTML.includes('Тестовая страница LifeSprint');
console.log('9. Root содержит тестовый контент:', hasTestContent);

// Если root содержит тестовый контент, не пытаемся рендерить React
if (hasTestContent) {
  console.log('10. Пропускаем рендеринг React, так как root уже содержит тестовый контент');
} else {
  try {
    console.log('10. Начинаем рендеринг App');
    
    // Проверяем, что App - это действительно компонент
    console.log('11. Тип App:', typeof App);
    console.log('12. App.toString():', App.toString().slice(0, 100) + '...');
    
    // Проверяем, загружены ли стили
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    console.log('12.1. Количество загруженных стилей:', styles.length);
    
    // Проверяем, загружены ли скрипты
    const scripts = document.querySelectorAll('script');
    console.log('12.2. Количество загруженных скриптов:', scripts.length);
    
    // Проверяем, доступны ли React и ReactDOM глобально
    console.log('12.3. React доступен глобально:', typeof (window as any).React !== 'undefined');
    console.log('12.4. ReactDOM доступен глобально:', typeof (window as any).ReactDOM !== 'undefined');
    
    // Используем современный метод createRoot для React 18
    if (rootElement) {
      try {
        console.log('12.5. Начинаем создание root с помощью createRoot');
        const root = createRoot(rootElement);
        
        console.log('12.6. Root создан успешно, начинаем рендеринг');
        root.render(
          <React.StrictMode>
            <div data-testid="react-root">
              <App />
            </div>
          </React.StrictMode>
        );
        
        console.log('13. После рендеринга App с createRoot');
        
        // Проверяем, что рендеринг действительно произошел
        setTimeout(() => {
          const rootContent = document.getElementById('root')?.innerHTML || '';
          console.log('13.1. Root содержит контент после рендеринга:', rootContent.length > 0);
          console.log('13.2. Root содержит react-root:', rootContent.includes('data-testid="react-root"'));
          console.log('14. Результат рендеринга: выполнено с createRoot');
        }, 100);
      } catch (renderError) {
        console.error('Ошибка при рендеринге с createRoot:', renderError);
        console.error('Стек ошибки рендеринга:', renderError instanceof Error ? renderError.stack : 'стек недоступен');
        
        // Пробуем альтернативный метод рендеринга
        try {
          console.log('Пробуем альтернативный метод рендеринга с ReactDOM.render');
          ReactDOM.render(
            <React.StrictMode>
              <div data-testid="react-root-legacy">
                <App />
              </div>
            </React.StrictMode>,
            rootElement
          );
          console.log('Альтернативный рендеринг выполнен успешно');
        } catch (legacyError) {
          console.error('Ошибка при альтернативном рендеринге:', legacyError);
        }
      }
    } else {
      console.error('Не удалось найти элемент root для рендеринга');
    }
    
    // Проверяем результат рендеринга
    const rootAfterRender = document.getElementById('root');
    console.log('15. Root существует после рендеринга:', !!rootAfterRender);
    if (rootAfterRender) {
      console.log('15.1. Root innerHTML после рендеринга (длина):', rootAfterRender.innerHTML.length);
      console.log('15.2. Root childNodes после рендеринга:', rootAfterRender.childNodes.length);
    }
  } catch (error) {
    console.error('ОШИБКА при инициализации React:', error);
    console.error('Стек ошибки:', error instanceof Error ? error.stack : 'стек недоступен');
    
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

// Улучшенная регистрация Service Worker для поддержки PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Проверяем наличие активных Service Worker
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('Найдено Service Worker регистраций:', registrations.length);
      
      // Если есть активные Service Worker, обновляем их
      if (registrations.length > 0) {
        registrations.forEach(registration => {
          registration.update().then(() => {
            console.log('Service Worker обновлен:', registration.scope);
          }).catch(error => {
            console.error('Ошибка при обновлении Service Worker:', error);
          });
        });
      }
      
      // Регистрируем новый Service Worker с принудительным обновлением
      navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
        .then(registration => {
          console.log('Service Worker зарегистрирован:', registration.scope);
          
          // Проверяем наличие обновлений
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                console.log('Service Worker состояние изменилось:', installingWorker.state);
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('Новый Service Worker установлен и будет использован при следующей загрузке');
                  } else {
                    console.log('Service Worker установлен и будет использован немедленно');
                  }
                }
              };
            }
          };
        })
        .catch(error => {
          console.error('Ошибка при регистрации Service Worker:', error);
          console.error('Детали ошибки:', error instanceof Error ? error.message : String(error));
        });
    }).catch(error => {
      console.error('Ошибка при получении регистраций Service Worker:', error);
    });
  });
}
