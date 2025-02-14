import { useState, useEffect } from 'react';

export function useAudioSettings() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('audioEnabled');
    if (stored !== null) {
      setIsAudioEnabled(stored === 'true');
    }
  }, []);

  const toggleAudio = () => {
    const newValue = !isAudioEnabled;
    setIsAudioEnabled(newValue);
    localStorage.setItem('audioEnabled', String(newValue));
  };

  return { isAudioEnabled, toggleAudio };
}
