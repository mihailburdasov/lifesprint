import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// Минимальный компонент App
const MinimalApp: React.FC = () => {
  return (
    <div style={{padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif'}}>
      <h1 style={{color: '#4F46E5'}}>Минимальное React-приложение</h1>
      <p>Если вы видите этот текст, значит React работает корректно.</p>
      <p>Это минимальное приложение без зависимостей от внешних сервисов.</p>
      <button 
        style={{
          backgroundColor: '#4F46E5', 
          color: 'white', 
          border: 'none', 
          padding: '10px 20px', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        onClick={() => alert('React обработчики событий работают!')}
      >
        Нажмите меня
      </button>
    </div>
  );
};

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
    console.log('Перед рендерингом MinimalApp');
    
    // Используем старый метод ReactDOM.render
    ReactDOM.render(
      <React.StrictMode>
        <MinimalApp />
      </React.StrictMode>,
      document.getElementById('root')
    );
    
    console.log('После рендеринга MinimalApp');
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
