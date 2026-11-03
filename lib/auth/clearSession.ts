import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { QueryClient } from '@tanstack/react-query';

import { apiClient, clearStoredAccessToken } from '@/lib/api/client';
import { markLoggedOut } from '@/lib/auth/offline-session';
import { setIntroSeen } from '@/lib/auth/intro-flag';
import { beginExplicitSignOut } from '@/lib/auth/session-state';
import { resetOnboardingDraft } from '@/lib/onboarding';
import { clearAuthTokens } from '@/lib/passage-api';
import { clearPersistedQueryCache } from '@/lib/query-persist';
import { supabase } from '@/lib/supabase';
import { posthog, Sentry } from '@/lib/observability';
import { setAnalyticsConsent } from '@/lib/analytics';
import { cancelWindDownReminder } from '@/lib/notifications';
import { preferencesApi } from '@/lib/api/preferences';

/**
 * Signs the user out and leaves nothing of them behind on the device.
 *
 * A phone gets handed over, shared and re-sold, so "logged out" has to mean the
 * next person sees a clean app rather than the last person's name, greeting,
 * avatar, Home rails and library. Every store the app writes to is listed here
 * on purpose — the tokens in SecureStore, the durable `is_logged` flag and the
 * cached `/api/me` profile, and the query cache in memory *and* the copy of it
 * on disk.
 */
export async function clearUserSession(queryClient: QueryClient) {
  // Marked before anything else here flips the session flag off, so the tabs
  // layout's own "no session" redirect does not fire mid-cleanup — see
  // `beginExplicitSignOut`'s comment for why that race exists.
  beginExplicitSignOut();

  // Unregister the device push token and cancel the local wind-down reminder
  // before the session is cleared. The API call needs a valid token, so this
  // must happen while the session is still live. Best-effort: a failure here
  // must never prevent the rest of the sign-out from completing.
  try {
    if (typeof window === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Notifications = require('expo-notifications');
      const tokenResponse = await Notifications.getExpoPushTokenAsync().catch(() => null);
      const token = tokenResponse?.data;
      if (token) {
        await preferencesApi.unregisterDevice(token).catch(() => {});
      }
    }
  } catch {
    // Native module may be absent in tests or on web.
  }
  await cancelWindDownReminder().catch(() => {});

  try {
    await apiClient('/api/logout', { method: 'POST' });
  } catch {
    // Ignore if session is already invalid.
  }

  clearAuthTokens();
  // An explicit sign out is the only non-server reason to drop the flag, so the
  // next launch goes to the sign-in screen even with no connection. This also
  // drops the cached profile, so an offline launch has no name or avatar left
  // to draw.
  await markLoggedOut();
  await clearStoredAccessToken();
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore if Google native sign out is unavailable or already cleared.
  }
  await supabase.auth.signOut();
  posthog?.reset();
  Sentry.setUser(null);
  await setAnalyticsConsent(false);
  // Leftover onboarding progress would send the next launch back into
  // onboarding; a signed-out person belongs on Login instead.
  await resetOnboardingDraft();
  await setIntroSeen();

  // Order matters: clearing the client first means the persister's own
  // subscription can only ever see an empty cache, and the disk wipe that
  // follows removes the file it had already written.
  queryClient.clear();
  await clearPersistedQueryCache();
}
