import { create } from 'zustand';

export type AppLanguage = 'fr' | 'en';

type AppStore = {
  isDarkMode: boolean;
  language: AppLanguage;
  setDarkMode: (value: boolean) => void;
  setLanguage: (lang: AppLanguage) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  isDarkMode: false,
  language: 'fr',
  setDarkMode: (value) => set({ isDarkMode: value }),
  setLanguage: (lang) => set({ language: lang }),
}));
