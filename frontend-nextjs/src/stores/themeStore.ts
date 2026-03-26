import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'auto',

      setTheme: (theme: Theme) => {
        set({ theme });
        updateDocumentTheme(theme);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme: Theme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'auto' : 'light';
        set({ theme: newTheme });
        updateDocumentTheme(newTheme);
      },

      getEffectiveTheme: () => {
        const theme = get().theme;
        if (theme === 'auto') {
          if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          return 'dark';
        }
        return theme;
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

function updateDocumentTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const theme = useThemeStore.getState().theme;
    if (theme === 'auto') {
      updateDocumentTheme(theme);
    }
  });
}
