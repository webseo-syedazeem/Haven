import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RequireAuth } from '@/components/RequireAuth';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SettingsGroup, SettingsRow, SettingsStatus } from '@/components/SettingsRow';
import { SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { PassageColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useHasSession } from '@/hooks/useSession';
import { useUser } from '@/hooks/useUser';
import { getDisplayName, getProfileEmail } from '@/lib/api/user';
import { clearUserSession } from '@/lib/auth/clearSession';
import { resetToLogin } from '@/lib/navigation';
import { usePlayerActions } from '@/lib/player/PlayerProvider';
import { deleteAccount } from '@/lib/passage-api';

/**
 * R-02. The account's own details, plus the two irreversible actions — signing
 * out and deleting the account. Delete used to live inside the change-email
 * screen, which is not where anyone would look for it.
 */
function AccountSettingContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { stop } = usePlayerActions();
  const hasSession = useHasSession();
  const { notice, showToast } = useToast();

  const { data: me, isInitialLoading, isError, refetch } = useUser();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const displayName = getDisplayName(me);
  const email = getProfileEmail(me);
  const profileImageUrl = me?.profile?.profile_image_url ?? '';

  const detail = (value: string) => {
    if (value) return value;
    if (isInitialLoading) return 'Loading…';
    if (isError) return 'Unavailable';
    return 'Not set';
  };

  async function confirmSignOut() {
    setBusy(true);
    try {
      await stop({ forgetResumable: true });
      await clearUserSession(queryClient);
      setSignOutVisible(false);
      resetToLogin(router);
    } catch {
      showToast('Could not sign out. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteAccount() {
    setBusy(true);
    try {
      await deleteAccount();
      await stop({ forgetResumable: true });
      await clearUserSession(queryClient);
      setDeleteVisible(false);
      resetToLogin(router);
    } catch (error) {
      setDeleteVisible(false);
      showToast(
        error instanceof Error ? error.message : 'Could not delete your account. Try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/account-snow-window-v2.webp')}
      backgroundOverlayColor="rgba(0,0,0,0.18)"
      scrollingBackground
      overlay={
        <>
          <ConfirmDialog
            confirmLabel="Sign out"
            icon="log-out-outline"
            loading={busy}
            message="You can sign back in at any time."
            onCancel={() => setSignOutVisible(false)}
            onConfirm={() => void confirmSignOut()}
            showCancel={false}
            showIcon={false}
            title="Sign out?"
            visible={signOutVisible}
          />
          <ConfirmDialog
            confirmLabel="Delete account"
            destructive
            icon="trash-outline"
            loading={busy}
            message="This permanently removes your account, your saved soundscapes, playlists and listening history. It cannot be undone."
            onCancel={() => setDeleteVisible(false)}
            onConfirm={() => void confirmDeleteAccount()}
            title="Delete your account?"
            visible={deleteVisible}
          />
          <Toast bottom={72} notice={notice} />
        </>
      }
      subtitle="Your details, and how they are stored."
      title="Account">
      <View style={styles.avatarBlock}>
        <ProfileAvatar
          iconColor={PassageColors.textSecondary}
          imageUrl={profileImageUrl}
          placeholderBackgroundColor={PassageColors.surfaceRaised}
          size={88}
          style={styles.avatar}
        />
        <Pressable
          accessibilityLabel="Edit profile picture"
          accessibilityRole="button"
          onPress={() => router.push('/profile/profile-picture')}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>
      </View>

      {isError && (
        <Pressable
          accessibilityLabel="Retry loading your account"
          accessibilityRole="button"
          onPress={() => void refetch()}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <Text style={styles.retryLabel}>Couldn&apos;t load your details. Try again.</Text>
        </Pressable>
      )}

      <SettingsGroup>
        <SettingsRow
          icon="person-outline"
          label="Name"
          onPress={() => router.push('/profile/edit-name')}
          value={detail(displayName)}
        />
        <SettingsRow
          icon="mail-outline"
          label="Email"
          onPress={() => router.push('/profile/change-email')}
          value={detail(email)}
        />
        <SettingsRow
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => router.push('/profile/update-password')}
        />
      </SettingsGroup>

      <SettingsGroup
        footnote={
          hasSession
            ? 'Your favourites, playlists, preferences and listening history are stored on your Passage account, so they follow you to a new device.'
            : 'Sign in to back your library up to your Passage account.'
        }>
        <SettingsRow
          accessory={
            hasSession ? (
              <SettingsStatus label="Synced" />
            ) : (
              <SettingsStatus icon="cloud-offline-outline" label="Offline" />
            )
          }
          icon="cloud-outline"
          label="Sync"
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon="log-out-outline"
          label="Sign out"
          onPress={() => setSignOutVisible(true)}
          showChevron={false}
        />
        <SettingsRow
          destructive
          icon="trash-outline"
          label="Delete Account"
          onPress={() => setDeleteVisible(true)}
          showChevron={false}
        />
      </SettingsGroup>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 26,
  },
  avatar: {
    borderColor: PassageColors.border,
    borderWidth: 1,
  },
  editButton: {
    borderColor: PassageColors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  editLabel: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.75,
  },
  retry: {
    marginBottom: 16,
  },
  retryLabel: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
});

/**
 * The gate renders AccountSettingContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function AccountSettingScreen() {
  return (
    <RequireAuth message="There is no account to manage until you log in.">
      <AccountSettingContent />
    </RequireAuth>
  );
}
