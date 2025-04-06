/**
 * Static data for daily content in the LifeSprint application
 */

// Daily thoughts with authors
export interface DailyThought {
  text: string;
  author?: string;
}

export const dailyThoughts: DailyThought[] = [
  { text: 'Я сильнее, чем я думаю!', author: 'Михаил Бурдасов' }, // Day 1
  { text: 'Успех порождает успех!', author: 'Джон Кехо' }, // Day 2
  { text: 'Поступай так, словно это сон. Действуй смело и не ищи оправданий.', author: 'Карлос Кастенеда' }, // Day 3
  { text: 'Мы не можем исправить вчерашний день, но можем создать завтрашний.', author: 'Садхгуру' }, // Day 4
  { text: 'Мы сами создаём свою удачу!', author: 'Михаил Бурдасов' }, // Day 5
  { text: 'Практика делает совершенным.', author: 'Аристотель' }, // Day 6
  { text: 'Утренние часы задают тон всему последующему дню.', author: 'Робин Шарма' }, // Day 7 (Reflection)
  { text: 'Новые горизонты ждут тех, кто готов их увидеть.', author: 'Тони Роббинс' }, // Day 8
  { text: 'Внимательность к мелочам создает великие результаты.', author: 'Стив Джобс' }, // Day 9
  { text: 'Моя энергия — мой самый ценный ресурс.', author: 'Джим Рон' }, // Day 10
  { text: 'Фокус на главном приводит к успеху.', author: 'Гэри Келлер' }, // Day 11
  { text: 'Баланс во всем — ключ к гармоничной жизни.', author: 'Далай-лама' }, // Day 12
  { text: 'Рост происходит за пределами зоны комфорта.', author: 'Нил Доналд Уолш' }, // Day 13
  { text: 'Каждая неделя — это новая глава моей истории.', author: 'Экхарт Толле' }, // Day 14 (Reflection)
  { text: 'Преодоление трудностей делает нас сильнее.', author: 'Фридрих Ницше' }, // Day 15
  { text: 'Радость можно найти в самых простых вещах.', author: 'Тич Нат Хан' }, // Day 16
  { text: 'Моя сила в моей уверенности.', author: 'Эми Кадди' }, // Day 17
  { text: 'Творчество — это свобода самовыражения.', author: 'Пабло Пикассо' }, // Day 18
  { text: 'Связь с другими обогащает нашу жизнь.', author: 'Брене Браун' }, // Day 19
  { text: 'Гармония начинается внутри нас.', author: 'Уэйн Дайер' }, // Day 20
  { text: 'Прошлое учит, будущее вдохновляет, настоящее действует.', author: 'Майкл Хайятт' }, // Day 21 (Reflection)
  { text: 'Интеграция опыта ведет к мудрости.', author: 'Карл Юнг' }, // Day 22
  { text: 'Мудрость приходит через опыт и размышления.', author: 'Сократ' }, // Day 23
  { text: 'Принятие себя — первый шаг к изменениям.', author: 'Карл Роджерс' }, // Day 24
  { text: 'Видение будущего направляет наши действия сегодня.', author: 'Саймон Синек' }, // Day 25
  { text: 'Действие превращает мечты в реальность.', author: 'Джек Кэнфилд' }, // Day 26
  { text: 'Празднуйте свои победы, большие и малые.', author: 'Опра Уинфри' }, // Day 27
  { text: 'Завершение — это новое начало.', author: 'Джозеф Кэмпбелл' }, // Day 28 (Reflection)
];

// Daily exercises
export const dailyExercises = [
  'Произнеси протяжно "А-У-М".', // Day 1
  'Поиграй на губе!', // Day 2
  'Медленно, но широко улыбнись!', // Day 3
  'Почувствуй своё сердцебиение!', // Day 4
  'Запиши 3 своих достижения за последний год, которыми ты гордишься.', // Day 5
  'Выполни 5-минутную медитацию осознанности.', // Day 6
  'Коснись тремя пальцами лба, носа и подбородка, а потом в обратном порядке.', // Day 7 (Reflection)
  'Нарисуй символ, который представляет твои стремления.', // Day 8
  'Обрати внимание на 5 разных звуков вокруг тебя.', // Day 9
  'Выполни 10 прыжков на месте для повышения энергии.', // Day 10
  'Сосредоточься на одной задаче в течение 25 минут без отвлечений.', // Day 11
  'Сделай 3-минутный перерыв для растяжки.', // Day 12
  'Сделай что-то, что немного выходит за рамки твоей зоны комфорта.', // Day 13
  'Нарисуй график своего настроения за прошедшую неделю.', // Day 14 (Reflection)
  'Вспомни трудность, которую ты преодолел, и запиши уроки, которые ты извлек.', // Day 15
  'Найди момент, чтобы насладиться чем-то простым: чашкой чая, закатом, музыкой.', // Day 16
  'Встань в позу силы на 2 минуты (руки на бедрах, прямая спина, подбородок вверх).', // Day 17
  'Создай что-то: нарисуй, напиши, сочини.', // Day 18
  'Позвони или напиши сообщение кому-то, с кем давно не общался.', // Day 19
  'Выполни 5-минутную медитацию на гармонию и баланс.', // Day 20
  'Создай коллаж из изображений, представляющих твое прошлое, настоящее и будущее.', // Day 21 (Reflection)
  'Запиши, как различные аспекты твоей жизни связаны между собой.', // Day 22
  'Задай себе три глубоких вопроса и запиши ответы.', // Day 23
  'Напиши письмо принятия самому себе.', // Day 24
  'Создай доску визуализации своих целей.', // Day 25
  'Выбери одну маленькую цель и сделай первый шаг к ее достижению прямо сейчас.', // Day 26
  'Отпразднуй свои достижения за этот месяц любым приятным для тебя способом.', // Day 27
  'Напиши письмо себе в будущее, которое откроешь через год.', // Day 28 (Reflection)
];

