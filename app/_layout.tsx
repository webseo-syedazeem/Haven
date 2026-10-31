import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_500Medium_Italic,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
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
import { runStartupCleanup } from '@/lib/startup-cleanup';
import { persistOptions } from '@/lib/query-persist';
import { queryClient } from '@/lib/query-client';
import { PlayerProvider } from '@/lib/player/PlayerProvider';
import { AccountRequiredPromptProvider } from '@/components/auth/AccountRequiredPrompt';
import { DevResetButton } from '@/components/dev/DevResetButton';
import { DevOnboardingReplayButton } from '@/components/dev/DevOnboardingReplayButton';
import { AnalyticsLifecycle } from '@/components/AnalyticsLifecycle';
import { ServiceAvailability } from '@/components/ServiceAvailability';
import { Sentry } from '@/lib/observability';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: '(tabs)' };


function RootLayout() {
  const colorScheme = useColorScheme();

  // Static, per-weight Inter font files — ONE family for the entire app
  // (client requirement: "same font across the app"). `AppFonts.sans*` and
  // `AppFonts.display*` are both role-based tokens (weight/heading), but every
  // one of them resolves to an Inter weight below, so this single map
  // registers each unique file once. `displayMediumItalic` loads Inter's own
  // italic cut, so the onboarding quote-card treatment stays italic without
  // pulling in a second typeface.
  const [fontsLoaded, fontError] = useFonts({
    [AppFonts.sansRegular]: Inter_400Regular,
    [AppFonts.sansMedium]: Inter_500Medium,
    [AppFonts.sansSemiBold]: Inter_600SemiBold,
    [AppFonts.sansBold]: Inter_700Bold,
    [AppFonts.displayMediumItalic]: Inter_500Medium_Italic,
  });
  // Proceed with system fonts if a font fails to load, rather than holding the
  // splash screen forever on a null render (audit L-5).
  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync('transparent');
    // Runs once per launch, whatever route the app was opened on, so screens
    // deep linked past the entry screen still get their session restored.
    void restoreSession();
    // Removes files left by retired features (recents audio, downloads).
    void runStartupCleanup();
  }, []);

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
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
            <AccountRequiredPromptProvider>
              <PlayerProvider>
                <ServiceAvailability>
                  <AnalyticsLifecycle />
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="why-passage" options={{ headerShown: false }} />
                <Stack.Screen name="what-it-does" options={{ headerShown: false }} />
                <Stack.Screen name="select-focus" options={{ headerShown: false }} />
                <Stack.Screen name="create-account" options={{ headerShown: false }} />
                <Stack.Screen name="stress-intro-1" options={{ headerShown: false }} />
                <Stack.Screen name="stress-intro-2" options={{ headerShown: false }} />
                <Stack.Screen name="trusted" options={{ headerShown: false }} />
                <Stack.Screen name="backed-by-science" options={{ headerShown: false }} />
                <Stack.Screen name="unique" options={{ headerShown: false }} />
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
                <Stack.Screen name="onboarding/relax-science" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/relax-main-goal" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/relax-causes" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/relax-calming-moments" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/relax-your-fit" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/relax-trust" options={{ headerShown: false }} />
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
                  </Stack>
                </ServiceAvailability>
                {/* `light` means light bar content, i.e. white navigation arrows. */}
                <SystemBars style={{ navigationBar: 'light', statusBar: 'light' }} />
                <DevResetButton />
                <DevOnboardingReplayButton />
              </PlayerProvider>
            </AccountRequiredPromptProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
