import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Функция для очистки кэша при загрузке приложения
const clearCache = () => {
  // Очистка кэша в localStorage
  try {
    // Сохраняем важные данные пользователя
    const userId = localStorage.getItem('lifesprint_current_user_id');
    const userKeys: string[] = [];
    const progressKeys: string[] = [];
    
    // Находим все ключи, связанные с пользователем и прогрессом
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lifesprint_user_')) {
        userKeys.push(key);
      }
      if (key && key.startsWith('lifesprint_progress_')) {
        progressKeys.push(key);
      }
    }
    
    // Сохраняем данные пользователей и прогресса
    const userData = userKeys.map(key => ({
      key,
      value: localStorage.getItem(key)
    }));
    
    const progressData = progressKeys.map(key => ({
      key,
      value: localStorage.getItem(key)
    }));
    
    // Очищаем весь localStorage
    localStorage.clear();
    
    // Восстанавливаем данные пользователей и прогресса
    userData.forEach(item => {
      if (item.value) {
        localStorage.setItem(item.key, item.value);
      }
    });
    
    progressData.forEach(item => {
      if (item.value) {
        localStorage.setItem(item.key, item.value);
      }
    });
    
    // Восстанавливаем ID текущего пользователя
    if (userId) {
      localStorage.setItem('lifesprint_current_user_id', userId);
    }
    
    console.log('Кэш успешно очищен, данные пользователя сохранены');
  } catch (error) {
    console.error('Ошибка при очистке кэша:', error);
  }
  
  // Если приложение запущено в режиме PWA, пытаемся очистить кэш Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  
  // Добавляем версию к URL для обхода кэша
  if (window.location.search === '') {
    const version = '1.0.1';
    const newUrl = `${window.location.pathname}?v=${version}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }
};

// Запускаем очистку кэша
clearCache();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
