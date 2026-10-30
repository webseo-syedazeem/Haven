import { useQuery } from '@tanstack/react-query';
import type { ModeId } from '@/constants/modes';
import { API_BASE_URL } from '@/lib/api/client';

export type RemoteTestimonial = { id: string; mode: ModeId; quote: string; name: string; role?: string; avatar_url?: string };

async function fetchTestimonials(): Promise<RemoteTestimonial[]> {
  const response = await fetch(`${API_BASE_URL}/api/remote-config/home_testimonials`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error('Testimonials are temporarily unavailable');
  const json = await response.json() as { data?: { value?: { testimonials?: unknown[] } } };
  const rows = json.data?.value?.testimonials;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const row = raw as Record<string, unknown>;
    if (row.consent_confirmed !== true || typeof row.id !== 'string' || typeof row.name !== 'string' || typeof row.quote !== 'string' || !['focus', 'sleep', 'relax'].includes(String(row.mode))) return [];
    return [{ id: row.id, mode: row.mode as ModeId, name: row.name.trim(), quote: row.quote.trim(), role: typeof row.role === 'string' ? row.role.trim() : undefined, avatar_url: typeof row.avatar_url === 'string' && /^https:\/\//i.test(row.avatar_url) ? row.avatar_url : undefined }];
  }).filter((row) => row.name && row.quote);
}

export function useRemoteTestimonials(mode: ModeId) {
  const query = useQuery({ queryKey: ['remote-config', 'home_testimonials'], queryFn: fetchTestimonials, staleTime: 300_000, retry: 1 });
  return { ...query, testimonials: (query.data || []).filter((row) => row.mode === mode).slice(0, 2) };
}
