import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';

/** Legacy template route kept so old links enter the current onboarding chain. */
export default function RetiredUniqueRoute() {
  return <Redirect href={'/onboarding/situation' as Href} />;
}
