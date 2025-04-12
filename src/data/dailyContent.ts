/**
 * Static data for daily content in the LifeSprint application
 */

// Daily thoughts with authors
export interface DailyThought {
  text: string;
  author?: string;
}

export const dailyThoughts: DailyThought[] = [
  { text: 'Я сильнее, чем я думаю!', author: 'Михаил Бурдасов' },
  { text: 'Успех порождает успех!', author: 'Джон Кехо' },
  { text: 'Поступай так, словно это сон. Действуй смело и не ищи оправданий.', author: 'Карлос Кастанеда' },
  { text: 'Мы не можем исправить вчерашний день, но можем создать завтрашний.', author: 'Садхгуру' },
  { text: 'Мы сами создаём свою удачу!', author: 'Михаил Бурдасов' },
  { text: 'Дружите с людьми, которые желают вам лучшего.', author: 'Джордан Питерсон' },
  { text: 'Утренние часы задают тон всему последующему дню.', author: 'Джон Кехо' },
  { text: 'Я — свой собственный эксперимент. Я сама себе произведение искусства.', author: 'Мадонна' },
  { text: 'Мы всегда получаем то, что сильно желаем!', author: 'Михаил Бурдасов' },
  { text: 'Кавалерия не придёт — действуй сам!', author: 'Михаил Бурдасов' },
  { text: 'Я — свой собственный эксперимент. Я сама себе произведение искусства.', author: 'Мадонна' },
  { text: 'Даже небольшая перемена во взглядах способна открыть новые неограниченные возможности!', author: 'Джон Кехо' },
  { text: 'Нет правильных решений. Есть ТВОИ РЕШЕНИЯ!', author: 'Михаил Бурдасов' },
  { text: 'Мы всегда получаем то, что сильно желаем!', author: 'Михаил Бурдасов' },
  { text: 'Хочешь быть счастливым? Действуй!', author: 'Михаил Бурдасов' },
  { text: 'Сейчас — твоё время!', author: 'Михаил Бурдасов' },
  { text: 'Мой успех зависит от меня самого!', author: 'Михаил Бурдасов' },
  { text: 'Ищите успех везде, где можете его найти.', author: 'Джон Кехо' },
  { text: 'Любая проблема — это замаскированная удача.', author: 'Бенджамин Франклин' },
  { text: 'Простые решения — сложная жизнь, сложные решения — простая жизнь.', author: 'Джерзи Григорек' },
  { text: 'Ты — то, что ты ешь.', author: 'Михаил Бурдасов' },
  { text: 'Сегодня буква — завтра книга!', author: 'Михаил Бурдасов' },
  { text: 'Хотя усилия не всегда приносят успех, потраченных зря усилий не бывает.', author: 'Михаил Бурдасов' },
  { text: 'Идеи не работают, если ты не работаешь над ними.', author: 'Робин Шарма' },
  { text: 'Мы то, что мы делаем постоянно.', author: 'Аристотель' },
  { text: 'Зачастую сам акт измерения важнее, чем параметры, которые мы изменяем.', author: 'Тим Феррис' },
  { text: 'Самый короткий путь к успеху: делай обыкновенные вещи необыкновенно.', author: 'Михаил Бурдасов' },
  { text: 'Учиться нужно настолько быстро, чтобы каждый раз ужасаться тому, что мы делали полгода назад.', author: 'Илон Маск' }
];

// Daily exercises
export const dailyExercises = [
  'Произнеси протяжно "А-У-М!"',
  'Поиграй на губе!',
  'Медленно, но широко улыбнись!',
  'Почувствуй своё сердцебиение!',
  '10 быстрых вдохов и выдохов!',
  'Скажи 3 раза "Всё хорошо!"',
  'Коснись тремя пальцами лба, носа и подбородка, а потом в обратном порядке.',
  'Потанцуй!',
  'Быстро улыбнись!',
  'Покричи в подушку!',
  'Потанцуй!',
  'Попрыгай!',
  'Попой!',
  'Сосчитай от 1 до 17!',
  'Похлопай в ладоши!',
  'Потанцуй!',
  'Задержи дыхание на 20 секунд!',
  'Прислушайся!',
  'Закрой глаза и отдохни минутку!',
  'Посмейся!',
  'Запиши себе напоминание: Сделать другому человеку приятное.',
  'Постучи по чему-нибудь!',
  'Постой на одной ноге!',
  'Посмотри на богатство природы!',
  'Крикни "Хееееей"!',
  'Скажи "доброе утро" незнакомцу.',
  'Скажи другу что-то приятное!',
  'Крикни сам себе: УРА! УРА! УРА!'
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
    // Step 2 uses audio file with index 1, step 3 uses index 2, etc.
    const audioIndex = stepNumber - 1;
    return `/audio/day${dayNumber}-${audioIndex}.mp3`;
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
