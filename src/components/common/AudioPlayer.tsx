import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Handle play/pause
  const togglePlay = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Update audio duration when metadata is loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    // Clean up event listeners
    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, []);

  // Add keyboard shortcut for play/pause (spacebar)
  useEffect(() => {
    // Create a unique ID for this audio player instance
    const playerId = `audio-player-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the player ID in a data attribute for identification
    if (audioRef.current) {
      audioRef.current.dataset.playerId = playerId;
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar if:
      // 1. The key is Space
      // 2. The target is not an input, textarea, or button
      // 3. This audio player is visible in the viewport
      if (e.code === 'Space' && 
          !(e.target instanceof HTMLInputElement) && 
          !(e.target instanceof HTMLTextAreaElement) && 
          !(e.target instanceof HTMLButtonElement)) {
        
        // Check if this audio player is in the viewport
        if (audioRef.current && isElementInViewport(audioRef.current)) {
          e.preventDefault(); // Prevent page scrolling
          togglePlay();
        }
      }
    };
    
    // Helper function to check if an element is in the viewport
    const isElementInViewport = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay]); // Re-add event listener when togglePlay changes

  // Handle mute/unmute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle seeking with mouse or touch
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
    // Get position from either mouse or touch event
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = (clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  };

  // Format time in MM:SS
  const formatTime = (time: number, showMinus = false) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${showMinus ? '-' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`audio-player bg-gray-100 dark:bg-gray-800 rounded-md p-3 sm:p-4 ${className}`}>
      <audio ref={audioRef} src={src} />
      
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-primary text-white rounded-full focus:outline-none hover:bg-opacity-90"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-1" />}
        </button>
        
        <div className="flex-1">
          <div 
            ref={progressRef}
            className="h-3 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer relative group"
            onClick={handleProgressChange}
            onTouchStart={handleProgressChange}
          >
            <div 
              className="h-3 group-hover:h-4 bg-primary rounded-full transition-all duration-300 ease-in-out relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              {currentTime > 0 && (
                <div 
                  className="absolute top-1/2 right-0 w-3 h-3 group-hover:w-4 group-hover:h-4 bg-white border-2 border-primary rounded-full shadow-md transform translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                />
              )}
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration - currentTime, true)}</span>
          </div>
        </div>
        
        <button 
          onClick={toggleMute}
          className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 rounded-full focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
