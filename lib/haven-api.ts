import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy' : REMOTE_API_BASE_URL;
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'haven.auth.refresh_token';
const LEGACY_ACCESS_TOKEN_KEY = 'haven.auth.access_token';

export type AuthUser = {
  id?: string;
  email?: string;
  username?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type AuthResponse = {
  access_token?: string;
  token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
  data?: {
    access_token?: string;
    token?: string;
    refresh_token?: string;
    accessToken?: string;
    refreshToken?: string;
    auth?: {
      session?: {
        access_token?: string;
        refresh_token?: string;
        accessToken?: string;
        refreshToken?: string;
        token?: string;
        [key: string]: unknown;
      };
      user?: AuthUser;
      [key: string]: unknown;
    };
    session?: {
      access_token?: string;
      refresh_token?: string;
      accessToken?: string;
      refreshToken?: string;
      token?: string;
      [key: string]: unknown;
    };
    user?: AuthUser;
    [key: string]: unknown;
  };
  user?: AuthUser;
  [key: string]: unknown;
};

export type ApiResponse<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
  [key: string]: unknown;
};

export type ProfileImageUpload = {
  uri: string;
  name: string;
  type: string;
};

let accessToken: string | null = null;
let refreshToken: string | null = null;

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

async function setStoredItem(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();

    if (!storage) {
      return;
    }

    if (value) {
      storage.setItem(key, value);
    } else {
      storage.removeItem(key);
    }

    return;
  }

  if (value) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

function getShortTokenLog(token: string | null | undefined) {
  return token ? `${token.slice(0, 10)}...` : 'missing';
}

function looksLikeJwt(token: string | undefined) {
  return Boolean(token && token.split('.').length === 3);
}

function pickAccessToken(candidates: { source: string; value?: string }[]) {
  return (
    candidates.find((candidate) => looksLikeJwt(candidate.value)) ??
    candidates.find((candidate) => Boolean(candidate.value))
  );
}

function pickToken(candidates: { source: string; value?: string }[]) {
  return candidates.find((candidate) => Boolean(candidate.value));
}

async function clearStoredAccessTokens() {
  await Promise.all([
    setStoredItem(ACCESS_TOKEN_KEY, null),
    setStoredItem(LEGACY_ACCESS_TOKEN_KEY, null),
  ]);
}

