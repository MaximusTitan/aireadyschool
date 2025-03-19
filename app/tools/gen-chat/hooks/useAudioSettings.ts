import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioSettings {
  isAudioEnabled: boolean;
  audioRef: HTMLAudioElement | null;
  hasUserInteracted: boolean;
  toggleAudio: () => void;
  stopAudio: () => void;
  markUserInteraction: () => void;
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
