import React, { useState } from 'react';

/**
 * Упрощенная версия App компонента без зависимостей от Supabase
 * Используется для отладки React-рендеринга
 */
const App: React.FC = () => {
  console.log('Рендеринг App.simple');
  
  // Простое состояние для демонстрации работы React
  const [count, setCount] = useState(0);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600 mb-4">LifeSprint</h1>
          <p className="text-gray-700 mb-6">Упрощенная версия React-приложения без Supabase</p>
          
          <div className="mb-8 p-4 bg-indigo-50 rounded-lg">
            <p className="text-gray-800 mb-2">Счетчик: <span className="font-bold">{count}</span></p>
            <button 
              onClick={() => setCount(count + 1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
              Увеличить
            </button>
            <button 
              onClick={() => setCount(count - 1)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              disabled={count <= 0}
            >
              Уменьшить
            </button>
          </div>
          
          <div className="text-left bg-green-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-green-800 mb-2">Статус React:</h2>
            <ul className="list-disc pl-5 text-gray-700">
              <li>React успешно загружен и работает</li>
              <li>Состояние компонентов обновляется</li>
              <li>Стили Tailwind CSS применяются</li>
              <li>Обработчики событий функционируют</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
