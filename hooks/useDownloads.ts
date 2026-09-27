import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { PREFERENCES_QUERY_KEYS } from '@/hooks/usePreferences';
import { useHasSession } from '@/hooks/useSession';
import type { Soundscape } from '@/lib/api/home';
import { playerApi } from '@/lib/api/player';
import {
  DOWNLOAD_SETTING_DEFAULTS,
  preferencesApi,
  type DownloadSettings,
} from '@/lib/api/preferences';
import {
  clearLocalDownloads,
  DownloadRequiresAccountError,
  getActiveDownloadUserId,
  getDownloadConnectivity,
  getLocalDownload,
  getLocalDownloadsSnapshot,
  hydrateLocalDownloads,
  removeLocalDownload,
  saveSoundscapeOffline,
  subscribeToLocalDownloads,
  summariseLocalDownloads,
  type LocalDownload,
} from '@/lib/local-downloads';

/**
 * Downloads are local first. Every hook here reads the on-device manifest in
 * `lib/local-downloads.ts`, so the Downloads tab, the storage figures and the
 * "Saved" state on a soundscape are all correct with the network off.
 *
 * The `/api/downloads` row is still written on every download and removal, so
 * the account keeps a server side history — but it is fire and forget. A failed
 * sync never fails a download, and a successful one is never waited on. It is
 * also never *read* to decide what is available: those rows describe the
 * account across every device it has ever used, and on a fresh install they
 * would promise files this device does not have. Only the manifest, the owner
 * match and the bytes on disk answer that.
 *
 * Everything below reads `visibleEntries` — the rows owned by whoever is signed
 * in on this device — so one account's downloads are never listed, counted or
 * played by another.
 */

/** Server rows are a nicety; they must not decide whether a download worked. */
async function sync<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

export type { LocalDownload } from '@/lib/local-downloads';

// ── Reading the manifest ─────────────────────────────────────────────────────

function useLocalDownloadsSnapshot() {
  useEffect(() => {
    // Cheap after the root layout's first call — it resolves immediately once
    // the manifest is in memory.
    void hydrateLocalDownloads();
  }, []);

  return useSyncExternalStore(
    subscribeToLocalDownloads,
    getLocalDownloadsSnapshot,
    getLocalDownloadsSnapshot
  );
}

/**
 * The Downloads list. Shaped like the query it replaced so the screen's loading
 * and error branches still read the same, but it never touches the network:
 * `isError` is permanently false because reading a local file cannot leave the
 * user with an empty list.
 */
export function useDownloads() {
  const { visibleEntries, hydrated } = useLocalDownloadsSnapshot();

  return {
    data: visibleEntries,
    isInitialLoading: !hydrated,
    isError: false as const,
    refetch: hydrateLocalDownloads,
  };
}

/**
 * The active user's row for a soundscape, or `undefined` — what the download
 * button and the "downloaded" tick read. Another account's copy of the same
 * soundscape is not in `visibleEntries`, so it can never light the tick.
 */
export function useDownloadStatus(soundscapeId?: string): LocalDownload | undefined {
  const { visibleEntries } = useLocalDownloadsSnapshot();

  return useMemo(
    () =>
      soundscapeId
        ? visibleEntries.find((entry) => entry.soundscape_id === soundscapeId)
        : undefined,
    [visibleEntries, soundscapeId]
  );
}

/**
 * Storage usage, summed from the manifest rather than `GET /api/downloads/
 * storage` — the bar is describing this device, and it has to draw offline.
 */
export function useDownloadsStorage() {
  const { visibleEntries, hydrated } = useLocalDownloadsSnapshot();

  // Only what this user is using: another account's files are on the same disk
  // but are not this user's to see, account for, or clear.
  const data = useMemo(() => summariseLocalDownloads(visibleEntries), [visibleEntries]);

  return {
    data,
    isInitialLoading: !hydrated,
    isError: false as const,
    refetch: hydrateLocalDownloads,
  };
}

// ── Downloading ──────────────────────────────────────────────────────────────

/**
 * Reads the download settings without adding a query subscription to every
 * screen that offers a download button: the cache first, then one best effort
 * fetch, then the defaults if there is no connection.
 */
async function resolveDownloadSettings(queryClient: QueryClient): Promise<DownloadSettings> {
  const cached = queryClient.getQueryData<DownloadSettings>(PREFERENCES_QUERY_KEYS.downloads);
  if (cached) return cached;

  const fetched = await sync(() =>
    queryClient.fetchQuery({
      queryKey: PREFERENCES_QUERY_KEYS.downloads,
      queryFn: preferencesApi.getDownloads,
    })
  );

  return fetched ?? DOWNLOAD_SETTING_DEFAULTS;
}

