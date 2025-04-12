export interface DailyThought {
  text: string;
  author?: string;
}

export interface DailyContent {
  thought: DailyThought;
  exercise: string;
  audioSrc: string;
} 