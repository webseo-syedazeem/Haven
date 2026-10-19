import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAccountRequiredPrompt } from '@/components/auth/AccountRequiredPrompt';
import { SwipeTabsWrapper } from '@/components/navigation/SwipeTabsWrapper';
import { AvatarPreview } from '@/components/profile/AvatarPreview';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors, HalcyonSpacing, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useTabContentInset } from '@/hooks/use-bottom-safe-spacing';
import { useGuestModeActive, useHasSession } from '@/hooks/useSession';
import { useUser } from '@/hooks/useUser';
import { getDisplayName, getProfileEmail } from '@/lib/api/user';
import { clearUserSession } from '@/lib/auth/clearSession';
import { setIntroSeen } from '@/lib/auth/intro-flag';
import { setGuestModeActive } from '@/lib/auth/session-state';
import { resetGuestOnboardingState } from '@/lib/onboarding';
import { resetToLogin } from '@/lib/navigation';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

/** R-01. Every row here is a screen in `app/profile/`. */
const SETTINGS_ROWS = [
  { label: 'Account', icon: 'person-outline', route: '/profile/account-setting' },
  { label: 'Sound Preferences', icon: 'musical-notes-outline', route: '/profile/sound-preferences' },
  { label: 'Sounds to Avoid', icon: 'ban-outline', route: '/profile/sounds-to-avoid' },
  { label: 'Playback', icon: 'play-circle-outline', route: '/profile/playback-settings' },
  { label: 'Notifications', icon: 'notifications-outline', route: '/profile/notification' },
  { label: 'Privacy & Data', icon: 'lock-closed-outline', route: '/profile/privacy-data' },
] as const;

const SUPPORT_ROWS = [
  { label: 'Help Centre', icon: 'help-circle-outline', requiresAccount: false, route: '/profile/help' },
  {
    label: 'Contact Support',
    icon: 'chatbubble-ellipses-outline',
    requiresAccount: true,
    route: '/profile/contact-support',
  },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const bottomInset = useTabContentInset();
  const hasSession = useHasSession();
  const isGuest = useGuestModeActive();
  const { stop } = usePlayerActions();
  const { showAccountRequiredPrompt } = useAccountRequiredPrompt();
  const { notice, showToast } = useToast();

  const { data: me, isInitialLoading, isError, refetch } = useUser();
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = scrollAnim.interpolate({
    inputRange: [0, 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const displayName = getDisplayName(me);
  const email = getProfileEmail(me);
  const profileImageUrl = me?.profile?.profile_image_url ?? '';

  // The cached profile outlives a failed refresh, so a real email beats the
  // offline notice — that line is for a device that has never fetched one.
  const tagline =
    isGuest
      ? 'Browsing as guest'
      : email ||
        (isError
          ? 'Your details are offline right now.'
          : isInitialLoading
            ? 'Loading your details…'
            : 'Signed in to Passage');

  function openProfileRoute(route: Href, requiresAccount = true) {
    if (requiresAccount && isGuest) {
      showAccountRequiredPrompt({
        title: 'Log in to continue',
        message: 'Log in to manage your account settings.',
      });
      return;
    }

    router.push(route);
  }

  // Choosing to sign in ends guest mode: with no back arrow on Login, backing out
  // exits the app, and the next launch must open Login again, not the guest app.
  async function leaveGuestForLogin() {
    // Guest playback belongs to the guest session too. Tear down the native
    // player and notification before leaving so audio cannot continue on Login.
    await stop({ forgetResumable: true });
    await setGuestModeActive(false);
    await resetGuestOnboardingState();
    await setIntroSeen();
    resetToLogin(router);
  }

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      // Silence the soundscape (and its notification) while the account is still
      // signed in, so its progress is saved, then forget it with the account.
      await stop({ forgetResumable: true });
      await clearUserSession(queryClient);
      setSignOutVisible(false);
      resetToLogin(router);
    } catch {
      showToast('Could not sign out. Try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SwipeTabsWrapper>
      <View style={styles.screen}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          <ImageBackground
            resizeMode="cover"
            source={require('@/assets/images/profile-autumn-compact-v3.webp')}
            style={[styles.scrollScene, { paddingBottom: bottomInset, paddingTop: insets.top + 18 }]}>
            <LinearGradient
              colors={['rgba(0,0,0,0.58)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0)']}
              locations={[0, 0.22, 0.38]}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="View profile picture"
                accessibilityRole="button"
                disabled={!profileImageUrl}
                onPress={() => setAvatarPreviewVisible(true)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ProfileAvatar
                  iconColor="#FFFFFF"
                  imageUrl={profileImageUrl}
                  placeholderBackgroundColor={HalcyonColors.surfaceRaised}
                  size={96}
                  style={styles.avatar}
                />
              </Pressable>

              <Text style={styles.name}>{displayName || (hasSession ? 'Your profile' : 'Guest')}</Text>
              <Text style={styles.tagline}>{tagline}</Text>

              {isError && (
                <Pressable
                  accessibilityLabel="Retry loading your profile"
                  accessibilityRole="button"
                  onPress={() => void refetch()}
                  style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
                  <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
              )}
            </View>

            <SettingsGroup>
              {SETTINGS_ROWS.map((row) => (
                <SettingsRow
                  icon={row.icon}
                  key={row.label}
                  label={row.label}
                  onPress={() => openProfileRoute(row.route as Href)}
                />
              ))}
            </SettingsGroup>

            <SettingsGroup>
              {SUPPORT_ROWS.map((row) => (
                <SettingsRow
                  icon={row.icon}
                  key={row.label}
                  label={row.label}
                  onPress={() =>
                    openProfileRoute(row.route as Href, row.requiresAccount)
                  }
                />
              ))}
            </SettingsGroup>

            <SettingsGroup>
              {hasSession ? (
                <SettingsRow
                  icon="log-out-outline"
                  label="Sign out"
                  onPress={() => setSignOutVisible(true)}
                  showChevron={false}
                />
              ) : (
                <SettingsRow
                  icon="log-in-outline"
                  label="Sign in"
                  onPress={() => void leaveGuestForLogin()}
                />
              )}
            </SettingsGroup>

            <Text style={styles.version}>Passage · free, with no subscription</Text>
          </ImageBackground>
        </Animated.ScrollView>

        <Animated.View
          pointerEvents="none"
          style={[styles.topOverlay, { height: insets.top, opacity: overlayOpacity }]}
        />

        <AvatarPreview
          imageUrl={profileImageUrl}
          onClose={() => setAvatarPreviewVisible(false)}
          visible={avatarPreviewVisible}
        />

        <ConfirmDialog
          confirmLabel="Sign out"
          icon="log-out-outline"
          loading={signingOut}
          message="You can sign back in at any time."
          onCancel={() => setSignOutVisible(false)}
          onConfirm={() => void confirmSignOut()}
          showCancel={false}
          showIcon={false}
          title="Sign out?"
          visible={signOutVisible}
        />

        <Toast bottom={bottomInset} notice={notice} />
      </View>
    </SwipeTabsWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollScene: {
    flexGrow: 1,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  topOverlay: {
    backgroundColor: '#000000',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    borderColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  name: {
    ...Typography.screenHeading,
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    ...Typography.muted,
    color: 'rgba(255,255,255,0.94)',
    marginTop: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  retry: {
    borderColor: HalcyonColors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryLabel: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  version: {
    ...Typography.muted,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
    textAlign: 'center',
  },
});
