import { Paths } from 'expo-file-system';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/EmptyState';
import { OptionSheet, type SheetOption } from '@/components/OptionSheet';
import { RequireAuth } from '@/components/RequireAuth';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useDownloadsStorage, useRemoveAllDownloads } from '@/hooks/useDownloads';
import { useDownloadSettings, useUpdateDownloadSettings } from '@/hooks/usePreferences';
import type { DownloadSettings, Quality } from '@/lib/api/preferences';
import { formatBytes } from '@/lib/utils/bytes';

const QUALITY_OPTIONS: readonly SheetOption<Quality>[] = [
  { value: 'standard', label: 'Standard', description: 'Smaller files, quicker to save.' },
  { value: 'high', label: 'High', description: 'Full detail, roughly twice the size.' },
];

/** Device totals are unavailable on web and can throw on a locked volume. */
function readDiskSpace(): { total: number; available: number } | null {
  if (Platform.OS === 'web') return null;

  try {
    const total = Paths.totalDiskSpace;
    const available = Paths.availableDiskSpace;
    if (!total || total <= 0) return null;
    return { total, available: Math.max(0, Math.min(available ?? 0, total)) };
  } catch {
    return null;
  }
}

/**
 * R-06. Storage comes from `GET /api/downloads/storage`, which sums
 * `file_size_bytes` over completed downloads only — queued and failed rows have
 * nothing on disk to count.
 */
function DownloadSettingsContent() {
  const { notice, showToast } = useToast();
  const {
    data: storage,
    isInitialLoading: storageLoading,
    isError: storageError,
    refetch: refetchStorage,
  } = useDownloadsStorage();
  const { data: settings, isInitialLoading, isError, refetch } = useDownloadSettings();
  const update = useUpdateDownloadSettings();
  const { removeAllDownloads, isRemoving } = useRemoveAllDownloads();

  const [qualitySheetVisible, setQualitySheetVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const disk = useMemo(readDiskSpace, []);

  const save = useCallback(
    (patch: Partial<DownloadSettings>) => {
      update.mutate(patch, {
        onError: () => showToast('Could not save that. Try again.'),
      });
    },
    [showToast, update]
  );

  const handleRemoveAll = useCallback(async () => {
    try {
      await removeAllDownloads();
      setConfirmVisible(false);
      showToast('Downloads removed.');
      void refetchStorage();
    } catch {
      setConfirmVisible(false);
      showToast('Could not remove downloads. Try again.');
    }
  }, [refetchStorage, removeAllDownloads, showToast]);

  const usedBytes = storage?.total_bytes ?? 0;
  const downloadCount = storage?.count ?? 0;

  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={HalcyonColors.accent} />
        </View>
      );
    }

    if (isError || !settings) {
      return <ErrorState onRetry={() => void refetch()} />;
    }

    return (
      <>
        <StorageCard
          count={downloadCount}
          disk={disk}
          isError={storageError}
          isLoading={storageLoading}
          onRetry={() => void refetchStorage()}
          usedBytes={usedBytes}
        />

        <SettingsGroup
          footnote="Downloads are saved to this device so they play without a connection.">
          <SettingsRow
            description="Never use mobile data to save a soundscape."
            icon="wifi-outline"
            label="Download over Wi-Fi only"
            toggle={{
              value: settings.wifi_only,
              onValueChange: (value) => save({ wifi_only: value }),
            }}
          />
          <SettingsRow
            icon="pulse-outline"
            label="Download quality"
            onPress={() => setQualitySheetVisible(true)}
            value={
              QUALITY_OPTIONS.find((option) => option.value === settings.quality)?.label ??
              'Standard'
            }
          />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow
            busy={isRemoving}
            destructive
            // Only greyed out when we know there is nothing to remove — a failed
            // storage read must not lock the user out of clearing downloads.
            disabled={!storageLoading && !storageError && downloadCount === 0}
            icon="trash-outline"
            label="Remove all downloads"
            onPress={() => setConfirmVisible(true)}
            showChevron={false}
          />
        </SettingsGroup>

        <OptionSheet
          onClose={() => setQualitySheetVisible(false)}
          onSelect={(value) => save({ quality: value })}
          options={QUALITY_OPTIONS}
          title="Download quality"
          value={settings.quality}
          visible={qualitySheetVisible}
        />
      </>
    );
  };

  return (
    <SettingsScreen
      overlay={
        <>
          <ConfirmDialog
            confirmLabel="Remove all"
            destructive
            icon="trash-outline"
            loading={isRemoving}
            message={
              downloadCount > 0
                ? `This clears ${downloadCount} ${downloadCount === 1 ? 'download' : 'downloads'} and frees ${formatBytes(usedBytes)}. You can download them again at any time.`
                : 'This clears every download you have saved on this device. You can download them again at any time.'
            }
            onCancel={() => setConfirmVisible(false)}
            onConfirm={() => void handleRemoveAll()}
            title="Remove all downloads?"
            visible={confirmVisible}
          />
          <Toast bottom={72} notice={notice} />
        </>
      }
      backgroundImage={require('@/assets/images/notifications-top-dusk-mountains-bg.webp')}
      subtitle="What Passage saves to this device."
      title="Downloads">
      {renderBody()}
    </SettingsScreen>
  );
}

