import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
  SchibstedGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/schibsted-grotesk';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { StoreProvider, useStore } from '@/data/store';
import { accentPresets, ThemeProvider, useTheme, type ThemeName } from '@/theme';
import { useColorScheme } from 'react-native';

void SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { name, colors } = useTheme();
  return (
    <>
      <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ground },
        }}
      />
    </>
  );
}

/** The user's Look settings, applied as the theme. */
function SettingsTheme({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const phone = useColorScheme();
  const { theme, accentIndex } = store.state.settings;
  const name: ThemeName = theme === 'phone' ? (phone === 'dark' ? 'dark' : 'light') : theme;
  const accent = accentPresets[name][accentIndex] ?? accentPresets[name][0];
  return (
    <ThemeProvider preference={name} accent={accent}>
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <StoreProvider>
      <SettingsTheme>
        <Navigator />
      </SettingsTheme>
    </StoreProvider>
  );
}
