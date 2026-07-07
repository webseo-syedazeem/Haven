import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { QueryClient } from '@tanstack/react-query';

import { apiClient, clearStoredAccessToken } from '@/lib/api/client';
import { clearAuthTokens } from '@/lib/haven-api';
import { supabase } from '@/lib/supabase';

export async function clearUserSession(queryClient: QueryClient) {
  try {
    await apiClient('/api/logout', { method: 'POST' });
  } catch {
    // Ignore if session is already invalid.
  }

  clearAuthTokens();
  await clearStoredAccessToken();
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore if Google native sign out is unavailable or already cleared.
  }
  await supabase.auth.signOut();
  queryClient.clear();
}
