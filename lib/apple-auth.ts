import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { ME_QUERY_KEY } from '@/hooks/useUser';
import { cacheProfile, markLoggedIn } from '@/lib/auth/offline-session';
import { setSessionSource } from '@/lib/auth/session-state';
import { apiClient } from './api/client';
import { userApi } from './api/user';
import { queryClient } from './query-client';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const getAuthTokens = (url: string) => {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.hash ? parsedUrl.hash.substring(1) : parsedUrl.search);

  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
  };
};

const withRedirectTo = (authUrl: string, redirectUri: string) => {
  const url = new URL(authUrl);
  url.searchParams.set('redirect_to', redirectUri);
  return url.toString();
};

export const signInWithApple = async () => {
  if (Platform.OS === 'ios' && await AppleAuthentication.isAvailableAsync()) {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) throw new Error('Apple did not return an identity token.');
      const { data: nativeData, error: nativeError } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      if (nativeError) throw new Error(nativeError.message);
      if (credential.fullName?.givenName || credential.fullName?.familyName) {
        await supabase.auth.updateUser({ data: { full_name: [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ') } });
      }
      setSessionSource('supabase', Boolean(nativeData.session?.access_token));
      await markLoggedIn();
      try { await apiClient('/api/auth/sync-profile', { method: 'POST' }); await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }); } catch (profileError) { console.warn('[auth] Apple profile sync remains pending', profileError); }
      // Hand the one-time authorization code to the backend so it can exchange it
      // for an Apple refresh token and revoke it on account deletion (App Store
      // 5.1.1(v)). Best-effort and only available on the native sign-in, which is
      // where the code is returned; a no-op server-side until Apple is configured.
      if (credential.authorizationCode) {
        try {
          await apiClient('/api/auth/apple/register-revocation', {
            method: 'POST',
            body: JSON.stringify({ authorization_code: credential.authorizationCode }),
          });
        } catch (revocationError) {
          console.warn('[auth] Apple revocation registration remains pending', revocationError);
        }
      }
      return nativeData;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') return null;
      throw error;
    }
  }

  const redirectUri = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
    provider: 'apple',
  });

  if (error || !data.url) {
    throw new Error(error?.message || 'Failed to get Apple auth URL');
  }

  const authUrl = withRedirectTo(data.url, redirectUri);

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  // The user dismissed or cancelled the Apple sheet — not an error to surface
  // (audit L-6). The caller treats null as "nothing happened".
  if (result.type !== 'success') {
    return null;
  }

  const { access_token, refresh_token } = getAuthTokens(result.url);

  if (!access_token || !refresh_token) {
    throw new Error('Apple sign in could not be completed. Please try again.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  setSessionSource('supabase', Boolean(sessionData.session?.access_token));
  await markLoggedIn();

  try {
    await apiClient('/api/auth/sync-profile', { method: 'POST' });
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    const me = await queryClient.fetchQuery({
      queryKey: ME_QUERY_KEY,
      queryFn: userApi.get,
      staleTime: 0,
    });
    await cacheProfile(me);
  } catch (profileError) {
    // Authentication has completed even if the app profile projection is
    // briefly unavailable; the onboarding import has its own retry UI.
    console.warn('[auth] Apple profile sync remains pending', profileError);
  }

  return sessionData;
};
