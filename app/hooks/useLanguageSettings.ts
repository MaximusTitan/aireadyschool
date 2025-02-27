import { create } from 'zustand';

type Language = 'english' | 'hindi';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageSettings = create<LanguageState>((set) => ({
  language: 'english',
  setLanguage: (language) => set({ language }),
  toggleLanguage: () => set((state) => ({ 
    language: state.language === 'english' ? 'hindi' : 'english' 
  })),
}));
