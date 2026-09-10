import { Redirect } from 'expo-router';

/**
 * Kept as a compatibility route for old links and navigation history. The
 * unsupported social-proof page is no longer part of onboarding.
 */
export default function TrustedRedirect() {
  return <Redirect href='/backed-by-science' />;
}