// Motivational phrases for reflection days
export const reflectionMotivationalPhrases = [
  'Тебя ждут приключения! Продолжай', // Week 1
  'Ты на правильном пути!', // Week 2
  'Твой потенциал безграничен!', // Week 3
  'Это только начало твоего удивительного пути!', // Week 4
];

// Audio file paths (placeholder)
export const audioFiles = [
  '/audio/day1.mp3', // Day 1
  '/audio/day2.mp3', // Day 2
  '/audio/day3.mp3', // Day 3
  '/audio/day4.mp3', // Day 4
  '/audio/day5.mp3', // Day 5
  '/audio/day6.mp3', // Day 6
  '/audio/day7.mp3', // Day 7 (Reflection)
  '/audio/day8.mp3', // Day 8
  '/audio/day9.mp3', // Day 9
  '/audio/day10.mp3', // Day 10
  '/audio/day11.mp3', // Day 11
  '/audio/day12.mp3', // Day 12
  '/audio/day13.mp3', // Day 13
  '/audio/day14.mp3', // Day 14 (Reflection)
  '/audio/day15.mp3', // Day 15
  '/audio/day16.mp3', // Day 16
  '/audio/day17.mp3', // Day 17
  '/audio/day18.mp3', // Day 18
  '/audio/day19.mp3', // Day 19
  '/audio/day20.mp3', // Day 20
  '/audio/day21.mp3', // Day 21 (Reflection)
  '/audio/day22.mp3', // Day 22
  '/audio/day23.mp3', // Day 23
  '/audio/day24.mp3', // Day 24
  '/audio/day25.mp3', // Day 25
  '/audio/day26.mp3', // Day 26
  '/audio/day27.mp3', // Day 27
  '/audio/day28.mp3', // Day 28 (Reflection)
];

// Step-by-step audio files for each day
// Format: day{dayNumber}-{stepNumber}.mp3
export const getStepAudioFile = (dayNumber: number, stepNumber: number): string => {
  // Step 1 doesn't have audio
  if (stepNumber === 1) {
    return '';
  }
  
  // Check if this day should have step-specific audio
  // Days 1-6, 8-13, 15-20, 22-27 have step-specific audio
  const hasStepAudio = (
    (dayNumber >= 1 && dayNumber <= 6) || 
    (dayNumber >= 8 && dayNumber <= 13) || 
    (dayNumber >= 15 && dayNumber <= 20) || 
    (dayNumber >= 22 && dayNumber <= 27)
  );
  
  if (hasStepAudio) {
    // For steps 2-6, return the corresponding step-specific audio file
    return `/audio/day${dayNumber}-${stepNumber}.mp3`;
  } else {
    // For reflection days (7, 14, 21, 28) and any other days, return the day-specific audio
    return `/audio/day${dayNumber}.mp3`;
  }
};

// Get content for a specific day
export const getDailyContent = (dayNumber: number) => {
  const index = dayNumber - 1;
  if (index < 0 || index >= 28) {
    return {
      thought: {
        text: 'День за пределами спринта',
        author: undefined
      },
      exercise: 'Нет упражнения',
      audioSrc: '',
    };
  }
  
  return {
    thought: dailyThoughts[index],
    exercise: dailyExercises[index],
    audioSrc: audioFiles[index],
  };
};

// Get content for a specific step of a day
export const getStepContent = (dayNumber: number, stepNumber: number) => {
  const index = dayNumber - 1;
  if (index < 0 || index >= 28) {
    return {
      thought: {
        text: 'День за пределами спринта',
        author: undefined
      },
      exercise: 'Нет упражнения',
      audioSrc: '',
    };
  }
  
  // For step 1, no audio
  if (stepNumber === 1) {
    return {
      thought: dailyThoughts[index],
      exercise: dailyExercises[index],
      audioSrc: '',
    };
  }
  
  // For steps 2-6, return the corresponding content with step-specific audio
  return {
    thought: dailyThoughts[index],
    exercise: dailyExercises[index],
    audioSrc: getStepAudioFile(dayNumber, stepNumber),
  };
};

// Get motivational phrase for a reflection day
export const getMotivationalPhrase = (weekNumber: number) => {
  const index = weekNumber - 1;
  if (index < 0 || index >= 4) {
    return 'Продолжай свой путь!';
  }
  
  return reflectionMotivationalPhrases[index];
};
