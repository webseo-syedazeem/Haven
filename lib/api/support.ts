import { apiClient } from './client';

type Envelope<T> = { success: boolean; data: T };

/**
 * `/api/support/*`. Auth is optional on the three submit routes — a signed in
 * caller is resolved from the bearer token, a guest must supply
 * `contact_email`. Every submission lands in `support_requests` with a `type`
 * the server sets itself, so the client never sends one.
 */
export type SupportRequestType =
  | 'contact_support'
  | 'report_audio_problem'
  | 'request_soundscape';

export type SupportRequest = {
  id: string;
  type: SupportRequestType;
  subject?: string | null;
  message: string;
  soundscape_id?: string | null;
  contact_email?: string | null;
  status?: string | null;
  created_at?: string;
};

export type ContactSupportInput = {
  subject?: string | null;
  message: string;
  contact_email?: string | null;
};

export type ReportAudioProblemInput = {
  /** Must be a UUID; the server 400s on anything else and checks it exists. */
  soundscape_id: string;
  message?: string | null;
  contact_email?: string | null;
};

export type RequestSoundscapeInput = {
  message: string;
  contact_email?: string | null;
};

/** Drops empty optionals so the server's "must be a string" checks never fire. */
function compact<T extends Record<string, unknown>>(input: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = value;
  }
  return out as Partial<T>;
}

export const supportApi = {
  contact: async (input: ContactSupportInput): Promise<SupportRequest | null> => {
    const res = await apiClient<Envelope<{ request: SupportRequest }>>('/api/support/contact', {
      method: 'POST',
      body: JSON.stringify(compact(input)),
    });
    return res.data?.request ?? null;
  },

  reportAudioProblem: async (
    input: ReportAudioProblemInput
  ): Promise<SupportRequest | null> => {
    const res = await apiClient<Envelope<{ request: SupportRequest }>>(
      '/api/support/report-audio-problem',
      { method: 'POST', body: JSON.stringify(compact(input)) }
    );
    return res.data?.request ?? null;
  },

  requestSoundscape: async (input: RequestSoundscapeInput): Promise<SupportRequest | null> => {
    const res = await apiClient<Envelope<{ request: SupportRequest }>>(
      '/api/support/request-soundscape',
      { method: 'POST', body: JSON.stringify(compact(input)) }
    );
    return res.data?.request ?? null;
  },

  myRequests: async (): Promise<SupportRequest[]> => {
    const res = await apiClient<Envelope<{ requests: SupportRequest[] }>>(
      '/api/support/my-requests'
    );
    return res.data?.requests ?? [];
  },
};
