import { apiClient } from '@/lib/api/client';
import {
  ANALYTICS_ENABLED_DEFAULT,
  getLocalSetting,
  LOCAL_SETTING_KEYS,
  setLocalSetting,
} from '@/lib/local-settings';

/**
 * The gate in front of `POST /api/analytics/events`.
 *
 * The backend has no analytics preference column — the only analytics route is
 * the ingest endpoint, and neither `users` nor any of the preference tables
 * carries an opt-out — so consent is held on the device (see
 * `lib/local-settings.ts`) and enforced here. Nothing is sent unless the user
 * has turned "Share anonymous usage analytics" on in Privacy & Data, and
 * turning it off stops every send immediately.
 *
 * Route every analytics call through `trackEvent`. Calling the endpoint
 * directly would bypass the user's choice.
 */

let consentCache: boolean | null = null;

export async function isAnalyticsEnabled(): Promise<boolean> {
  if (consentCache !== null) return consentCache;

  consentCache = await getLocalSetting(
    LOCAL_SETTING_KEYS.analyticsEnabled,
    ANALYTICS_ENABLED_DEFAULT
  );
  return consentCache;
}

export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  consentCache = enabled;
  await setLocalSetting(LOCAL_SETTING_KEYS.analyticsEnabled, enabled);
}

/**
 * Sends one event, or silently drops it when the user has not opted in.
 * Failures never surface: analytics must not interrupt what the user is doing.
 */
export async function trackEvent(
  eventName: string,
  eventData: Record<string, unknown> = {},
  sessionId?: string
): Promise<void> {
  if (!(await isAnalyticsEnabled())) return;

  try {
    await apiClient('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        event_name: eventName,
        event_data: eventData,
        ...(sessionId ? { session_id: sessionId } : {}),
      }),
    });
  } catch {
    // Dropped on purpose.
  }
}
