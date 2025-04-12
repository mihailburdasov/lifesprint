import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface AudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className = '', autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
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

  // Auto-play when the component mounts or when src changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (autoPlay && src) {
      setIsPlaying(true);
      const playPromise = setTimeout(() => {
        audio.play().catch(err => {
          console.error('Error auto-playing audio:', err);
          setIsPlaying(false);
        });
      }, 300);
      
      return () => clearTimeout(playPromise);
    }
  }, [autoPlay, src]);

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
    
    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Add keyboard shortcut for play/pause (spacebar)
  useEffect(() => {
    const playerId = `audio-player-${Math.random().toString(36).substr(2, 9)}`;
    
    if (audioRef.current) {
      audioRef.current.dataset.playerId = playerId;
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && 
          !(e.target instanceof HTMLInputElement) && 
          !(e.target instanceof HTMLTextAreaElement) && 
          !(e.target instanceof HTMLButtonElement)) {
        
        if (audioRef.current && isElementInViewport(audioRef.current)) {
          e.preventDefault();
          togglePlay();
        }
      }
    };
    
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
  }, [togglePlay]);

  // Handle mute/unmute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle seeking
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
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
          className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
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
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            >
              <div 
                className="absolute top-1/2 right-0 w-3 h-3 group-hover:w-4 group-hover:h-4 bg-white border-2 border-primary rounded-full shadow-md transform translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              />
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration - currentTime, true)}</span>
          </div>
        </div>
        
        <button
          className="ml-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
