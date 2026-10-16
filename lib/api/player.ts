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

export type PlayHistoryRow = {
  id: string;
  soundscape_id: string;
  played_at?: string;
  soundscape?: import('./home').Soundscape | null;
};

/** One cache entry shared by Home and Saved → Recently Played. */
export const PLAY_HISTORY_QUERY_KEY = ['home', 'play-history'] as const;

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
  addPlayHistory: async (
    soundscapeId: string,
    positionSeconds = 0
  ): Promise<PlayHistoryRow> => {
    const res = await apiClient<Envelope<{ play_history: PlayHistoryRow }>>(
      '/api/play-history',
      {
        method: 'POST',
        body: JSON.stringify({
          soundscape_id: soundscapeId,
          position_seconds: Math.max(0, Math.round(positionSeconds)),
        }),
      }
    );
    return res.data.play_history;
  },

  /** Raw rows, newest first — the Saved tab needs `played_at`, not just the track. */
  getPlayHistory: async (): Promise<PlayHistoryRow[]> => {
    const res = await apiClient<Envelope<{ play_history: PlayHistoryRow[] }>>('/api/play-history');
    return res.data?.play_history ?? [];
  },
};
