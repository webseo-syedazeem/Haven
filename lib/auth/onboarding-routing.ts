import type { Href, Router } from 'expo-router';

import { ME_QUERY_KEY } from '@/hooks/useUser';
import { userApi, type MeApiResponse } from '@/lib/api/user';
import { cacheProfile } from '@/lib/auth/offline-session';
import { resetToMainApp } from '@/lib/navigation';
import { migrateGuestOnboardingAfterAuth } from '@/lib/onboarding';
import { queryClient } from '@/lib/query-client';

export const AUTHENTICATED_ONBOARDING_START_ROUTE = '/passage-help' as const;

export function profileNeedsOnboarding(me: MeApiResponse | null | undefined): boolean {
  return me?.data?.profile?.onboarding_completed === false;
}

export function resetToAuthenticatedOnboarding(router: Router): void {
  router.dismissAll();
  router.replace(AUTHENTICATED_ONBOARDING_START_ROUTE as Href);
}

export function routeForOnboardingStatus(
  router: Router,
  me: MeApiResponse | null | undefined
): void {
  if (profileNeedsOnboarding(me)) {
    resetToAuthenticatedOnboarding(router);
    return;
  }

  resetToMainApp(router);
}

export async function fetchAndCacheCurrentUser(): Promise<MeApiResponse> {
  const me = await userApi.get();
  queryClient.setQueryData(ME_QUERY_KEY, me);
  await cacheProfile(me);
  return me;
}

export async function routeAfterSignIn(router: Router): Promise<void> {
  await migrateGuestOnboardingAfterAuth();
  const me = await fetchAndCacheCurrentUser();
  routeForOnboardingStatus(router, me);
}