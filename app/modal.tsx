import { Redirect } from 'expo-router';

/**
 * Retired Expo-template modal screen. The original "This is a modal" template
 * content was removed (audit M-11, App Store 2.1 completeness). Expo Router
 * still registers every file under `app/` as a route, so rather than ship a
 * stray screen this route simply bounces back to the app. The file can be
 * deleted outright once the route is confirmed unused.
 */
export default function RetiredModalRoute() {
  return <Redirect href="/" />;
}
