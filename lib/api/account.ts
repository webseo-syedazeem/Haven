import { apiClient } from './client';
import type { SoundscapeMode } from './home';

type Envelope<T> = { success: boolean; data: T };

/**
 * `GET /api/account/export` returns everything Passage stores for the caller as
 * one JSON document — the account row, favourites, playlists with their items,
 * play history, all three preference rows, support requests, onboarding,
 * player state and device tokens.
 *
 * The shape is wide and the screen only shows a summary, so it is typed loosely
 * on purpose: the file the user saves is the API's response, untouched.
 */
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

/** One locally-created playlist accepted by POST /api/account/import-guest-data. */
export type ImportGuestPlaylist = {
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  soundscape_ids?: string[];
};

type ImportGuestExtras = {
  favourites?: string[];
  playlists?: ImportGuestPlaylist[];
};

/** Final mode-scoped onboarding body accepted by the guest import controller. */
export type ImportGuestDataPayload = ImportGuestExtras &
  (
    | {
        mode: Exclude<SoundscapeMode, 'relax'>;
        mode_breakers: string[];
        mode_areas: string[];
        // Optional: omitted when DURATION_STEP_ENABLED is false in constants/onboarding.ts.
        target_minutes?: number;
        main_goal?: never;
        relax_causes?: never;
        calming_moments?: never;
      }
    | {
        mode: 'relax';
        main_goal: string;
        relax_causes: string[];
        calming_moments: string;
        mode_breakers?: never;
        mode_areas?: never;
        target_minutes?: never;
      }
  );

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