async function persistTokens() {
  await Promise.all([
    setStoredItem(ACCESS_TOKEN_KEY, accessToken),
    setStoredItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
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

function isFormDataBody(body: BodyInit | null | undefined) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function buildHeaders(options: RequestInit) {
  const headers = new Headers(options.headers);

  if (!isFormDataBody(options.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

async function apiRequest<T>(path: string, options: RequestInit = {}) {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: buildHeaders(options),
    });
  } catch (error) {
    const details = error instanceof Error && error.message ? ` (${error.message})` : '';
    throw new Error(`Unable to reach the API server. Please check the backend URL or deployment.${details}`);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, data));
  }

  return data as T;
}

async function rememberToken(response: AuthResponse) {
  const session = response.data?.session;
  const authSession = response.data?.auth?.session;
  const accessTokenCandidate = pickAccessToken([
    { source: 'access_token', value: response.access_token },
    { source: 'accessToken', value: response.accessToken },
    { source: 'data.access_token', value: response.data?.access_token },
    { source: 'data.accessToken', value: response.data?.accessToken },
    { source: 'data.session.access_token', value: session?.access_token },
    { source: 'data.session.accessToken', value: session?.accessToken },
    { source: 'data.auth.session.access_token', value: authSession?.access_token },
    { source: 'data.auth.session.accessToken', value: authSession?.accessToken },
    { source: 'token', value: response.token },
    { source: 'data.token', value: response.data?.token },
    { source: 'data.session.token', value: session?.token },
    { source: 'data.auth.session.token', value: authSession?.token },
  ]);
  const refreshTokenCandidate = pickToken([
    { source: 'refresh_token', value: response.refresh_token },
    { source: 'refreshToken', value: response.refreshToken },
    { source: 'data.refresh_token', value: response.data?.refresh_token },
    { source: 'data.refreshToken', value: response.data?.refreshToken },
    { source: 'data.session.refresh_token', value: session?.refresh_token },
    { source: 'data.session.refreshToken', value: session?.refreshToken },
    { source: 'data.auth.session.refresh_token', value: authSession?.refresh_token },
    { source: 'data.auth.session.refreshToken', value: authSession?.refreshToken },
  ]);
  const nextAccessToken = accessTokenCandidate?.value;
  const nextRefreshToken = refreshTokenCandidate?.value;

  console.log(
    'AUTH token exists:',
    Boolean(nextAccessToken),
    getShortTokenLog(nextAccessToken),
    'source:',
    accessTokenCandidate?.source ?? 'none'
  );

  if (!nextAccessToken) {
    throw new Error('Login succeeded but no access token was returned.');
  }

  await clearStoredAccessTokens();
  accessToken = nextAccessToken;
  refreshToken =
    nextRefreshToken ??
    refreshToken;

  await persistTokens();
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setAuthTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  accessToken = tokens.accessToken ?? accessToken;
  refreshToken = tokens.refreshToken ?? refreshToken;
  void persistTokens();
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  void setStoredItem(ACCESS_TOKEN_KEY, token);
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
  void Promise.all([persistTokens(), clearStoredAccessTokens()]);
}

export async function refreshSession(token = refreshToken) {
  if (!token) {
    throw new Error('No refresh token is available.');
  }

  const response = await apiRequest<AuthResponse>('/api/refresh-token', {
    body: JSON.stringify({ refresh_token: token }),
    method: 'POST',
  });

  await rememberToken(response);
  return response;
}

export async function signUp(payload: { email: string; password: string; username: string }) {
  accessToken = null;
  refreshToken = null;
  await clearStoredAccessTokens();

  const response = await apiRequest<AuthResponse>('/api/signup', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  await rememberToken(response);
  return response;
}

export async function signIn(payload: { email: string; password: string }) {
  accessToken = null;
  refreshToken = null;
  await clearStoredAccessTokens();

  const response = await apiRequest<AuthResponse>('/api/signin', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  await rememberToken(response);
  return response;
}

export function forgotPassword(email: string) {
  return apiRequest<{ message?: string }>('/api/forgot-password', {
    body: JSON.stringify({ email }),
    method: 'POST',
  });
}

export function resetPassword(payload: { newPassword: string; access_token?: string; token?: string }) {
  const resetToken = payload.access_token ?? payload.token;

  return apiRequest<{ message?: string }>('/api/reset-password', {
    body: JSON.stringify({ newPassword: payload.newPassword }),
    headers: resetToken ? { Authorization: `Bearer ${resetToken}` } : undefined,
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
  return apiRequest<ApiResponse<{ user?: AuthUser }> | AuthUser>('/api/me');
}

export function checkSession() {
  return apiRequest<ApiResponse<{ valid?: boolean; user?: AuthUser; profile?: unknown }>>('/api/check-session');
}

export function updateName(payload: { first_name: string; last_name: string }) {
  return apiRequest<ApiResponse<{ user?: AuthUser; profile?: unknown }>>('/api/update-name', {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

export function uploadProfileImage(image: ProfileImageUpload) {
  const formData = new FormData();
  formData.append('image', image as unknown as Blob);

  return apiRequest<ApiResponse>('/api/upload-profile-image', {
    body: formData,
    method: 'POST',
  });
}

export async function logout() {
  const response = await apiRequest<ApiResponse<{ message?: string }>>('/api/logout', {
    method: 'POST',
  });

  clearAuthTokens();
  return response;
}

export async function deleteAccount() {
  const response = await apiRequest<ApiResponse<{ message?: string }>>('/api/delete-account', {
    method: 'DELETE',
  });

  clearAuthTokens();
  return response;
}
