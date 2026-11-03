import type { Href, Router } from 'expo-router';

import { ME_QUERY_KEY } from '@/hooks/useUser';
import { userApi, type MeApiResponse } from '@/lib/api/user';
import { cacheProfile } from '@/lib/auth/offline-session';
import { resetToMainApp } from '@/lib/navigation';
import {
  getOnboardingAnswers,
  getOnboardingResumeRoute,
  submitOnboardingDraftAfterAuth,
} from '@/lib/onboarding';
import { queryClient } from '@/lib/query-client';

/** Used only when local progress cannot be read or does not exist yet. */
export const AUTHENTICATED_ONBOARDING_START_ROUTE = '/why-passage' as const;

export function profileNeedsOnboarding(me: MeApiResponse | null | undefined): boolean {
  return me?.data?.profile?.onboarding_completed === false;
}

export async function resetToAuthenticatedOnboarding(router: Router): Promise<void> {
  let route: Href = AUTHENTICATED_ONBOARDING_START_ROUTE;

  try {
    route = getOnboardingResumeRoute(await getOnboardingAnswers()) as Href;
  } catch (error) {
    console.warn('[onboarding] could not read local resume progress', error);
  }

  const destination: Href =
    route === AUTHENTICATED_ONBOARDING_START_ROUTE
      ? {
          pathname: AUTHENTICATED_ONBOARDING_START_ROUTE,
          params: { from: 'authenticated-resume' },
        }
      : route;

  router.dismissAll();
  router.replace(destination);
}

export async function routeForOnboardingStatus(
  router: Router,
  me: MeApiResponse | null | undefined
): Promise<void> {
  if (profileNeedsOnboarding(me)) {
    await resetToAuthenticatedOnboarding(router);
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
  // The public onboarding preview marks a complete draft before authentication.
  // Submit that draft through the authenticated endpoint once sign-in succeeds.
  await submitOnboardingDraftAfterAuth().catch((error) => {
    console.warn('[onboarding] import remains pending after sign in', error);
  });
  const me = await fetchAndCacheCurrentUser();
  await routeForOnboardingStatus(router, me);
}
