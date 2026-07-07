import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { ME_QUERY_KEY } from '@/hooks/useUser';
import { apiClient } from './api/client';
import { userApi } from './api/user';
import { queryClient } from './query-client';
import { supabase } from './supabase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  scopes: ['profile', 'email'],
});

type LegacyGoogleSignInResponse = {
  data?: {
    idToken?: string | null;
  } | null;
  idToken?: string | null;
};

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore if there is no native Google session to clear.
    }

    const response = await GoogleSignin.signIn();

    const responseType = (response as { type?: string }).type;

    if (responseType && !isSuccessResponse(response)) {
      return null;
    }

    const legacyResponse = response as LegacyGoogleSignInResponse;
    const idToken = legacyResponse.data?.idToken ?? legacyResponse.idToken;

    if (!idToken) {
      throw new Error('Google sign in did not return an ID token.');
    }

    const { data: sessionData, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      throw new Error(error.message);
    }

    await apiClient('/api/auth/sync-profile', { method: 'POST' });
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    await queryClient.fetchQuery({ queryKey: ME_QUERY_KEY, queryFn: userApi.get, staleTime: 0 });

    return sessionData;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
        return null;
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is not available or needs to be updated.');
      }
    }

    throw error;
  }
};
