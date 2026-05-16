const API_BASE_URL = 'https://haven-back-one.vercel.app';

type ApiBody = Record<string, unknown>;

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
  user?: AuthUser;
  [key: string]: unknown;
};

let accessToken: string | null = null;

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, data));
  }

  return data as T;
}

function rememberToken(response: AuthResponse) {
  accessToken = response.access_token ?? response.token ?? null;
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
