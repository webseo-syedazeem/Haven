import { apiClient } from './client';

type Envelope<T> = { success: boolean; data: T };

export type PlayerState = {
  user_id?: string | number;
  soundscape_id: string;
  position_seconds: number;
  duration_seconds?: number | null;
  queue?: string[] | null;
  timer_minutes?: number | null;
  updated_at?: string;
};

export type PlayerStatePayload = {
  soundscape_id: string;
  /** Server requires a non-negative integer. */
  position_seconds: number;
  duration_seconds?: number | null;
  queue?: string[];
  timer_minutes?: number | null;
};

export type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed';

export type Download = {
  id: string;
  soundscape_id: string;
  quality: 'standard' | 'high';
  status: DownloadStatus;
  progress_percent?: number | null;
  downloaded_bytes?: number | null;
  file_size_bytes?: number | null;
  created_at?: string;
  updated_at?: string;
  /**
   * `GET /api/downloads` joins a partial soundscape — title, artwork, mode and
   * duration only. There is no `id` and no `file_url` on it, so playing a
   * download means resolving the full row by `soundscape_id` first.
   */
  soundscape?: {
    title?: string | null;
    artwork_url?: string | null;
    mode?: string | null;
    duration_seconds?: number | null;
  } | null;
};

export type DownloadsStorage = {
  total_bytes: number;
  count: number;
};

export type PlayHistoryRow = {
  id: string;
  soundscape_id: string;
  played_at?: string;
  soundscape?: import('./home').Soundscape | null;
};

export const playerApi = {
  getState: async (): Promise<PlayerState | null> => {
    const res = await apiClient<Envelope<{ player_state: PlayerState | null }>>(
      '/api/player/state'
    );
    return res.data?.player_state ?? null;
  },

  saveState: (payload: PlayerStatePayload) =>
    apiClient<Envelope<{ player_state: PlayerState }>>('/api/player/state', {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        position_seconds: Math.max(0, Math.round(payload.position_seconds)),
        duration_seconds:
          payload.duration_seconds === null || payload.duration_seconds === undefined
            ? payload.duration_seconds
            : Math.max(0, Math.round(payload.duration_seconds)),
      }),
    }),

  /** One row per play, recorded when playback actually starts. */
  addPlayHistory: (soundscapeId: string, positionSeconds = 0) =>
    apiClient<Envelope<{ play_history: unknown }>>('/api/play-history', {
      method: 'POST',
      body: JSON.stringify({
        soundscape_id: soundscapeId,
        position_seconds: Math.max(0, Math.round(positionSeconds)),
      }),
    }),

  getDownloads: async (): Promise<Download[]> => {
    const res = await apiClient<Envelope<{ downloads: Download[] }>>('/api/downloads');
    return res.data?.downloads ?? [];
  },

  createDownload: async (soundscapeId: string): Promise<Download | null> => {
    const res = await apiClient<Envelope<{ download: Download }>>('/api/downloads', {
      method: 'POST',
      body: JSON.stringify({ soundscape_id: soundscapeId, quality: 'standard' }),
    });
    return res.data?.download ?? null;
  },

  updateDownloadStatus: (
    soundscapeId: string,
    payload: { status: DownloadStatus; progress_percent?: number; downloaded_bytes?: number }
  ) =>
    apiClient<Envelope<{ download: Download }>>(
      `/api/downloads/${encodeURIComponent(soundscapeId)}/status`,
      { method: 'PUT', body: JSON.stringify(payload) }
    ),

  getDownloadsStorage: async (): Promise<DownloadsStorage> => {
    const res = await apiClient<Envelope<DownloadsStorage>>('/api/downloads/storage');
    return {
      total_bytes: res.data?.total_bytes ?? 0,
      count: res.data?.count ?? 0,
    };
  },

  deleteDownload: (soundscapeId: string) =>
    apiClient<Envelope<{ download: Download }>>(
      `/api/downloads/${encodeURIComponent(soundscapeId)}`,
      { method: 'DELETE' }
    ),

  deleteAllDownloads: () =>
    apiClient<Envelope<{ deleted_count: number }>>('/api/downloads', { method: 'DELETE' }),

  /** Raw rows, newest first — the Saved tab needs `played_at`, not just the track. */
  getPlayHistory: async (): Promise<PlayHistoryRow[]> => {
    const res = await apiClient<Envelope<{ play_history: PlayHistoryRow[] }>>('/api/play-history');
    return res.data?.play_history ?? [];
  },
};
