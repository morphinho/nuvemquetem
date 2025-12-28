import { useEffect, useRef, useState, useCallback } from 'react';
import { audioManager } from '../utils/audioContext';

interface UseAutoplayAudioOptions {
  src: string;
  volume?: number;
  autoplayDelay?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  enabled?: boolean;
}

export function useAutoplayAudio({
  src,
  volume = 0.3,
  autoplayDelay = 2000,
  onPlay,
  onPause,
  onEnded,
  enabled = true,
}: UseAutoplayAudioOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);
  const [canAutoplay, setCanAutoplay] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const audio = new Audio();
    audio.src = src;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, [src, volume, enabled, onPlay, onPause, onEnded]);

  const attemptAutoplay = useCallback(async () => {
    if (!audioRef.current || autoplayAttempted || !enabled) return;

    setAutoplayAttempted(true);

    const tryPlay = async () => {
      if (!audioRef.current) return false;

      const success = await audioManager.tryPlay(audioRef.current);

      if (success) {
        setCanAutoplay(true);
        return true;
      }

      audioManager.onUnlock(async () => {
        if (audioRef.current && enabled) {
          const unlockSuccess = await audioManager.tryPlay(audioRef.current);
          if (unlockSuccess) {
            setCanAutoplay(true);
          }
        }
      });

      return false;
    };

    await tryPlay();
  }, [autoplayAttempted, enabled]);

  useEffect(() => {
    if (!enabled || isLoading) return;

    const timer = setTimeout(() => {
      attemptAutoplay();
    }, autoplayDelay);

    return () => clearTimeout(timer);
  }, [autoplayDelay, attemptAutoplay, isLoading, enabled]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioManager.tryPlay(audioRef.current);
    }
  }, [isPlaying]);

  const play = useCallback(async () => {
    if (!audioRef.current) return false;
    return await audioManager.tryPlay(audioRef.current);
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, vol));
  }, []);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    canAutoplay,
    togglePlayPause,
    play,
    pause,
    seek,
    setVolume,
    formatTime,
  };
}