export class WifiOnlyError extends Error {
  constructor() {
    super('Cellular connection detected. Turn off Wi-Fi only in Download settings, or connect to Wi-Fi.');
  }
}

export class OfflineDownloadError extends Error {
  constructor() {
    super('This device is offline. Connect to Wi-Fi or cellular data to download.');
  }
}

export class UnverifiedWifiError extends Error {
  constructor() {
    super(
      'Passage cannot confirm that this connection is Wi-Fi. Connect to Wi-Fi or turn off Wi-Fi only in Download settings.'
    );
  }
}

export function getDownloadBlockNotice(
  error: unknown
): { title: string; message: string } | null {
  if (error instanceof OfflineDownloadError) {
    return { title: 'Device is offline', message: error.message };
  }
  if (error instanceof WifiOnlyError || error instanceof UnverifiedWifiError) {
    return { title: 'Wi-Fi required', message: error.message };
  }
  if (error instanceof DownloadRequiresAccountError) {
    return { title: 'Sign in to download', message: error.message };
  }
  return null;
}

async function resolveAllowedDownloadSettings(queryClient: QueryClient): Promise<DownloadSettings> {
  const [settings, connectivity] = await Promise.all([
    resolveDownloadSettings(queryClient),
    getDownloadConnectivity(),
  ]);

  if (connectivity.isOffline) throw new OfflineDownloadError();
  if (settings.wifi_only && connectivity.type === 'cellular') throw new WifiOnlyError();
  // VPN and unknown transports may still sit over cellular, so Wi-Fi-only
  // stays conservative unless the native API proves this is Wi-Fi/Ethernet.
  if (settings.wifi_only && connectivity.type !== 'wifi') throw new UnverifiedWifiError();

  return settings;
}

/**
 * Saves the audio to this device, then tells the server about it.
 *
 * The order matters: the file is what makes the soundscape playable offline, so
 * it is downloaded and verified first and the server calls are wrapped so they
 * can never turn a saved file into a reported failure. This only resolves once
 * the bytes are on disk, which is what lets the caller show "saved for offline
 * listening" honestly.
 */
export function useDownloadSoundscape() {
  const queryClient = useQueryClient();
  const hasSession = useHasSession();

  const mutation = useMutation({
    mutationFn: async (soundscape: Soundscape) => {
      if (!hasSession) throw new DownloadRequiresAccountError();
      const settings = await resolveAllowedDownloadSettings(queryClient);

      // Best effort, but awaited: when there is a connection the row wants to
      // exist before the status updates reference it.
      await sync(() => playerApi.createDownload(soundscape.id));
      await sync(() =>
        playerApi.updateDownloadStatus(soundscape.id, {
          status: 'downloading',
          progress_percent: 0,
        })
      );

      try {
        const entry = await saveSoundscapeOffline(soundscape, { quality: settings.quality });

        await sync(() =>
          playerApi.updateDownloadStatus(soundscape.id, {
            status: 'completed',
            progress_percent: 100,
            ...(entry.file_size_bytes > 0
              ? { downloaded_bytes: entry.file_size_bytes }
              : {}),
          })
        );

        return entry;
      } catch (error) {
        void sync(() =>
          playerApi.updateDownloadStatus(soundscape.id, { status: 'failed' })
        );
        throw error;
      }
    },
  });

  const { mutateAsync } = mutation;
  const download = useCallback(
    (soundscape: Soundscape) => mutateAsync(soundscape),
    [mutateAsync]
  );

  return { download, isDownloading: mutation.isLoading, isError: mutation.isError };
}

// ── Removing ─────────────────────────────────────────────────────────────────

export function useRemoveDownload() {
  const hasSession = useHasSession();
  const mutation = useMutation({
    mutationFn: async (soundscapeId: string) => {
      if (!hasSession) throw new DownloadRequiresAccountError();
      // Local first: the file and the entry go whether or not the server can be
      // reached, because the user asked for the space back now.
      await removeLocalDownload(soundscapeId);
      await sync(() => playerApi.deleteDownload(soundscapeId));
    },
  });

  const { mutateAsync } = mutation;
  const removeDownload = useCallback(
    (soundscapeId: string) => mutateAsync(soundscapeId),
    [mutateAsync]
  );

  return { removeDownload, isRemoving: mutation.isLoading };
}

