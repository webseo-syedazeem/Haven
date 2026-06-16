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
  await supabase.auth.signOut();
  queryClient.clear();
}
