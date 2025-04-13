/**
 * Service for managing audio playback
 * Will be implemented later
 */

/**
 * Class for managing audio
 */
export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private isInitialized = false;

  /**
   * Initialize audio service
   */
  initialize(): void {
    if (this.isInitialized) return;
    this.audio = new Audio();
    this.isInitialized = true;
  }

  /**
   * Play audio
   */
  play(src: string): void {
    if (!this.isInitialized) this.initialize();
    if (this.audio) {
      this.audio.src = src;
      this.audio.play();
    }
  }

  /**
   * Pause audio
   */
  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  /**
   * Stop audio
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Check if audio is playing
   */
  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  /**
   * Get audio duration
   */
  getDuration(): number {
    return this.audio ? this.audio.duration || 0 : 0;
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.audio ? this.audio.currentTime || 0 : 0;
  }

  /**
   * Set current time
   */
  setCurrentTime(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  /**
   * Play step audio
   */
  playStepAudio(dayNumber: number, stepNumber: number): void {
    const src = this.getStepAudioSrc(dayNumber, stepNumber);
    if (src) {
      this.play(src);
    }
  }

  /**
   * Play day audio
   */
  playDayAudio(dayNumber: number): void {
    const src = this.getStepAudioSrc(dayNumber, 1);
    if (src) {
      this.play(src);
    }
  }

  /**
   * Get step audio source
   */
  getStepAudioSrc(dayNumber: number, step: number): string {
    // Placeholder implementation
    return `/audio/day${dayNumber}${step > 1 ? `-${step}` : ''}.mp3`;
  }
}

// Export a singleton instance
export const audioService = new AudioService();