export function useRemoveAllDownloads() {
  const hasSession = useHasSession();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!hasSession) throw new DownloadRequiresAccountError();
      await clearLocalDownloads();
      await sync(() => playerApi.deleteAllDownloads());
    },
  });

  const { mutateAsync } = mutation;
  const removeAllDownloads = useCallback(() => mutateAsync(), [mutateAsync]);

  return { removeAllDownloads, isRemoving: mutation.isLoading };
}

// ── Collections ──────────────────────────────────────────────────────────────

export type BulkDownloadPlan = {
  soundscapes: Soundscape[];
  total: number;
  skipped: number;
  unavailable: number;
  totalBytes: number | null;
};

export type BulkDownloadProgress = {
  completed: number;
  total: number;
  failed: number;
  processed: number;
  current: number;
  cancelRequested: boolean;
};

export type BulkDownloadOutcome = {
  completed: number;
  total: number;
  failed: number;
  skipped: number;
  cancelled: number;
};

/**
 * There is no bulk download endpoint, so a collection is downloaded by looping
 * the single-item flow above one track at a time. Sequential on purpose: the
 * device writes each file to disk, and a burst of parallel writes is what makes
 * a slow connection fail all of them at once.
 */
export function useDownloadCollection() {
  const queryClient = useQueryClient();
  const { download } = useDownloadSoundscape();
  const [progress, setProgress] = useState<BulkDownloadProgress | null>(null);
  const cancelRequested = useRef(false);

  useEffect(
    () => () => {
      cancelRequested.current = true;
    },
    []
  );

  const prepareDownload = useCallback(
    async (soundscapes: Soundscape[]): Promise<BulkDownloadPlan> => {
      await hydrateLocalDownloads();
      const unique = [...new Map(soundscapes.map((item) => [item.id, item])).values()];
      const playable = unique.filter((item) => !!item.file_url?.trim());
      const pending = playable.filter((item) => {
        // Owner scoped: another account's copy on this device is not this
        // user's, so it counts as still to download rather than as skipped.
        const local = getLocalDownload(item.id);
        return local?.status !== 'completed' || !local.file_uri;
      });

      if (pending.length > 0) {
        if (!getActiveDownloadUserId()) throw new DownloadRequiresAccountError();
        await resolveAllowedDownloadSettings(queryClient);
      }

      const sizes = pending.map((item) => item.file_size_bytes);
      const hasEverySize = sizes.every(
        (size): size is number => typeof size === 'number' && Number.isFinite(size) && size > 0
      );

      return {
        soundscapes: pending,
        total: pending.length,
        skipped: playable.length - pending.length,
        unavailable: unique.length - playable.length,
        totalBytes: hasEverySize ? sizes.reduce((total, size) => total + size, 0) : null,
      };
    },
    [queryClient]
  );

  const downloadAll = useCallback(
    async (plan: BulkDownloadPlan): Promise<BulkDownloadOutcome> => {
      if (!plan.total) {
        return { completed: 0, total: 0, failed: 0, skipped: plan.skipped, cancelled: 0 };
      }

      cancelRequested.current = false;
      let completed = 0;
      let failed = 0;
      let skipped = plan.skipped;
      let processed = 0;
      setProgress({
        completed: 0,
        total: plan.total,
        failed: 0,
        processed: 0,
        current: 1,
        cancelRequested: false,
      });

      for (let index = 0; index < plan.soundscapes.length; index += 1) {
        if (cancelRequested.current) break;
        const soundscape = plan.soundscapes[index];
        const local = getLocalDownload(soundscape.id);
        if (local?.status === 'completed' && local.file_uri) {
          skipped += 1;
          processed += 1;
          setProgress({
            completed,
            total: plan.total,
            failed,
            processed,
            current: Math.min(index + 2, plan.total),
            cancelRequested: cancelRequested.current,
          });
          continue;
        }

        try {
          await download(soundscape);
          completed += 1;
        } catch {
          failed += 1;
        }
        processed += 1;
        setProgress({
          completed,
          total: plan.total,
          failed,
          processed,
          current: Math.min(index + 2, plan.total),
          cancelRequested: cancelRequested.current,
        });
      }

      const cancelled = plan.total - processed;
      setProgress(null);
      return { completed, total: plan.total, failed, skipped, cancelled };
    },
    [download]
  );

  const cancel = useCallback(() => {
    cancelRequested.current = true;
    setProgress((current) => (current ? { ...current, cancelRequested: true } : current));
  }, []);

  return {
    prepareDownload,
    downloadAll,
    cancel,
    progress,
    isDownloading: progress !== null,
  };
}
