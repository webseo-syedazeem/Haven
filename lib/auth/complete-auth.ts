import type { Session, User } from '@supabase/supabase-js';

import { ME_QUERY_KEY } from '@/hooks/useUser';
import { apiClient } from '@/lib/api/client';
import { userApi, type MeApiResponse } from '@/lib/api/user';
import { cacheProfile, markLoggedIn } from '@/lib/auth/offline-session';
import { setSessionSource } from '@/lib/auth/session-state';
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
  // The Supabase client already holds this session and is its sole refresher.
  // Handing its rotating refresh token to the Passage layer as well used to let
  // two refreshers race on the same token and force a sign-out (audit M-6).
  // `apiClient` reads the live Supabase token on each request instead (C-1).
  setSessionSource('supabase', true);
  await markLoggedIn();

  try {
    await apiClient('/api/auth/sync-profile', { method: 'POST' });
  } catch (error) {
    // Authentication is valid even if this best-effort projection is briefly
    // offline. The database auth trigger also creates/updates the profile.
    console.warn('[auth] profile sync remains pending', error);
  }

  // Account creation is complete even if the optional guest import is briefly
  // offline. Keep its local pending state intact; the verified screen offers a
  // retry while still allowing the user to continue into the app.
  try {
    await migrateGuestOnboardingAfterAuth();
  } catch (error) {
    console.warn('[onboarding] guest answers remain pending after auth', error);
  }
  await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  const me = await queryClient.fetchQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: userApi.get,
    staleTime: 0,
  });
  await cacheProfile(me);
  return me;
}
