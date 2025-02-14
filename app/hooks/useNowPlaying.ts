import { useCallback, useRef } from 'react';

export function useNowPlaying() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const play = useCallback((blob: Blob, type: string) => {
    stop();
    const url = URL.createObjectURL(blob);
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = url;
    audioRef.current.play();

    audioRef.current.onended = () => {
      URL.revokeObjectURL(url);
    };
  }, [stop]);

  return { stop, play, audioRef };
}
