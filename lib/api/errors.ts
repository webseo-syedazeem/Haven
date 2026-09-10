/**
 * Why a request failed, in the one distinction the app actually acts on:
 * whether the server answered.
 *
 * A `NetworkError` means the request never reached anyone — airplane mode, no
 * signal, DNS, a timeout. It says nothing about the session, so it must never
 * sign the user out. An `ApiError` means a reachable server answered and said
 * no; only that can be an auth failure.
 */

export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'NetworkError';
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/** True when the server was never reached, so nothing can be concluded from it. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError;
}

/**
 * True only when a reachable server rejected the credentials. This is the sole
 * condition that may end a session.
 */
export function isAuthFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}
