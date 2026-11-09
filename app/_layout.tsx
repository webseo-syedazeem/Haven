import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_500Medium_Italic,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Redirect, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { Component, type ReactNode, useEffect } from 'react';
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
import { useHasSession, useSessionRestoring } from '@/hooks/useSession';
import { isExplicitSignOutInFlight } from '@/lib/auth/session-state';

const PUBLIC_AUTH_ROUTES = new Set([
  'index',
  'welcome',
  'login',
  'create-account',
  'verify-email',
  'verified',
  'reset-password',
  'reset-email-sent',
  'password-reset-success',
  'auth/callback',
]);

const PUBLIC_PRE_AUTH_ONBOARDING_ROUTES = new Set([
  'why-passage',
  'what-it-does',
  'select-focus',
  'stress-intro-1',
  'stress-intro-2',
  'backed-by-science',
  'onboarding/situation',
  'onboarding/personalise',
  'onboarding/relax-science',
  'onboarding/relax-main-goal',
  'onboarding/relax-causes',
  'onboarding/relax-calming-moments',
  'onboarding/relax-your-fit',
  'onboarding/relax-trust',
  'onboarding/your-fit',
  'onboarding/trust',
  'onboarding/try-passage',
]);

function AuthenticationBoundary({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const hasSession = useHasSession();
  const restoring = useSessionRestoring();
  const route = segments.join('/') || 'index';

  if (restoring) return null;
  if (
    !hasSession &&
    !isExplicitSignOutInFlight() &&
    !PUBLIC_AUTH_ROUTES.has(route) &&
    !PUBLIC_PRE_AUTH_ONBOARDING_ROUTES.has(route)
  ) {
    return <Redirect href="/login?launch=1" />;
  }
  return <>{children}</>;
}

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: '(tabs)' };

// Expo Router reads this named export and wraps the layout with it automatically.
export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      const { View, Text, Pressable, StyleSheet } = require('react-native');
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Something went wrong</Text>
          <Text style={eb.body}>Please restart the app to continue.</Text>
          <Pressable
            style={eb.button}
            onPress={() => this.setState({ hasError: false })}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={eb.buttonLabel}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = (() => {
  const { StyleSheet } = require('react-native');
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B0D', alignItems: 'center', justifyContent: 'center', padding: 32 },
    title: { color: '#F5F0EB', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
    body: { color: '#9C978E', fontSize: 15, textAlign: 'center', marginBottom: 32 },
    button: { backgroundColor: '#1A1A1F', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
    buttonLabel: { color: '#C3A17A', fontSize: 15, fontWeight: '600' },
  });
})();


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
                  <AuthenticationBoundary>
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
                <Stack.Screen name="reset-email-sent" options={{ headerShown: false }} />
                <Stack.Screen
                  name="password-reset-success"
                  options={{ gestureEnabled: false, headerShown: false }}
                />
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
                  </AuthenticationBoundary>
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
