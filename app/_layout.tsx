import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SystemBars } from 'react-native-edge-to-edge';
import { AppFonts } from '@/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryClientProvider } from '@tanstack/react-query';
import { restoreSession } from '@/lib/auth/restore-session';
import { queryClient } from '@/lib/query-client';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: '(tabs)' };


export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    [AppFonts.sansRegular]: require('../assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
    [AppFonts.displayRegular]: require('../assets/fonts/CormorantGaramond-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync('transparent');
    // Runs once per launch, whatever route the app was opened on, so screens
    // deep linked past the entry screen still get their session restored.
    void restoreSession();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="create-account" options={{ headerShown: false }} />
              <Stack.Screen name="environment" options={{ headerShown: false }} />
              <Stack.Screen name="how-it-works" options={{ headerShown: false }} />
              <Stack.Screen name="trusted" options={{ headerShown: false }} />
              <Stack.Screen name="backed-by-science" options={{ headerShown: false }} />
              <Stack.Screen name="unique" options={{ headerShown: false }} />
              <Stack.Screen name="passage-help" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="reset-password" options={{ headerShown: false }} />
              <Stack.Screen name="change-password" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            {/* `light` means light bar content, i.e. white navigation arrows. */}
            <SystemBars style={{ navigationBar: 'light', statusBar: 'dark' }} />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
