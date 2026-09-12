import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SwipeTabsWrapper } from '@/components/navigation/SwipeTabsWrapper';
import { AvatarPreview } from '@/components/profile/AvatarPreview';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors, HalcyonSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useTabContentInset } from '@/hooks/use-bottom-safe-spacing';
import { useHasSession } from '@/hooks/useSession';
import { useUser } from '@/hooks/useUser';
import { getDisplayName, getProfileEmail } from '@/lib/api/user';
import { clearUserSession } from '@/lib/auth/clearSession';

/** R-01. Every row here is a screen in `app/profile/`. */
const SETTINGS_ROWS = [
  { label: 'Account', icon: 'person-outline', route: '/profile/account-setting' },
  { label: 'Sound Preferences', icon: 'musical-notes-outline', route: '/profile/sound-preferences' },
  { label: 'Sounds to Avoid', icon: 'ban-outline', route: '/profile/sounds-to-avoid' },
  { label: 'Playback', icon: 'play-circle-outline', route: '/profile/playback-settings' },
  { label: 'Downloads', icon: 'download-outline', route: '/profile/download-settings' },
  { label: 'Notifications', icon: 'notifications-outline', route: '/profile/notification' },
  { label: 'Privacy & Data', icon: 'lock-closed-outline', route: '/profile/privacy-data' },
] as const;

const SUPPORT_ROWS = [
  { label: 'Help Centre', icon: 'help-circle-outline', route: '/profile/help' },
  { label: 'Contact Support', icon: 'chatbubble-ellipses-outline', route: '/profile/contact-support' },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const bottomInset = useTabContentInset();
  const hasSession = useHasSession();
  const { notice, showToast } = useToast();

  const { data: me, isInitialLoading, isError, refetch } = useUser();
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = getDisplayName(me);
  const email = getProfileEmail(me);
  const profileImageUrl = me?.profile?.profile_image_url ?? '';

  // The cached profile outlives a failed refresh, so a real email beats the
  // offline notice — that line is for a device that has never fetched one.
  const tagline =
    email ||
    (isError
      ? 'Your details are offline right now.'
      : isInitialLoading
        ? 'Loading your details…'
        : 'Signed in to Passage');

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await clearUserSession(queryClient);
      setSignOutVisible(false);
      router.replace('/login?signedOut=1' as Href);
    } catch {
      showToast('Could not sign out. Try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SwipeTabsWrapper>
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="View profile picture"
                accessibilityRole="button"
                disabled={!profileImageUrl}
                onPress={() => setAvatarPreviewVisible(true)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ProfileAvatar
                  iconColor={HalcyonColors.textSecondary}
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
                  onPress={() => router.push(row.route as Href)}
                />
              ))}
            </SettingsGroup>

            <SettingsGroup>
              {SUPPORT_ROWS.map((row) => (
                <SettingsRow
                  icon={row.icon}
                  key={row.label}
                  label={row.label}
                  onPress={() => router.push(row.route as Href)}
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
                  onPress={() => router.push('/login')}
                />
              )}
            </SettingsGroup>

            <Text style={styles.version}>Passage · free, with no subscription</Text>
          </ScrollView>
        </SafeAreaView>

        <AvatarPreview
          imageUrl={profileImageUrl}
          onClose={() => setAvatarPreviewVisible(false)}
          visible={avatarPreviewVisible}
        />

        <ConfirmDialog
          confirmLabel="Sign out"
          icon="log-out-outline"
          loading={signingOut}
          message="You can sign back in at any time. Downloads stay on this device."
          onCancel={() => setSignOutVisible(false)}
          onConfirm={() => void confirmSignOut()}
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
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    borderColor: HalcyonColors.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  name: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    marginTop: 16,
    textAlign: 'center',
  },
  tagline: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
    textAlign: 'center',
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
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    opacity: 0.7,
    textAlign: 'center',
  },
});
