import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

interface AudioSettings {
  isAudioEnabled: boolean;
  audioRef: HTMLAudioElement | null;
  hasUserInteracted: boolean;
  toggleAudio: () => void;
  stopAudio: () => void;
  markUserInteraction: () => void;
}

// Create a hidden element in the DOM for user interaction marking
export function AudioInteractionMarker() {
  useEffect(() => {
    // Create hidden element for tracking user interaction
    const elem = document.createElement('div');
    elem.id = 'audio-interaction-marker';
    elem.style.display = 'none';
    document.body.appendChild(elem);
    
    return () => {
      document.body.removeChild(elem);
    };
  }, []);
  
  return null;
}

export const useAudioSettings = create<AudioSettings>()(
  persist(
    (set, get) => ({
      isAudioEnabled: false,
      audioRef: null,
      hasUserInteracted: false,
      toggleAudio: () => {
        const currentState = get();
        // If turning off audio, stop playback first
        if (currentState.isAudioEnabled && currentState.audioRef) {
          currentState.stopAudio();
        }
        // Mark that user has interacted with the page
        set((state) => ({ 
          isAudioEnabled: !state.isAudioEnabled,
          hasUserInteracted: true
        }));
      },
      stopAudio: () => {
        const currentRef = get().audioRef;
        if (currentRef) {
          currentRef.pause();
          currentRef.currentTime = 0;
        }
      },
      markUserInteraction: () => {
        set({ hasUserInteracted: true });
      }
    }),
    {
      name: 'audio-settings',
      partialize: (state) => ({ isAudioEnabled: state.isAudioEnabled }),
    }
  )
);
