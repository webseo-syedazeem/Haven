import type { LibraryFilters, SortValue } from '@/constants/filters';
import { apiClient, publicApiClient } from './client';
import type { Collection, Soundscape } from './home';

type Envelope<T> = { success: boolean; data: T };

/** `/api/soundscapes/mode/:mode` returns rows already grouped by subcategory. */
export type SoundscapesByMode = {
  mode: string;
  soundscapes: Record<string, Soundscape[]>;
};

/** The eight groupings `collections.explore_group` is constrained to. */
export type ExploreGroupKey =
  | 'nature'
  | 'indoor'
  | 'travel'
  | 'animals'
  | 'instruments'
  | 'weather'
  | 'situation'
  | 'editorial';

export type ExploreGroup = {
  group: ExploreGroupKey;
  collections: Collection[];
};

/** `/api/collections/:id` nests its soundscapes inside the collection itself. */
export type CollectionDetail = Collection & {
  soundscapes: Soundscape[];
};

/** Suggestions are a trimmed projection — no artwork, no duration. */
export type SearchSuggestion = {
  id: string;
  title: string;
  subcategory?: string | null;
  mode?: string | null;
};

export type LibraryResult = {
  soundscapes: Soundscape[];
  /** The server's own count, before any client side trimming. */
  result_count: number;
};

/**
 * `/api/library` reads comma separated lists. Empty groups are omitted rather
 * than sent blank, because the RPC treats an empty array as "no filter" but a
 * stray `?contains=` would still round trip as one.
 */
export function buildLibraryQuery(filters: LibraryFilters, sort: SortValue): string {
  const params = new URLSearchParams();

  const lists: [string, string[]][] = [
    ['modes', filters.modes],
    ['contains', filters.contains],
    ['avoids', filters.avoids],
    ['environments', filters.environments],
    ['animals', filters.animals],
    ['instruments', filters.instruments],
    ['detail_levels', filters.detail_levels],
  ];

  for (const [key, values] of lists) {
    if (values.length) params.set(key, values.join(','));
  }

  // The API takes seconds; the slider works in minutes.
  if (filters.minMinutes !== null) params.set('min_duration', String(filters.minMinutes * 60));
  if (filters.maxMinutes !== null) params.set('max_duration', String(filters.maxMinutes * 60));

  params.set('sort', sort);

  return params.toString();
}

export const catalogueApi = {
  byMode: async (mode: string): Promise<SoundscapesByMode> => {
    const res = await publicApiClient<Envelope<SoundscapesByMode>>(
      `/api/soundscapes/mode/${encodeURIComponent(mode)}`
    );

    return {
      mode: res.data?.mode ?? mode,
      soundscapes: res.data?.soundscapes ?? {},
    };
  },

  /** A few playable soundscapes from one mode. Guest-safe: sent with no token. */
  preview: async (mode: string, count: number): Promise<Soundscape[]> => {
    const res = await publicApiClient<Envelope<{ mode: string; soundscapes: Soundscape[] }>>(
      `/api/soundscapes/mode/${encodeURIComponent(mode)}/preview?count=${count}`
    );
    return res.data?.soundscapes ?? [];
  },

  similar: async (soundscapeId: string): Promise<Soundscape[]> => {
    const res = await apiClient<Envelope<{ soundscapes: Soundscape[] }>>(
      `/api/soundscapes/${encodeURIComponent(soundscapeId)}/similar`
    );
    return res.data?.soundscapes ?? [];
  },

  explore: async (): Promise<ExploreGroup[]> => {
    const res = await apiClient<Envelope<{ groups: ExploreGroup[] }>>('/api/explore');
    return res.data?.groups ?? [];
  },

  collections: async (): Promise<Collection[]> => {
    const res = await apiClient<Envelope<{ collections: Collection[] }>>('/api/collections');
    return res.data?.collections ?? [];
  },

  collection: async (id: string): Promise<CollectionDetail | null> => {
    const res = await apiClient<Envelope<{ collection: CollectionDetail }>>(
      `/api/collections/${encodeURIComponent(id)}`
    );
    const collection = res.data?.collection ?? null;
    if (!collection) return null;

    return { ...collection, soundscapes: collection.soundscapes ?? [] };
  },

  library: async (filters: LibraryFilters, sort: SortValue): Promise<LibraryResult> => {
    const query = buildLibraryQuery(filters, sort);
    const res = await apiClient<Envelope<LibraryResult>>(`/api/library?${query}`);

    return {
      soundscapes: res.data?.soundscapes ?? [],
      result_count: res.data?.result_count ?? res.data?.soundscapes?.length ?? 0,
    };
  },

  search: async (query: string): Promise<Soundscape[]> => {
    const res = await apiClient<Envelope<{ soundscapes: Soundscape[] }>>(
      `/api/soundscapes/search?q=${encodeURIComponent(query)}`
    );
    return res.data?.soundscapes ?? [];
  },

  suggestions: async (query: string): Promise<SearchSuggestion[]> => {
    const res = await apiClient<Envelope<{ suggestions: SearchSuggestion[] }>>(
      `/api/soundscapes/suggestions?q=${encodeURIComponent(query)}`
    );
    return res.data?.suggestions ?? [];
  },

  /** Used by the no-results state so a search never dead-ends. */
  requestSoundscape: (message: string, contactEmail?: string) =>
    apiClient<Envelope<{ request: unknown }>>('/api/support/request-soundscape', {
      method: 'POST',
      body: JSON.stringify({
        message,
        ...(contactEmail ? { contact_email: contactEmail } : {}),
      }),
    }),
};
