import type { Href, Router } from 'expo-router';

/**
 * Leaves onboarding with a fresh root stack. Replacing only the current route
 * would leave personalisation screens behind the tabs on Android back.
 */
export function resetToMainApp(router: Router): void {
  router.dismissAll();
  router.replace('/(tabs)' as Href);
}

/** Establishes tabs underneath the existing full-screen player modal. */
export function resetToMainPlayer(router: Router): void {
  resetToMainApp(router);
  setTimeout(() => router.push('/player' as Href), 0);
}
