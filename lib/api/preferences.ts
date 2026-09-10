import { apiClient } from './client';

type Envelope<T> = { success: boolean; data: T };

/**
 * `/api/preferences/*` and `/api/preferences/notifications`.
 *
 * Every GET returns the row wrapped in a named key (`preferences` for sound,
 * `settings` for the rest) and substitutes the server side defaults when the
 * user has no row yet, so the screens never have to deal with `null`.
 *
 * Every PUT is a partial update: the controller merges `{...defaults,
 * ...existing, ...body}` and returns the whole row back, so only changed fields
 * need to be sent.
 */

export type DetailPreference = 'minimal' | 'balanced' | 'rich';
export type Quality = 'standard' | 'high';
export type EndBehaviour = 'silent' | 'gentle_tone';

export type SoundPreferences = {
  user_id?: string | number;
  preferred_environments: string[];
  preferred_sounds: string[];
  preferred_animals: string[];
  preferred_instruments: string[];
  excluded_sounds: string[];
  detail_preference: DetailPreference | null;
  typical_duration: string | null;
  intensity_preference: number | null;
  updated_at?: string | null;
};

export type PlaybackSettings = {
  user_id?: string | number;
  background_playback: boolean;
  default_timer_minutes: number | null;
  fade_enabled: boolean;
  end_behaviour: EndBehaviour;
  quality: Quality;
  autoplay_next: boolean;
  updated_at?: string | null;
};

export type DownloadSettings = {
  user_id?: string | number;
  wifi_only: boolean;
  quality: Quality;
  updated_at?: string | null;
};

export type NotificationSettings = {
  user_id?: string | number;
  reminders_enabled: boolean;
  new_collection_alerts: boolean;
  updated_at?: string | null;
};

export type DevicePlatform = 'ios' | 'android' | 'web';

export const SOUND_PREFERENCE_DEFAULTS: SoundPreferences = {
  preferred_environments: [],
  preferred_sounds: [],
  preferred_animals: [],
  preferred_instruments: [],
  excluded_sounds: [],
  detail_preference: null,
  typical_duration: null,
  intensity_preference: null,
};

export const PLAYBACK_SETTING_DEFAULTS: PlaybackSettings = {
  background_playback: true,
  default_timer_minutes: null,
  fade_enabled: true,
  end_behaviour: 'silent',
  quality: 'standard',
  autoplay_next: false,
};

export const DOWNLOAD_SETTING_DEFAULTS: DownloadSettings = {
  wifi_only: true,
  quality: 'standard',
};

/** Both notification toggles are off until the user asks for them. */
export const NOTIFICATION_SETTING_DEFAULTS: NotificationSettings = {
  reminders_enabled: false,
  new_collection_alerts: false,
};

/** Arrays can come back `null` from Postgres, so normalise before rendering. */
function normaliseSound(row: Partial<SoundPreferences> | null | undefined): SoundPreferences {
  return {
    ...SOUND_PREFERENCE_DEFAULTS,
    ...(row ?? {}),
    preferred_environments: row?.preferred_environments ?? [],
    preferred_sounds: row?.preferred_sounds ?? [],
    preferred_animals: row?.preferred_animals ?? [],
    preferred_instruments: row?.preferred_instruments ?? [],
    excluded_sounds: row?.excluded_sounds ?? [],
  };
}

export const preferencesApi = {
  getSound: async (): Promise<SoundPreferences> => {
    const res = await apiClient<Envelope<{ preferences: SoundPreferences }>>(
      '/api/preferences/sound'
    );
    return normaliseSound(res.data?.preferences);
  },

  updateSound: async (patch: Partial<SoundPreferences>): Promise<SoundPreferences> => {
    const res = await apiClient<Envelope<{ preferences: SoundPreferences }>>(
      '/api/preferences/sound',
      { method: 'PUT', body: JSON.stringify(patch) }
    );
    return normaliseSound(res.data?.preferences);
  },

  getPlayback: async (): Promise<PlaybackSettings> => {
    const res = await apiClient<Envelope<{ settings: PlaybackSettings }>>(
      '/api/preferences/playback'
    );
    return { ...PLAYBACK_SETTING_DEFAULTS, ...(res.data?.settings ?? {}) };
  },

  updatePlayback: async (patch: Partial<PlaybackSettings>): Promise<PlaybackSettings> => {
    const res = await apiClient<Envelope<{ settings: PlaybackSettings }>>(
      '/api/preferences/playback',
      { method: 'PUT', body: JSON.stringify(patch) }
    );
    return { ...PLAYBACK_SETTING_DEFAULTS, ...(res.data?.settings ?? {}) };
  },

  getDownloads: async (): Promise<DownloadSettings> => {
    const res = await apiClient<Envelope<{ settings: DownloadSettings }>>(
      '/api/preferences/downloads'
    );
    return { ...DOWNLOAD_SETTING_DEFAULTS, ...(res.data?.settings ?? {}) };
  },

  updateDownloads: async (patch: Partial<DownloadSettings>): Promise<DownloadSettings> => {
    const res = await apiClient<Envelope<{ settings: DownloadSettings }>>(
      '/api/preferences/downloads',
      { method: 'PUT', body: JSON.stringify(patch) }
    );
    return { ...DOWNLOAD_SETTING_DEFAULTS, ...(res.data?.settings ?? {}) };
  },

  /**
   * Notification settings live under `/api/preferences/notifications`, served by
   * the Notifications controller. There is no `/api/notifications` collection
   * endpoint — an earlier build called one and always failed.
   */
  getNotifications: async (): Promise<NotificationSettings> => {
    const res = await apiClient<Envelope<{ settings: NotificationSettings }>>(
      '/api/preferences/notifications'
    );
    return { ...NOTIFICATION_SETTING_DEFAULTS, ...(res.data?.settings ?? {}) };
  },

  updateNotifications: async (
    patch: Partial<NotificationSettings>
  ): Promise<NotificationSettings> => {
    const res = await apiClient<Envelope<{ settings: NotificationSettings }>>(
      '/api/preferences/notifications',
      { method: 'PUT', body: JSON.stringify(patch) }
    );
    return { ...NOTIFICATION_SETTING_DEFAULTS, ...(res.data?.settings ?? {}) };
  },

  registerDevice: (token: string, platform: DevicePlatform) =>
    apiClient<Envelope<{ device: unknown }>>('/api/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),

  unregisterDevice: (token: string) =>
    apiClient<Envelope<{ message: string }>>(
      `/api/notifications/device/${encodeURIComponent(token)}`,
      { method: 'DELETE' }
    ),
};
