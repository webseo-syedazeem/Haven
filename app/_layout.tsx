import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AppFonts } from '@/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    [AppFonts.sansRegular]: require('../assets/fonts/SFPro-400.OTF'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    [AppFonts.sansMedium]: require('../assets/fonts/SFPro-500.OTF'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    [AppFonts.sansSemiBold]: require('../assets/fonts/SFPro-500.OTF'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    [AppFonts.sansBold]: require('../assets/fonts/SFPro-700.OTF'),
    [AppFonts.displayMedium]: require('../assets/fonts/PlayfairDisplay-500.ttf'),
    [AppFonts.displaySemiBold]: require('../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
    [AppFonts.displayBold]: require('../assets/fonts/PlayfairDisplay-700.ttf'),
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#FFFFFF');
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <QueryClientProvider client={queryClient}>
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
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar backgroundColor="transparent" style="light" translucent />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
