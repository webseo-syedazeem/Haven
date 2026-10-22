import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode, useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HalcyonColors, HalcyonRadius, HalcyonSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import {
  useGuestModeActive,
  useHasSession,
  useSessionRestoring,
} from '@/hooks/useSession';
import { useAccountRequiredPrompt } from '@/components/auth/AccountRequiredPrompt';

/**
 * The gate in front of the screens that only mean something for a signed-in
 * account: the profile settings, and the Saved tab's server-backed segments.
 *
 * It is a gate, not guest mode. Home, Explore, Library, soundscape detail and
 * the player stay open to anyone, because browsing is meant to work without an
 * account. What this covers is the narrower case of a screen whose entire
 * contents come from `/api/me`-shaped endpoints, which without a session shows
 * a spinner that never resolves or an error that blames the network for
 * something that is not its fault.
 *
 * WHY IT WRAPS RATHER THAN RETURNS EARLY: `children` is an element, not a
 * rendered component. React only calls the child when this actually renders it,
 * so a gated screen's hooks — and the queries they own — never run while the
 * user is signed out. Putting the check inside the screen instead would let its
 * `useQuery` calls mount and fire first, and the prompt would be reacting to a
 * 401 rather than preventing it. This is also what makes a deep link straight
 * into a settings screen safe.
 */
export function RequireAuth({
  children,
  message,
  showBack = true,
  title = 'Sign in to see this',
  waiting,
}: {
  children: ReactNode;
  /** Overrides the line under the heading when a screen can be more specific. */
  message?: string;
  /** Off when the gate sits inside a screen that already has its own header. */
  showBack?: boolean;
  title?: string;
  /** Shown while the session is still unknown; a spinner by default. */
  waiting?: ReactNode;
}) {
  const hasSession = useHasSession();
  const isGuest = useGuestModeActive();
  const isRestoring = useSessionRestoring();

  if (hasSession) return <>{children}</>;

  // Not yet known is not the same as signed out. Telling somebody who is
  // signed in to log in, for the half second it takes to read their tokens
  // back, is worse than a spinner — and this branch renders neither the
  // children nor a request, so nothing fires either way.
  if (isRestoring) return <>{waiting ?? <GateSpinner />}</>;

  if (isGuest) {
    return <GuestAuthGate />;
  }

  return <SignInPrompt message={message} showBack={showBack} title={title} />;
}

function GuestAuthGate() {
  const router = useRouter();
  const { showAccountRequiredPrompt } = useAccountRequiredPrompt();

  useEffect(() => {
    showAccountRequiredPrompt({
      title: 'Please log in',
    });

    // Keep the shared prompt over the screen the guest came from. Rendering the
    // full-page sign-in gate here placed a second login UI behind the modal.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  }, [router, showAccountRequiredPrompt]);

  return <View style={styles.guestGatePlaceholder} />;
}

/**
 * The same check on its own, for a screen that gates only part of itself.
 */
export function useRequireAuth(): { hasSession: boolean; isRestoring: boolean } {
  return { hasSession: useHasSession(), isRestoring: useSessionRestoring() };
}

function GateSpinner() {
  return (
    <View style={styles.spinner}>
      <ActivityIndicator color={HalcyonColors.accent} />
    </View>
  );
}

/**
 * The prompt itself. Two ways out on purpose: the gold pill opens the shared
 * account-choice screen, while the chevron lets accidental visitors return.
 * A gate with no exit is a trap.
 */
export function SignInPrompt({
  message = 'This is part of your account. Log in and it will be here.',
  title = 'Sign in to see this',
  /** Off for a panel rendered inside a screen that already has its own header. */
  showBack = true,
}: {
  message?: string;
  title?: string;
  showBack?: boolean;
}) {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {showBack && (
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons color={HalcyonColors.textPrimary} name="chevron-back" size={19} />
            </Pressable>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.iconCircle}>
            <Ionicons color={HalcyonColors.accent} name="lock-closed-outline" size={26} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable
            accessibilityLabel="Log in"
            accessibilityRole="button"
            onPress={() => router.push('/welcome')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryLabel}>Log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  safeArea: { flex: 1 },
  spinner: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.background,
    flex: 1,
    justifyContent: 'center',
  },
  guestGatePlaceholder: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  backButton: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginTop: 6,
    width: 36,
  },
  pressed: { opacity: 0.72 },
  body: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  iconCircle: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 33,
    marginTop: 20,
    textAlign: 'center',
  },
  message: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    justifyContent: 'center',
    marginTop: 28,
    minHeight: 50,
    paddingHorizontal: 46,
  },
  primaryPressed: { backgroundColor: HalcyonColors.accentPressed },
  primaryLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
