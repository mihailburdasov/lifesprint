import React from 'react';

/**
 * Компонент SkipLink для улучшения доступности
 * Позволяет пользователям, использующим клавиатуру или скринридеры,
 * быстро перейти к основному содержимому страницы, минуя навигацию
 */
const SkipLink: React.FC = () => {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:text-primary focus:shadow-md focus:rounded-md"
      aria-label="Перейти к основному содержимому"
    >
      Перейти к основному содержимому
    </a>
  );
};

export default SkipLink;
