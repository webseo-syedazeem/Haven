import { ApiError } from '@/lib/api/errors';

export type AuthErrorCode =
  | 'ALREADY_AUTHENTICATED'
  | 'AUTH_ERROR'
  | 'AUTH_USER_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'EMAIL_NOT_CONFIRMED'
  | 'EMAIL_NOT_REGISTERED'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_AUTH_HEADER'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_TOKEN'
  | 'PROFILE_IMAGE_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR';

export type AuthFieldErrors = Record<string, string>;

type AuthErrorPayload = {
  code?: AuthErrorCode;
  details?: Record<string, unknown>;
  error?: string;
  success?: boolean;
};

export type ParsedAuthError = {
  code?: AuthErrorCode;
  fields: AuthFieldErrors;
  message: string;
};

/** Reads the backend authError envelope without losing network/client errors. */
export function parseAuthError(error: unknown, fallback: string): ParsedAuthError {
  const payload = error instanceof ApiError && isRecord(error.payload)
    ? (error.payload as AuthErrorPayload)
    : undefined;
  const fields: AuthFieldErrors = {};

  if (payload && isRecord(payload.details)) {
    for (const [field, message] of Object.entries(payload.details)) {
      if (typeof message === 'string' && message.trim()) fields[field] = message;
    }
  }

  return {
    code: payload?.code,
    fields,
    message:
      (typeof payload?.error === 'string' && payload.error.trim()) ||
      (error instanceof Error && error.message) ||
      fallback,
  };
}

export function firstFieldError(fields: AuthFieldErrors): string | undefined {
  return Object.values(fields).find(Boolean);
}

/** Mirrors AuthValidation.emailIssue on the API. */
export function emailIssue(value: string): string | null {
  if (!value.trim()) return 'email is required';
  const email = value.trim();
  return email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? 'email must be a valid email address'
    : null;
}

/** Mirrors AuthValidation.passwordIssue on the API. */
export function passwordIssue(value: string, field: string, strong: boolean): string | null {
  if (!value) return `${field} is required`;
  if (value.length > 72) return `${field} must not exceed 72 characters`;
  if (!strong) return null;
  if (value.length < 8) return `${field} must be at least 8 characters long`;
  return !/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)
    ? `${field} must contain an uppercase letter, a lowercase letter, and a number`
    : null;
}

/** Mirrors AuthValidation.nameIssue on the API. */
export function nameIssue(value: string, field: string, min = 1): string | null {
  if (!value.trim()) return `${field} is required`;
  const name = value.trim();
  if (name.length < min || name.length > 50) {
    return `${field} must be between ${min} and 50 characters`;
  }
  return /[\u0000-\u001F\u007F]/.test(name) ? `${field} contains invalid characters` : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}
