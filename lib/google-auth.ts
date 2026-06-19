import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';
import { apiClient } from './api/client';

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

export const signInWithGoogle = async () => {
  const redirectUri = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
    provider: 'google',
  });

  if (error || !data.url) {
    throw new Error(error?.message || 'Failed to get Google auth URL');
  }

  const authUrl = withRedirectTo(data.url, redirectUri);

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type === 'success') {
    const { access_token, refresh_token } = getAuthTokens(result.url);

    if (access_token && refresh_token) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      try {
        await apiClient('/api/auth/sync-profile', { method: 'POST' });
      } catch (e) {
        console.warn('Profile sync failed:', e);
      }

      return sessionData;
    }
  }

  throw new Error('Google sign in cancelled or failed');
};
