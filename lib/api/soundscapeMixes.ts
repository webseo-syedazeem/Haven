import { apiClient } from './client';

export type SoundscapeItem = {
  id: string;
  category?: string;
  subcategory?: string;
  title?: string;
  file_url?: string;
  duration_seconds?: number | null;
};

export type SoundscapeMix = {
  id: string;
  name: string;
  soundscape_ids: string[];
  volumes: Record<string, number>;
  is_favorite?: boolean;
  last_played_at?: string | null;
  created_at: string;
  updated_at: string;
  soundscapes?: SoundscapeItem[];
};

type MixesResponse = { data: { mixes: SoundscapeMix[] } };
type MixResponse = { data: { mix: SoundscapeMix } };

export const soundscapeMixesApi = {
  getAll: () => apiClient<MixesResponse>('/api/soundscapes/mix'),
  getOne: (id: string) => apiClient<MixResponse>(`/api/soundscapes/mix/${id}`),
  create: (payload: { name: string; soundscape_ids: string[]; volumes?: Record<string, number> }) =>
    apiClient<MixResponse>('/api/soundscapes/mix', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (
    id: string,
    payload: Partial<{ name: string; soundscape_ids: string[]; volumes: Record<string, number>; is_favorite: boolean }>
  ) =>
    apiClient<MixResponse>(`/api/soundscapes/mix/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id: string) =>
    apiClient<{ data: { message: string } }>(`/api/soundscapes/mix/${id}`, {
      method: 'DELETE',
    }),
  setFavorite: (id: string, isFavorite: boolean) =>
    apiClient<MixResponse>(`/api/soundscapes/mix/${id}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ is_favorite: isFavorite }),
    }),
  recordPlay: (id: string) =>
    apiClient<MixResponse>(`/api/soundscapes/mix/${id}/play`, {
      method: 'PATCH',
    }),
};
