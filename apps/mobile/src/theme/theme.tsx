import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { accentPresets, palette, type Palette, type ThemeName } from './tokens';

export interface Theme {
  name: ThemeName;
  colors: Palette;
}

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** "same as phone" when undefined. Settings will set this later. */
  preference?: ThemeName;
  accent?: string;
}

export function ThemeProvider({ children, preference, accent }: ThemeProviderProps) {
  const phone = useColorScheme();
  const name: ThemeName = preference ?? (phone === 'dark' ? 'dark' : 'light');

  const value = useMemo<Theme>(
    () => ({ name, colors: palette(name, accent ?? accentPresets[name][0]) }),
    [name, accent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return theme;
}
