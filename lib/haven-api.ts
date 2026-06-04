import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
const AUTH_SESSION_STORAGE_KEY = 'haven.auth.session';
const AUTH_USER_STORAGE_KEY = 'haven.auth.user';
const AUTH_PROFILE_STORAGE_KEY = 'haven.auth.profile';

export type AuthUser = {
  id?: string;
  email?: string;
  username?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type AuthResponse = {
  access_token?: string;
  data?: {
    profile?: AuthUser;
    session?: AuthSession;
    user?: AuthUser;
  };
  profile?: AuthUser;
  session?: AuthSession;
  token?: string;
  user?: AuthUser;
  [key: string]: unknown;
};

export type AuthSession = {
  access_token?: string;
  refresh_token?: string;
  [key: string]: unknown;
};

let accessToken: string | null = null;

async function setStoredValue(key: string, value: unknown) {
  const serializedValue = JSON.stringify(value);

  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, serializedValue);
    return;
  }

  await SecureStore.setItemAsync(key, serializedValue);
}

function getErrorMessage(status: number, data: unknown) {
  if (data && typeof data === 'object') {
    const errorData = data as Record<string, unknown>;
    const message = errorData.message ?? errorData.error;

    if (typeof message === 'string') {
      return message;
    }
  }

  return `Request failed with status ${status}`;
}

async function parseResponse(response: Response) {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}) {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Unable to reach the API server. Please check the backend URL or deployment.');
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, data));
  }

  return data as T;
}

function rememberToken(response: AuthResponse) {
  accessToken =
    response.access_token ??
    response.token ??
    response.session?.access_token ??
    response.data?.session?.access_token ??
    null;
}

async function saveAuthData(response: AuthResponse) {
  const session = response.session ?? response.data?.session;
  const user = response.user ?? response.data?.user;
  const profile = response.profile ?? response.data?.profile;

  if (session) {
    await setStoredValue(AUTH_SESSION_STORAGE_KEY, session);
  }

  if (user) {
    await setStoredValue(AUTH_USER_STORAGE_KEY, user);
  }

  if (profile) {
    await setStoredValue(AUTH_PROFILE_STORAGE_KEY, profile);
  }
}

export function getAccessToken() {
  return accessToken;
}

export async function signUp(payload: { email: string; password: string; username: string }) {
  const response = await apiRequest<AuthResponse>('/api/signup', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  rememberToken(response);
  await saveAuthData(response);
  return response;
}

export async function signIn(payload: { email: string; password: string }) {
  const response = await apiRequest<AuthResponse>('/api/signin', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  rememberToken(response);
  await saveAuthData(response);
  return response;
}

export const googleSignIn = async (id_token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    body: JSON.stringify({ id_token }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const data = (await response.json()) as AuthResponse & { success?: boolean; error?: string };

  if (!data.success) {
    throw new Error(data.error ?? 'Google sign in failed');
  }

  rememberToken(data);
  await saveAuthData(data);
  return data.data;
};

export function forgotPassword(email: string) {
  return apiRequest<{ message?: string }>('/api/forgot-password', {
    body: JSON.stringify({ email }),
    method: 'POST',
  });
}

export function resetPassword(payload: { access_token: string; newPassword: string }) {
  return apiRequest<{ message?: string }>('/api/reset-password', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function changePassword(payload: { oldPassword: string; newPassword: string }) {
  return apiRequest<{ message?: string }>('/api/change-password', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function getCurrentUser() {
  return apiRequest<AuthUser>('/api/me');
}
