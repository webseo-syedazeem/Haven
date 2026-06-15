import { apiClient } from '@/lib/api/client';

import { resolveBreathingTypeName, type BreathingTypeName } from './config';

export async function startBreathingSession(type: string): Promise<string | null> {
  const apiType = resolveBreathingTypeName(type);
  if (!apiType) return null;

  try {
    const res = await apiClient<{ data?: { session?: { id?: string } } }>('/api/breathing', {
      method: 'POST',
      body: JSON.stringify({ type: apiType }),
    });
    return res?.data?.session?.id ?? null;
  } catch {
    return null;
  }
}

export function updateBreathingSession(sessionId: string, completedDurationSeconds: number) {
  if (!sessionId) return;

  void apiClient(`/api/breathing/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify({ completed_duration_seconds: completedDurationSeconds }),
  }).catch(() => {});
}

export function resolveApiBreathingType(type: string): BreathingTypeName | null {
  return resolveBreathingTypeName(type);
}
