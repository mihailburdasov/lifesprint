import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Данные для слайдов
  const slides = [
    {
      title: 'Добро пожаловать в LifeSprint',
      description: 'Это приложение, которое способно за месяц изменить твою жизнь к лучшему.',
      image: '🚀',
    },
    {
      title: 'Развивай полезные привычки',
      description: 'Научись благодарить, отмечать свои достижения, ставить цели, повысь навыки осознанности и медитативности.',
      image: '🧠',
    },
    {
      title: 'Что ж, давай начнем!',
      description: 'Всего 28 дней, чтобы изменить свою жизнь. Готов к новым высотам?',
      image: '🏆',
    },
  ];
  
  // Переход к следующему слайду
  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Если это последний слайд, переходим на главную страницу
      navigate('/');
    }
  };
  
  // Переход к предыдущему слайду
  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };
  
  // Пропустить все слайды
  const skipOnboarding = () => {
    navigate('/');
  };
  
  return (
    <div className="onboarding-page min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* Индикатор прогресса */}
      <div className="fixed top-0 left-0 right-0 flex justify-center p-4">
        <div className="flex space-x-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentSlide ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Содержимое слайда */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-8">{slides[currentSlide].image}</div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">{slides[currentSlide].title}</h1>
        <p className="text-lg text-text-light-light dark:text-text-light-dark mb-12 max-w-md mx-auto">
          {slides[currentSlide].description}
        </p>
      </div>
      
      {/* Кнопки навигации */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          {currentSlide > 0 ? (
            <Button variant="outline" onClick={prevSlide}>
              Назад
            </Button>
          ) : (
            <div></div> // Пустой div для сохранения выравнивания
          )}
          
          <Button variant="primary" onClick={nextSlide}>
            {currentSlide < slides.length - 1 ? 'Далее' : 'Начать'}
          </Button>
        </div>
        
        {currentSlide < slides.length - 1 && (
          <div className="text-center">
            <button
              onClick={skipOnboarding}
              className="text-text-light-light dark:text-text-light-dark hover:underline focus:outline-none py-2"
            >
              Пропустить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
