import type { Href, Router } from 'expo-router';

/**
 * Leaves onboarding with a fresh root stack. Replacing only the current route
 * would leave personalisation screens behind the tabs on Android back.
 */
export function resetToMainApp(router: Router): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/(tabs)' as Href);
}

/** Leaves no authenticated or guest app screen behind the signed-out login. */
export function resetToLogin(router: Router): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/login?signedOut=1' as Href);
}

/** Establishes tabs underneath the existing full-screen player modal. */
export function resetToMainPlayer(router: Router): void {
  resetToMainApp(router);
  setTimeout(() => router.push('/player' as Href), 0);
}

/**
 * Back-button handler for onboarding/auth screens, where a prior
 * `dismissAll()` (see `resetToAuthenticatedOnboarding`) can leave a screen
 * with nothing behind it in the stack. A blind `router.back()` there throws
 * the "GO_BACK was not handled by any navigator" warning/crash. `/` re-derives
 * the right destination itself (main app, onboarding resume, or the arrival
 * screen), so it is a safe default fallback when no more specific one applies.
 */
export function safeGoBack(router: Router, fallback: Href = '/' as Href): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
