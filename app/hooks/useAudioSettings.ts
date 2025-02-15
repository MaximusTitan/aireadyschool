import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioSettings {
  isAudioEnabled: boolean;
  toggleAudio: () => void;
}

export const useAudioSettings = create<AudioSettings>()(
  persist(
    (set) => ({
      isAudioEnabled: false,
      toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
    }),
    {
      name: 'audio-settings',
    }
  )
);
