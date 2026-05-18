import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    'Playfair Display': PlayfairDisplay_700Bold,
    'PlayfairDisplay-SemiBold': require('@/assets/fonts/PlayfairDisplay-SemiBold.ttf'),
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('transparent');
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="create-account" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sleep-check" options={{ headerShown: false }} />
          <Stack.Screen name="day-feel" options={{ headerShown: false }} />
          <Stack.Screen name="most-helpful" options={{ headerShown: false }} />
          <Stack.Screen name="stress-step" options={{ headerShown: false }} />
            <Stack.Screen name="daily-reflection" options={{ headerShown: false }} />
        <Stack.Screen name="thank-you" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar backgroundColor="transparent" style="light" translucent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
