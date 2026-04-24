import { create } from 'zustand';

export type AppLanguage = 'fr' | 'en';

type AppStore = {
  isDarkMode: boolean;
  language: AppLanguage;
  showPhoneOnListings: boolean;
  setDarkMode: (value: boolean) => void;
  setLanguage: (lang: AppLanguage) => void;
  setShowPhoneOnListings: (value: boolean) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  isDarkMode: false,
  language: 'fr',
  showPhoneOnListings: false,
  setDarkMode: (value) => set({ isDarkMode: value }),
  setLanguage: (lang) => set({ language: lang }),
  setShowPhoneOnListings: (value) => set({ showPhoneOnListings: value }),
}));
