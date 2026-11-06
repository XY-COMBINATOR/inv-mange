import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'invmage:theme';

const getSystemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
    } catch {
      return 'system';
    }
  });
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;
    const onChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#141218' : '#FEF7FF',
      );
    }
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore storage errors */
    }
  }, [mode, resolvedTheme]);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
      toggle: () => setMode(resolvedTheme === 'dark' ? 'light' : 'dark'),
    }),
    [mode, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return context;
}
