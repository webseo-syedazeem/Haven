import { apiClient } from './client';
import type { SoundscapeMode } from './home';
import type { DetailPreference } from './preferences';

type Envelope<T> = { success: boolean; data: T };

/**
 * `GET /api/account/export` returns everything Halcyon stores for the caller as
 * one JSON document — the account row, favourites, playlists with their items,
 * downloads, play history, all four preference rows, support requests,
 * onboarding, player state and device tokens.
 *
 * The shape is wide and the screen only shows a summary, so it is typed loosely
 * on purpose: the file the user saves is the API's response, untouched.
 */
export type AccountExport = {
  exported_at: string;
  account: Record<string, unknown> | null;
  favourites: unknown[];
  playlists: unknown[];
  downloads: unknown[];
  play_history: { entries: unknown[] };
  onboarding: Record<string, unknown> | null;
  player_state: Record<string, unknown> | null;
  device_tokens: unknown[];
  sound_preferences: Record<string, unknown> | null;
  playback_settings: Record<string, unknown> | null;
  download_settings: Record<string, unknown> | null;
  notification_settings: Record<string, unknown> | null;
  support_requests: unknown[];
};

/** One locally-created playlist accepted by POST /api/account/import-guest-data. */
export type ImportGuestPlaylist = {
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  soundscape_ids?: string[];
};

/**
 * The exact subset of sound-preference fields validated by the import
 * controller. detail_preference deliberately cannot be null: the backend
 * accepts an omitted value, but rejects an explicitly-null one.
 */
export type ImportGuestSoundPreferences = {
  preferred_environments?: string[];
  preferred_sounds?: string[];
  preferred_animals?: string[];
  preferred_instruments?: string[];
  excluded_sounds?: string[];
  detail_preference?: DetailPreference;
  typical_duration?: string | null;
  intensity_preference?: 1 | 2 | 3 | 4 | 5;
};

/** Authenticated guest-to-account import payload. All fields are optional. */
export type ImportGuestDataPayload = {
  favourites?: string[];
  playlists?: ImportGuestPlaylist[];
  sound_preferences?: ImportGuestSoundPreferences;
  /** When supplied, the backend requires between one and five strings. */
  goals?: string[];
  starting_mode?: SoundscapeMode;
  situation?: string | null;
};

/** Summary returned after the backend's best-effort batch import. */
export type ImportGuestDataResult = {
  favourites_added: number;
  favourites_skipped: number;
  playlists_created: number;
  playlist_items_skipped: number;
  preferences_applied: boolean;
  preferences_note?: string;
  onboarding_applied: boolean;
  onboarding_note?: string;
};

export const accountApi = {
  export: async (): Promise<AccountExport> => {
    const res = await apiClient<Envelope<AccountExport>>('/api/account/export');
    return res.data;
  },

  importGuestData: async (payload: ImportGuestDataPayload): Promise<ImportGuestDataResult> => {
    const res = await apiClient<Envelope<ImportGuestDataResult>>(
      '/api/account/import-guest-data',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },
};
