import { apiClient } from './client';

type Envelope<T> = { success: boolean; data: T };

export type AccountExport = {
  exported_at: string;
  account: Record<string, unknown> | null;
  favourites: unknown[];
  playlists: unknown[];
  play_history: { entries: unknown[] };
  onboarding: Record<string, unknown> | null;
  player_state: Record<string, unknown> | null;
  device_tokens: unknown[];
  sound_preferences: Record<string, unknown> | null;
  playback_settings: Record<string, unknown> | null;
  notification_settings: Record<string, unknown> | null;
  support_requests: unknown[];
};

export const accountApi = {
  export: async (): Promise<AccountExport> => {
    const res = await apiClient<Envelope<AccountExport>>('/api/account/export');
    return res.data;
  },
};
