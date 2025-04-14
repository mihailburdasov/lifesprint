/**
 * Static data for daily content in the LifeSprint application
 */

import { DailyContent } from '../features/day/types/progress';

// Daily thoughts with authors
export const dailyThoughts = [
  { text: 'Я сильнее, чем я думаю!', author: undefined }, // Day 1
  { text: 'Успех порождает успех!', author: 'Джон Кехо' }, // Day 2
  { text: 'Поступай так, словно это сон. Действуй смело и не ищи оправданий.', author: 'Карлос Кастанеда' }, // Day 3
  { text: 'Мы не можем исправить вчерашний день, но можем создать завтрашний.', author: 'Садхгуру' }, // Day 4
  { text: 'Мы сами создаём свою удачу!', author: undefined }, // Day 5
  { text: 'Дружите с людьми, которые желают вам лучшего.', author: 'Джордан Питерсон' }, // Day 6
  { text: 'Утренние часы задают тон всему последующему дню.', author: 'Джон Кехо' }, // Day 7 (Reflection)
  { text: 'Я — свой собственный эксперимент. Я сама себе произведение искусства.', author: 'Мадонна' }, // Day 8
  { text: 'Мы всегда получаем то, что сильно желаем!', author: undefined }, // Day 9
  { text: 'Кавалерия не придёт — действуй сам!', author: undefined }, // Day 10
  { text: 'Я — свой собственный эксперимент. Я сама себе произведение искусства.', author: 'Мадонна' }, // Day 11
  { text: 'Даже небольшая перемена во взглядах способна открыть новые неограниченные возможности!', author: 'Джон Кехо' }, // Day 12
  { text: 'Нет правильных решений. Есть ТВОИ РЕШЕНИЯ!', author: undefined }, // Day 13
  { text: 'Мы всегда получаем то, что сильно желаем!', author: undefined }, // Day 14 (Reflection)
  { text: 'Хочешь быть счастливым? Действуй!', author: undefined }, // Day 15
  { text: 'Сейчас — твоё время!', author: undefined }, // Day 16
  { text: 'Мой успех зависит от меня самого!', author: undefined }, // Day 17
  { text: 'Ищите успех везде, где можете его найти.', author: 'Джон Кехо' }, // Day 18
  { text: 'Любая проблема — это замаскированная удача.', author: 'Бенджамин Франклин' }, // Day 19
  { text: 'Простые решения — сложная жизнь, сложные решения — простая жизнь.', author: 'Джерзи Григорек' }, // Day 20
  { text: 'Ты — то, что ты ешь.', author: undefined }, // Day 21 (Reflection)
  { text: 'Сегодня буква — завтра книга!', author: 'Михаил' }, // Day 22
  { text: 'Хотя усилия не всегда приносят успех, потраченных зря усилий не бывает.', author: undefined }, // Day 23
  { text: 'Идеи не работают, если ты не работаешь над ними.', author: 'Робин Шарма' }, // Day 24
  { text: 'Мы то, что мы делаем постоянно.', author: 'Аристотель' }, // Day 25
  { text: 'Зачастую сам акт измерения важнее, чем параметры, которые мы изменяем.', author: 'Тим Феррис' }, // Day 26
  { text: 'Самый короткий путь к успеху: делай обыкновенные вещи необыкновенно.', author: undefined }, // Day 27
  { text: 'Учиться нужно настолько быстро, чтобы каждый раз ужасаться тому, что мы делали полгода назад.', author: 'Илон Маск' }, // Day 28 (Reflection)
];

// Daily exercises
export const dailyExercises = [
  'Произнеси протяжно «А-У-М!»', // Day 1
  'Поиграй на губе!', // Day 2
  'Медленно, но широко улыбнись!', // Day 3
  'Почувствуй своё сердцебиение!', // Day 4
  '10 быстрых вдохов и выдохов!', // Day 5
  'Скажи 3 раза "Всё хорошо!"', // Day 6
  'Коснись тремя пальцами лба, носа и подбородка, а потом в обратном порядке.', // Day 7 (Reflection)
  'Потанцуй!', // Day 8
  'Быстро улыбнись!', // Day 9
  'Покричи в подушку!', // Day 10
  'Потанцуй!', // Day 11
  'Попрыгай!', // Day 12
  'Попой!', // Day 13
  'Сосчитай от 1 до 17!', // Day 14 (Reflection)
  'Похлопай в ладоши!', // Day 15
  'Потанцуй!', // Day 16
  'Задержи дыхание на 20 секунд!', // Day 17
  'Прислушайся!', // Day 18
  'Закрой глаза и отдохни минутку!', // Day 19
  'Посмейся!', // Day 20
  'Запиши себе напоминание: Сделать другому человеку приятное.', // Day 21 (Reflection)
  'Постучи по чему-нибудь!', // Day 22
  'Постой на одной ноге!', // Day 23
  'Посмотри на богатство природы!', // Day 24
  'Крикни «Хееееей»!', // Day 25
  'Скажи «доброе утро» незнакомцу.', // Day 26
  'Скажи другу что-то приятное!', // Day 27
  'Крикни сам себе: УРА! УРА! УРА!', // Day 28 (Reflection)
];

// Motivational phrases for reflection days
export const reflectionMotivationalPhrases = [
  'Тебя ждут приключения!', // Week 1
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
  '/audio/day31.mp3', // Day 31 (Reflection)
];

// Get audio file for a specific step
export const getStepAudioSrc = (dayNumber: number, stepNumber: number): string => {
  // For regular days, we have audio for steps 2-6
  // For reflection days, we have audio for steps 2-8
  
  // If step is 1, return empty string (no audio for step 1)
  if (stepNumber === 1) {
    return '';
  }
  
  // Check if day is valid
  if (dayNumber < 1 || dayNumber > 31) {
    return '';
  }
  
  // Check if it's a reflection day
  const isReflection = dayNumber % 7 === 0;
  
  // For regular days, check if step is valid (2-6)
  if (!isReflection && (stepNumber < 2 || stepNumber > 6)) {
    return '';
  }
  
  // For reflection days, check if step is valid (2-8)
  if (isReflection && (stepNumber < 2 || stepNumber > 8)) {
    return '';
  }
  
  // Return the audio file path
  return `/audio/day${dayNumber}-${stepNumber - 1}.mp3`;
};

// Get content for a specific day
export const getDailyContent = (dayNumber: number): DailyContent => {
  const index = dayNumber - 1;
  if (index < 0 || index >= 31) {
    return {
      thought: {
        text: 'День за пределами спринта',
        author: undefined
      },
      exercise: 'Нет упражнения',
      audioSrc: '',
      withAudio: false,
    };
  }
  
  // Get thought with author if available
  const thought = dailyThoughts[index] || { text: 'Мысль дня', author: undefined };
  
  return {
    thought: thought,
    exercise: dailyExercises[index] || 'Упражнение на осознанность',
    audioSrc: audioFiles[index] || '',  // Ensure audioSrc is always a string
    withAudio: true,
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
