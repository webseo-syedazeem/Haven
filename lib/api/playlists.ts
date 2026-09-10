import { apiClient } from './client';
import type { Soundscape } from './home';

type Envelope<T> = { success: boolean; data: T };

/** One row of `user_playlists`. `item_count` is added by `GET /api/playlists`. */
export type Playlist = {
  id: string;
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  /** Only present on the list endpoint. */
  item_count?: number;
};

export type PlaylistItem = {
  playlist_id: string;
  soundscape_id: string;
  sort_order: number;
  added_at?: string;
  soundscape: Soundscape | null;
};

/** `GET /api/playlists/:id` nests the items inside the playlist. */
export type PlaylistDetail = Playlist & {
  items: PlaylistItem[];
};

export type PlaylistPayload = {
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
};

export const playlistsApi = {
  list: async (): Promise<Playlist[]> => {
    const res = await apiClient<Envelope<{ playlists: Playlist[] }>>('/api/playlists');
    return res.data?.playlists ?? [];
  },

  detail: async (id: string): Promise<PlaylistDetail | null> => {
    const res = await apiClient<Envelope<{ playlist: PlaylistDetail }>>(
      `/api/playlists/${encodeURIComponent(id)}`
    );
    const playlist = res.data?.playlist ?? null;
    if (!playlist) return null;

    return { ...playlist, items: playlist.items ?? [] };
  },

  create: async (payload: PlaylistPayload): Promise<Playlist | null> => {
    const res = await apiClient<Envelope<{ playlist: Playlist }>>('/api/playlists', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data?.playlist ?? null;
  },

  update: async (id: string, payload: Partial<PlaylistPayload>): Promise<Playlist | null> => {
    const res = await apiClient<Envelope<{ playlist: Playlist }>>(
      `/api/playlists/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(payload) }
    );
    return res.data?.playlist ?? null;
  },

  remove: (id: string) =>
    apiClient<Envelope<{ message: string }>>(`/api/playlists/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  addItem: (playlistId: string, soundscapeId: string) =>
    apiClient<Envelope<{ item: PlaylistItem }>>(
      `/api/playlists/${encodeURIComponent(playlistId)}/items`,
      { method: 'POST', body: JSON.stringify({ soundscape_id: soundscapeId }) }
    ),

  removeItem: (playlistId: string, soundscapeId: string) =>
    apiClient<Envelope<{ message: string }>>(
      `/api/playlists/${encodeURIComponent(playlistId)}/items/${encodeURIComponent(soundscapeId)}`,
      { method: 'DELETE' }
    ),

  /**
   * The server rejects anything that is not an exact permutation of the current
   * items, so callers must send every id the playlist holds.
   */
  reorder: async (playlistId: string, soundscapeIds: string[]): Promise<PlaylistItem[]> => {
    const res = await apiClient<Envelope<{ items: PlaylistItem[] }>>(
      `/api/playlists/${encodeURIComponent(playlistId)}/reorder`,
      { method: 'PUT', body: JSON.stringify({ soundscape_ids: soundscapeIds }) }
    );
    return res.data?.items ?? [];
  },
};
