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
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { restoreSession } from '@/lib/auth/restore-session';
import { hydrateOfflineAudio } from '@/lib/offline-audio';
import { persistOptions } from '@/lib/query-persist';
import { queryClient } from '@/lib/query-client';
import { PlayerProvider } from '@/lib/player/PlayerProvider';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: '(tabs)' };


export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    [AppFonts.sansRegular]: require('../assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
    [AppFonts.displayRegular]: require('../assets/fonts/CormorantGaramond-VariableFont_wght.ttf'),
    [AppFonts.playfairRegular]: require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    [AppFonts.playfairMedium]: require('../assets/fonts/PlayfairDisplay-Medium.ttf'),
    [AppFonts.playfairItalic]: require('../assets/fonts/PlayfairDisplay-Italic.ttf'),
  });

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync('transparent');
    // Runs once per launch, whatever route the app was opened on, so screens
    // deep linked past the entry screen still get their session restored.
    void restoreSession();
    // Reads permanent downloads before anything asks what is saved and removes
    // files left by the retired automatic recents-audio cache.
    void hydrateOfflineAudio();
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
          {/* Restores the persisted query cache before the first render, so a
              launch with no connection opens on the last data the app saw
              rather than on empty states. */}
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <PlayerProvider>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="why-passage" options={{ headerShown: false }} />
                <Stack.Screen name="what-it-does" options={{ headerShown: false }} />
                <Stack.Screen name="select-focus" options={{ headerShown: false }} />
                <Stack.Screen name="create-account" options={{ headerShown: false }} />
                <Stack.Screen name="environment" options={{ headerShown: false }} />
                <Stack.Screen name="stress-intro-1" options={{ headerShown: false }} />
                <Stack.Screen name="stress-intro-2" options={{ headerShown: false }} />
                <Stack.Screen name="how-it-works" options={{ headerShown: false }} />
                <Stack.Screen name="trusted" options={{ headerShown: false }} />
                <Stack.Screen name="backed-by-science" options={{ headerShown: false }} />
                 <Stack.Screen name="the-promise" options={{ headerShown: false }} />
                <Stack.Screen name="unique" options={{ headerShown: false }} />
                <Stack.Screen name="passage-help" options={{ headerShown: false }} />
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="verify-email" options={{ headerShown: false }} />
                <Stack.Screen
                  name="verified"
                  options={{ gestureEnabled: false, headerShown: false }}
                />
                <Stack.Screen name="reset-password" options={{ headerShown: false }} />
                <Stack.Screen name="change-password" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/situation" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/personalise" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/environments" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/sounds-to-avoid" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/detail-preference" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/session-length" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/the-ritual" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/your-fit" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/trust" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/try-passage" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/building-profile" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/recommendations" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="mode/[mode]" options={{ headerShown: false }} />
                <Stack.Screen name="soundscape/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="collection/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="playlist/[id]" options={{ headerShown: false }} />
                <Stack.Screen
                  name="player"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              {/* `light` means light bar content, i.e. white navigation arrows. */}
              <SystemBars style={{ navigationBar: 'light', statusBar: 'light' }} />
            </PlayerProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
