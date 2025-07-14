import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Au montage, on récupère le thème sauvegardé ou on utilise le thème système
  useEffect(() => {
    try {
      // Essayer de récupérer le thème depuis les paramètres de l'application
      const appSettings = localStorage.getItem('appSettings');
      let savedTheme: Theme | null = null;
      
      if (appSettings) {
        const parsedSettings = JSON.parse(appSettings);
        if (parsedSettings.general?.theme) {
          savedTheme = parsedSettings.general.theme;
        }
      }
      
      // Si aucun thème n'est défini dans les paramètres, vérifier l'ancien emplacement
      if (!savedTheme) {
        const oldTheme = localStorage.getItem('theme') as Theme | null;
        if (oldTheme) {
          savedTheme = oldTheme;
        }
      }
      
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    } finally {
      setMounted(true);
    }
  }, []);

  // Appliquer le thème quand il change
  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    
    // Supprimer les classes de thème existantes
    root.classList.remove('light', 'dark');
    
    let newResolvedTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      // Utiliser la préférence système
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
      newResolvedTheme = systemTheme;
      root.classList.add(systemTheme);
    } else {
      // Utiliser le thème sélectionné
      newResolvedTheme = theme;
      root.classList.add(theme);
    }
    
    setResolvedTheme(newResolvedTheme);
    
    // Mettre à jour la balise meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newResolvedTheme === 'dark' ? '#0f172a' : '#ffffff');
    }
    
    // Ajouter une classe au body pour les transitions fluides
    const applyTransition = () => {
      const body = document.body;
      body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      
      // Supprimer la transition après qu'elle soit terminée
      setTimeout(() => {
        body.style.transition = '';
      }, 300);
    };
    
    applyTransition();
    
  }, [theme, mounted]);
  
  // Écouter les changements de préférence système
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  // Ne pas rendre l'interface avant que le thème soit chargé
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