function StorageCard({
  usedBytes,
  count,
  disk,
  isLoading,
  isError,
  onRetry,
}: {
  usedBytes: number;
  count: number;
  disk: { total: number; available: number } | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <View style={[styles.storageCard, styles.storageLoading]}>
        <ActivityIndicator color={HalcyonColors.accent} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.storageCard}>
        <Text style={styles.storageTitle}>Storage</Text>
        <Text style={styles.storageMeta}>Couldn&apos;t read your storage use.</Text>
        <Text onPress={onRetry} style={styles.storageRetry}>
          Try again
        </Text>
      </View>
    );
  }

  // Without device totals there is nothing honest to draw a bar against, so the
  // number stands on its own rather than filling an invented maximum.
  const otherUsed = disk ? Math.max(0, disk.total - disk.available - usedBytes) : 0;
  const halcyonShare = disk ? Math.min(1, usedBytes / disk.total) : 0;
  const otherShare = disk ? Math.min(1 - halcyonShare, otherUsed / disk.total) : 0;

  return (
    <View style={styles.storageCard}>
      <Text style={styles.storageTitle}>{formatBytes(usedBytes)}</Text>
      <Text style={styles.storageMeta}>
        {count === 0
          ? 'Nothing downloaded yet'
          : `used by ${count} ${count === 1 ? 'soundscape' : 'soundscapes'}`}
      </Text>

      {!!disk && (
        <>
          <View style={styles.bar}>
            <View style={[styles.barHalcyon, { flex: Math.max(halcyonShare, 0.004) }]} />
            <View style={[styles.barOther, { flex: Math.max(otherShare, 0.004) }]} />
            <View style={{ flex: Math.max(1 - halcyonShare - otherShare, 0.004) }} />
          </View>

          <View style={styles.legend}>
            <LegendDot color={HalcyonColors.accent} label="Passage" />
            <LegendDot color="rgba(255,255,255,0.22)" label="Other apps" />
            <LegendDot
              color={HalcyonColors.surfaceRaised}
              label={`${formatBytes(disk.available)} free`}
            />
          </View>
        </>
      )}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 64,
  },
  storageCard: {
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    marginBottom: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  storageLoading: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  storageTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 34,
  },
  storageMeta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  storageRetry: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 10,
  },
  bar: {
    backgroundColor: HalcyonColors.surfaceRaised,
    borderRadius: 999,
    flexDirection: 'row',
    height: 8,
    marginTop: 16,
    overflow: 'hidden',
  },
  barHalcyon: {
    backgroundColor: HalcyonColors.accent,
  },
  barOther: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  legend: {
    columnGap: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    rowGap: 6,
  },
  legendItem: {
    alignItems: 'center',
    columnGap: 6,
    flexDirection: 'row',
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
  },
});

/**
 * The gate renders DownloadSettingsContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function DownloadSettingsScreen() {
  return (
    <RequireAuth message="Download settings and your storage are tied to your account.">
      <DownloadSettingsContent />
    </RequireAuth>
  );
}
