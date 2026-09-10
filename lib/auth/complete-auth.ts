import type { Session, User } from '@supabase/supabase-js';

import { ME_QUERY_KEY } from '@/hooks/useUser';
import { apiClient } from '@/lib/api/client';
import { userApi, type MeApiResponse } from '@/lib/api/user';
import { cacheProfile, markLoggedIn } from '@/lib/auth/offline-session';
import { setSessionSource } from '@/lib/auth/session-state';
import { setAuthTokens } from '@/lib/haven-api';
import { migrateGuestOnboardingAfterAuth } from '@/lib/onboarding';
import { queryClient } from '@/lib/query-client';

export function isEmailConfirmed(user: User | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at ?? user?.confirmed_at);
}

export function hasEmailIdentity(user: User | null | undefined): boolean {
  return Boolean(
    user?.app_metadata?.provider === 'email' ||
      user?.identities?.some((identity) => identity.provider === 'email')
  );
}

/** Finalises a real Supabase session obtained from a confirmation/OAuth link. */
export async function completeSupabaseAuth(session: Session): Promise<MeApiResponse> {
  setAuthTokens({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  });
  setSessionSource('supabase', true);
  await markLoggedIn();

  try {
    await apiClient('/api/auth/sync-profile', { method: 'POST' });
  } catch (error) {
    // Authentication is valid even if this best-effort projection is briefly
    // offline. The database auth trigger also creates/updates the profile.
    console.warn('[auth] profile sync remains pending', error);
  }

  // Do not silently enter the app if a completed guest profile could not be
  // imported. The caller keeps its retry UI active and the local flags remain
  // pending until this authenticated request succeeds.
  await migrateGuestOnboardingAfterAuth();
  await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  const me = await queryClient.fetchQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: userApi.get,
    staleTime: 0,
  });
  // Caching the profile is also what points the downloads manifest at this
  // account, so anything they saved on this device before is theirs again.
  await cacheProfile(me);
  return me;
}
