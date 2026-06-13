const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';

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

function rememberToken(response: AuthResponse) {
  const session = response.data?.session;

  accessToken =
    response.access_token ??
    response.accessToken ??
    response.token ??
    session?.access_token ??
    session?.accessToken ??
    session?.token ??
    accessToken;
  refreshToken =
    response.refresh_token ??
    response.refreshToken ??
    session?.refresh_token ??
    session?.refreshToken ??
    refreshToken;
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
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
}

export async function refreshSession(token = refreshToken) {
  if (!token) {
    throw new Error('No refresh token is available.');
  }

  const response = await apiRequest<AuthResponse>('/api/refresh-token', {
    body: JSON.stringify({ refresh_token: token }),
    method: 'POST',
  });

  rememberToken(response);
  return response;
}

export async function signUp(payload: { email: string; password: string; username: string }) {
  const response = await apiRequest<AuthResponse>('/api/signup', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  rememberToken(response);
  return response;
}

export async function signIn(payload: { email: string; password: string }) {
  const response = await apiRequest<AuthResponse>('/api/signin', {
    body: JSON.stringify(payload),
    method: 'POST',
  });

  rememberToken(response);
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
