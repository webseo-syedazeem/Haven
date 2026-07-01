import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SystemBars } from 'react-native-edge-to-edge';
import { AppFonts } from '@/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryClientProvider } from '@tanstack/react-query';
import { SetupProvider } from '@/contexts/SetupContext';
import { ProgressProvider } from '@/contexts/ProgressContext';
import { ChecklistProvider } from '@/contexts/ChecklistContext';
import { DailyEaseProvider } from '@/contexts/DailyEaseContext';
import { queryClient } from '@/lib/query-client';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: '(tabs)' };


export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    [AppFonts.sansRegular]: require('../assets/fonts/SFPro-400.OTF'),
    [AppFonts.sansMedium]: require('../assets/fonts/SFPro-500.OTF'),
    [AppFonts.sansSemiBold]: require('../assets/fonts/SFPro-500.OTF'),
    [AppFonts.sansBold]: require('../assets/fonts/SFPro-700.OTF'),
    [AppFonts.displayRegular]: require('../assets/fonts/PlayfairDisplay-400.ttf'),
    [AppFonts.displayMedium]: require('../assets/fonts/PlayfairDisplay-500.ttf'),
    [AppFonts.displaySemiBold]: require('../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
    [AppFonts.displayBold]: require('../assets/fonts/PlayfairDisplay-700.ttf'),
  });

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync('transparent');
    if (Platform.OS === 'android') {
      void NavigationBar.setButtonStyleAsync('dark');
    }
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
          <SetupProvider>
          <ProgressProvider>
          <DailyEaseProvider>
          <ChecklistProvider>
            <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="create-account" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="reset-password" options={{ headerShown: false }} />
              <Stack.Screen name="change-password" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="calm-plan" options={{ headerShown: false }} />
              <Stack.Screen name="tools" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen name="feeling-lately" options={{ headerShown: false }} />
              <Stack.Screen name="feels-realistic" options={{ headerShown: false }} />
              <Stack.Screen name="sleep-check" options={{ headerShown: false }} />
              <Stack.Screen name="day-feel" options={{ headerShown: false }} />
              <Stack.Screen name="most-helpful" options={{ headerShown: false }} />
              <Stack.Screen name="stress-step" options={{ headerShown: false }} />
              <Stack.Screen name="daily-reflection" options={{ headerShown: false }} />
              <Stack.Screen name="thank-you" options={{ headerShown: false }} />
            <Stack.Screen name="insight-details" options={{ headerShown: false }} />
              <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <SystemBars style={{ navigationBar: 'dark', statusBar: 'dark' }} />
          </ChecklistProvider>
          </DailyEaseProvider>
          </ProgressProvider>
          </SetupProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
