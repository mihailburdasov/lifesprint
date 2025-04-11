import React from 'react';

const App: React.FC = () => {
  console.log('Рендеринг App');
  return (
    <div>
      <h1>Тестовая страница</h1>
      <p>Если вы видите этот текст, значит React работает корректно.</p>
    </div>
  );
};

export default App;
