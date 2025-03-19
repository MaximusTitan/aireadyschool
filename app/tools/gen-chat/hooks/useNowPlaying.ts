import { useCallback, useRef } from 'react';
import { useAudioSettings } from './useAudioSettings';

export function useNowPlaying() {
  const { audioRef: sharedAudioRef, stopAudio, hasUserInteracted } = useAudioSettings();
  const audioRef = useRef<HTMLAudioElement | null>(sharedAudioRef || null);

  const stop = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const play = useCallback(async (blob: Blob, type: string) => {
    stop();
    const url = URL.createObjectURL(blob);
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Update the shared audio reference
      useAudioSettings.setState({ audioRef: audioRef.current });
    }
    audioRef.current.src = url;
    
    // Only attempt to play if user has interacted with the page
    if (hasUserInteracted) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Failed to play audio:", error);
      }
    }

    audioRef.current.onended = () => {
      URL.revokeObjectURL(url);
    };
  }, [stop, hasUserInteracted]);

  return { stop, play, audioRef };
}
