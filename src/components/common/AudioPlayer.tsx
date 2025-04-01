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

  // Handle play/pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

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
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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
            className="h-3 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer"
            onClick={handleProgressChange}
            onTouchStart={handleProgressChange}
          >
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
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
