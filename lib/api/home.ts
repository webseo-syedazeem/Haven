import { apiClient } from './client';

/**
 * Design preview switch. With this on, every Home rail is served from the local
 * sample set in `home.mock.ts` instead of the API, so the screen can be reviewed
 * fully populated while the real catalogue is still near empty.
 * Leave it OFF — the real API is the default.
 */
export const USE_MOCK_HOME = false;

export type SoundscapeMode = 'sleep' | 'relax' | 'focus';

export type DetailLevel = 'minimal' | 'balanced' | 'rich';

/**
 * One row of the `soundscapes` table, as returned by every catalogue endpoint.
 * Field names mirror the columns exactly; everything past `duration_seconds` is
 * optional because the catalogue is still being filled in.
 */
export type Soundscape = {
  id: string;
  title: string;
  short_title?: string | null;
  subcategory?: string | null;
  one_line_description?: string | null;
  detail_description?: string | null;
  designed_for?: string | null;
  best_use?: string | null;
  artwork_url?: string | null;
  file_url?: string | null;
  /** The short clip the onboarding preview plays; `file_url` is the full soundscape. */
  preview_url?: string | null;
  mode?: SoundscapeMode | null;
  duration_seconds?: number | null;
  play_count?: number | null;
  // Sound profile
  detail_level?: DetailLevel | null;
  intensity?: number | null;
  perspective?: string | null;
  movement?: string | null;
  human_presence?: boolean | null;
  contains?: string[] | null;
  does_not_contain?: string[] | null;
  animals?: string[] | null;
  instruments?: string[] | null;
  sound_sources?: string[] | null;
  // Production
  is_loop?: boolean | null;
  file_size_bytes?: number | null;
  catalogue_ref?: string | null;
  qa_reviewer?: string | null;
  qa_passed_at?: string | null;
  rights_status?: string | null;
  // Science note
  science_label?: string | null;
  science_note?: string | null;
  /** Only present on `/api/soundscapes/:id/similar` rows. */
  similarity_score?: number | null;
};

export type Collection = {
  id: string;
  slug?: string | null;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  mode?: SoundscapeMode | null;
  /** Modes represented by this collection's currently live members. */
  soundscape_modes?: SoundscapeMode[];
  soundscape_count?: number | null;
  popularity_score?: number | null;
  created_at?: string | null;
};

export type ContinueListeningItem = {
  soundscape: Soundscape | null;
  position_seconds: number;
  duration_seconds: number | null;
  updated_at: string;
};

export type Favourite = {
  id: string;
  soundscape_id: string;
  created_at?: string;
  soundscape?: Soundscape | null;
};

export type PlayHistoryEntry = {
  id: string;
  soundscape_id: string;
  played_at?: string;
  soundscape?: Soundscape | null;
};

type Envelope<T> = { success: boolean; data: T };

export type LibraryQuery = {
  sort?: 'recommended' | 'most_played' | 'most_saved' | 'recently_added' | 'a_z' | 'shortest' | 'longest';
  max_duration?: number;
  min_duration?: number;
  modes?: SoundscapeMode[];
  limit?: number;
};

function buildLibraryPath({ sort, max_duration, min_duration, modes, limit }: LibraryQuery) {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  if (typeof min_duration === 'number') params.set('min_duration', String(min_duration));
  if (typeof max_duration === 'number') params.set('max_duration', String(max_duration));
  if (modes?.length) params.set('modes', modes.join(','));
  if (typeof limit === 'number') params.set('limit', String(limit));

  const query = params.toString();
  return query ? `/api/library?${query}` : '/api/library';
}

export const homeApi = {
  continueListening: async (): Promise<ContinueListeningItem[]> => {
    if (USE_MOCK_HOME) return (await import('./home.mock')).mockContinueListening();
    const res = await apiClient<Envelope<{ items: ContinueListeningItem[] }>>(
      '/api/home/continue-listening'
    );
    return res.data?.items ?? [];
  },

  recommended: async (): Promise<Soundscape[]> => {
    if (USE_MOCK_HOME) return (await import('./home.mock')).mockSoundscapes('recommended');
    const res = await apiClient<Envelope<{ soundscapes: Soundscape[] }>>('/api/home/recommended');
    return res.data?.soundscapes ?? [];
  },

  playHistory: async (): Promise<Soundscape[]> => {
    if (USE_MOCK_HOME) return (await import('./home.mock')).mockSoundscapes('recent');
    const res = await apiClient<Envelope<{ play_history: PlayHistoryEntry[] }>>('/api/play-history');
    return dedupeById((res.data?.play_history ?? []).map((entry) => entry.soundscape));
  },

  favourites: async (): Promise<Favourite[]> => {
    if (USE_MOCK_HOME) return (await import('./home.mock')).mockFavourites();
    const res = await apiClient<Envelope<{ favourites: Favourite[] }>>('/api/favourites');
    return res.data?.favourites ?? [];
  },

  library: async (query: LibraryQuery): Promise<Soundscape[]> => {
    if (USE_MOCK_HOME) {
      return (await import('./home.mock')).mockSoundscapes(
        query.sort === 'shortest' ? 'short' : 'new'
      );
    }
    const res = await apiClient<Envelope<{ soundscapes: Soundscape[] }>>(buildLibraryPath(query));
    const soundscapes = res.data?.soundscapes ?? [];
    // `/api/library` has no server side limit yet, so trim client side.
    return typeof query.limit === 'number' ? soundscapes.slice(0, query.limit) : soundscapes;
  },

  popularCollections: async (): Promise<Collection[]> => {
    if (USE_MOCK_HOME) return (await import('./home.mock')).mockCollections();
    const res = await apiClient<Envelope<{ collections: Collection[] }>>('/api/collections/popular');
    return res.data?.collections ?? [];
  },

  /**
   * Never mocked: the detail screen, mode hub and player all need a real
   * `file_url`, so this always goes to the API even in Home preview mode.
   */
  soundscape: async (id: string): Promise<Soundscape | null> => {
    const res = await apiClient<Envelope<{ soundscape: Soundscape }>>(
      `/api/soundscapes/${encodeURIComponent(id)}/details`
    );
    return res.data?.soundscape ?? null;
  },

  addFavourite: (soundscapeId: string) =>
    apiClient<Envelope<{ favourite: Favourite }>>('/api/favourites', {
      method: 'POST',
      body: JSON.stringify({ soundscape_id: soundscapeId }),
    }),

  removeFavourite: (soundscapeId: string) =>
    apiClient<Envelope<{ favourite: Favourite }>>(
      `/api/favourites/${encodeURIComponent(soundscapeId)}`,
      { method: 'DELETE' }
    ),
};

/** Play history returns one row per play, so the same soundscape repeats. */
function dedupeById(rows: (Soundscape | null | undefined)[]): Soundscape[] {
  const seen = new Set<string>();
  const result: Soundscape[] = [];

  for (const row of rows) {
    if (!row?.id || seen.has(row.id)) continue;
    seen.add(row.id);
    result.push(row);
  }

  return result;
}
