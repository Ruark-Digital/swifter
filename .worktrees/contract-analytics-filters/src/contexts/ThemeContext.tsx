import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'swiftpro-theme',
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme) {
        return storedTheme;
      }
      
      // If no theme is stored, check if the user has a system preference
      if (defaultTheme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Apply the system preference immediately but still return 'system' as the theme
        document.documentElement.classList.add(systemPrefersDark ? 'dark' : 'light');
      }
    }
    return defaultTheme;
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      let systemTheme: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }

      const finalTheme = theme === 'system' ? systemTheme : theme;
      root.classList.add(finalTheme);
      setActualTheme(finalTheme);
      
      // Force a repaint to ensure the theme is applied
      document.body.style.display = 'none';
      document.body.offsetHeight; // Trigger a reflow
      document.body.style.display = '';
      
      // Log for debugging
      console.log(`Applied theme: ${finalTheme} (selected: ${theme})`);
    };
    
    // Apply theme immediately
    applyTheme();
    
    // Set a small timeout to ensure the theme is applied after any React rendering
    const timeoutId = setTimeout(applyTheme, 50);
    return () => clearTimeout(timeoutId);
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, theme);
        console.log(`Theme saved to localStorage: ${theme}`);
      } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
      }
    }
  }, [theme, storageKey]);
  
  // Debug current theme state
  useEffect(() => {
    console.log(`Current theme state - theme: ${theme}, actualTheme: ${actualTheme}`);
  }, [theme, actualTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
        setActualTheme(systemTheme);
        
        // Force a repaint to ensure the theme is applied
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger a reflow
        document.body.style.display = '';
        
        // Log for debugging
        console.log(`System theme changed to: ${systemTheme}`);
      }
    };

    // Initial check
    handleChange();
    
    // Use the correct event listener based on browser support
    let cleanup: () => void;
    
    try {
      // Modern browsers
      mediaQuery.addEventListener('change', handleChange);
      cleanup = () => mediaQuery.removeEventListener('change', handleChange);
    } catch (e) {
      // Older browsers
      mediaQuery.addListener(handleChange);
      cleanup = () => mediaQuery.removeListener(handleChange);
    }
    
    return cleanup
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};