import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  
  // Данные для слайдов
  const slides = [
    {
      title: 'Добро пожаловать в LifeSprint',
      description: 'Это приложение способно изменить твою жизнь к лучшему всего 7 дней.',
      image: '🚀',
    },
    {
      title: 'Развивай полезные привычки',
      description: 'Научись благодарить, отмечать свои достижения, ставить цели, повысь навыки осознанности и медитативности.',
      image: '🧠',
    },
    {
      title: 'Что ж, давай начнем!',
      description: 'Всего за 31 день измени свою жизнь. Готов к новому опыту?',
      image: '🏆',
    },
  ];
  
  // Минимальное расстояние свайпа для смены слайда (в пикселях)
  const minSwipeDistance = 50;
  
  // Обработка свайпа
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Свайп влево - следующий слайд
    if (isLeftSwipe && currentSlide < slides.length - 1) {
      nextSlide();
    }
    // Свайп вправо - предыдущий слайд
    else if (isRightSwipe && currentSlide > 0) {
      prevSlide();
    }
  };
  
  // Анимация перехода между слайдами
  useEffect(() => {
    if (slideContainerRef.current) {
      slideContainerRef.current.style.opacity = '0';
      slideContainerRef.current.style.transform = 'translateY(10px)';
      
      const timer = setTimeout(() => {
        if (slideContainerRef.current) {
          slideContainerRef.current.style.opacity = '1';
          slideContainerRef.current.style.transform = 'translateY(0)';
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [currentSlide]);
  
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
    <div 
      className="onboarding-page min-h-screen bg-background-light dark:bg-background-dark flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Индикатор прогресса */}
      <div className="fixed top-0 left-0 right-0 flex justify-center p-4 pt-8 safe-area-inset-top">
        <div className="flex space-x-3">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-primary w-4' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Содержимое слайда */}
      <div 
        ref={slideContainerRef}
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center transition-all duration-300 ease-in-out"
      >
        <div className="text-8xl mb-10 transform transition-transform duration-500 hover:scale-110">
          {slides[currentSlide].image}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">{slides[currentSlide].title}</h1>
        <p className="text-lg text-text-light-light dark:text-text-light-dark mb-12 max-w-md mx-auto leading-relaxed">
          {slides[currentSlide].description}
        </p>
      </div>
      
      {/* Кнопки навигации */}
      <div className="p-6 pb-10 safe-area-inset-bottom">
        <div className="flex justify-between items-center mb-6 gap-4">
          {currentSlide > 0 ? (
            <Button variant="outline" onClick={prevSlide} size="lg" className="flex-1">
              Назад
            </Button>
          ) : (
            <div className="flex-1"></div> // Пустой div для сохранения выравнивания
          )}
          
          <Button variant="primary" onClick={nextSlide} size="lg" className="flex-1">
            {currentSlide < slides.length - 1 ? 'Далее' : 'Начать'}
          </Button>
        </div>
        
        {currentSlide < slides.length - 1 && (
          <div className="text-center">
            <button
              onClick={skipOnboarding}
              className="text-text-light-light dark:text-text-light-dark hover:underline focus:outline-none py-4 px-6 text-base min-h-[44px] w-full"
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
