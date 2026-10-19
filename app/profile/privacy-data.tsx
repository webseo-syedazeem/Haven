import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RequireAuth } from '@/components/RequireAuth';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useAccountExport } from '@/hooks/useAccountExport';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/lib/analytics';
import { clearUserSession } from '@/lib/auth/clearSession';
import { resetToLogin } from '@/lib/navigation';
import { usePlayerActions } from '@/lib/player/PlayerProvider';
import { deleteAccount } from '@/lib/haven-api';

/**
 * R-08. The hub for what Passage holds about you and what you can do with it.
 *
 * The analytics toggle is device-local: there is no opt-out field on the API,
 * so the choice is stored on the device and `lib/analytics.ts` refuses to send
 * anything while it is off.
 */
function PrivacyDataContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { stop } = usePlayerActions();
  const { notice, showToast } = useToast();

  const exportData = useAccountExport();
  const [analyticsOn, setAnalyticsOn] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    void isAnalyticsEnabled().then((value) => {
      if (active) setAnalyticsOn(value);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleAnalytics = useCallback(
    async (value: boolean) => {
      setAnalyticsOn(value);
      try {
        await setAnalyticsEnabled(value);
        showToast(value ? 'Anonymous analytics on.' : 'Anonymous analytics off.');
      } catch {
        setAnalyticsOn(!value);
        showToast('Could not save that. Try again.');
      }
    },
    [showToast]
  );

  const handleExport = useCallback(() => {
    exportData.mutate(undefined, {
      onSuccess: (result) => {
        showToast(
          result.delivered === 'shared'
            ? 'Your data is ready to save or send.'
            : result.delivered === 'saved'
              ? 'Export saved to this device.'
              : 'Export ready.'
        );
      },
      onError: () => showToast('Could not build your export. Try again.'),
    });
  }, [exportData, showToast]);

  const confirmDeleteAccount = useCallback(async () => {
    setDeleting(true);
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
      setDeleting(false);
    }
  }, [queryClient, router, showToast, stop]);

  return (
    <SettingsScreen
      scrollingBackground
      overlay={
        <>
          <ConfirmDialog
            confirmLabel="Delete account"
            destructive
            icon="trash-outline"
            loading={deleting}
            message="This permanently removes your account, your saved soundscapes, playlists and listening history. It cannot be undone."
            onCancel={() => setDeleteVisible(false)}
            onConfirm={() => void confirmDeleteAccount()}
            title="Delete your account?"
            visible={deleteVisible}
          />
          <Toast bottom={72} notice={notice} />
        </>
      }
      backgroundImage={require('@/assets/images/notifications-top-woodland-realistic-final.webp')}
      subtitle="What we hold, and what you can do with it."
      title="Privacy & Data">
      <SettingsGroup title="Policies">
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => router.push('/profile/privacy-policy')}
        />
        <SettingsRow
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => router.push('/profile/terms')}
        />
      </SettingsGroup>

      <SettingsGroup
        footnote="Your export is a JSON file containing your account, favourites, playlists, listening history, preferences and support requests.">
        <SettingsRow
          busy={exportData.isPending}
          description="Everything Passage stores for you, as a file."
          icon="download-outline"
          label="Export my data"
          onPress={handleExport}
        />
      </SettingsGroup>

      <SettingsGroup
        footnote="Off by default. When off, Passage sends no usage events at all.">
        <SettingsRow
          description="Helps us see which soundscapes work, never who listened."
          icon="stats-chart-outline"
          label="Share anonymous usage analytics"
          toggle={{
            value: analyticsOn,
            onValueChange: (value) => void handleAnalytics(value),
          }}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          destructive
          icon="trash-outline"
          label="Delete Account"
          onPress={() => setDeleteVisible(true)}
          showChevron={false}
        />
      </SettingsGroup>

      <Text style={styles.footnote}>
        Passage is free. There is no subscription, no payment information, and nothing to cancel.
      </Text>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  footnote: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
});

/**
 * The gate renders PrivacyDataContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function PrivacyDataScreen() {
  return (
    <RequireAuth message="Your data and privacy controls need an account to act on.">
      <PrivacyDataContent />
    </RequireAuth>
  );
}
