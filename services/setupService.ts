import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { apiClient } from '@/lib/api/client';
import { getAccessToken } from '@/lib/haven-api';
import { type SetupPayload } from '@/lib/setup-api';

const TOKEN_KEY = 'access_token';

function getWebToken() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage?.getItem(TOKEN_KEY) ?? null
    : null;
}

async function hasAccessToken() {
  if (getAccessToken()) {
    return true;
  }

  if (Platform.OS === 'web') {
    return Boolean(getWebToken());
  }

  return Boolean(await SecureStore.getItemAsync(TOKEN_KEY));
}

export async function createSetup(payload: SetupPayload) {
  if (!(await hasAccessToken())) {
    throw new Error('Please login again before saving your setup.');
  }

  return apiClient<any>('/api/setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
