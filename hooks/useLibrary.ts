import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import type { LibraryFilters, SortValue } from '@/constants/filters';
import { catalogueApi } from '@/lib/api/catalogue';
import type { Soundscape } from '@/lib/api/home';

export const LIBRARY_QUERY_KEYS = {
  library: (filters: LibraryFilters, sort: SortValue) => ['library', filters, sort] as const,
  search: (query: string) => ['library', 'search', query] as const,
  suggestions: (query: string) => ['library', 'suggestions', query] as const,
};

const SUGGESTION_DEBOUNCE_MS = 300;
/** The live count inside the filter sheet, which fires on every chip tap. */
export const FILTER_COUNT_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

/** `/api/library` ignores `limit`, so the page size is enforced here. */
export const LIBRARY_PAGE_SIZE = 60;

export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
}

/** The structured filter query. Runs whenever there is no committed search. */
export function useLibrary(filters: LibraryFilters, sort: SortValue, enabled = true) {
  return useQuery({
    queryKey: LIBRARY_QUERY_KEYS.library(filters, sort),
    queryFn: () => catalogueApi.library(filters, sort),
    enabled,
    keepPreviousData: true,
  });
}

/**
 * The live "Show N results" count inside the filter sheet. Debounced, and kept
 * separate from the applied query so opening the sheet never disturbs the list
 * behind it.
 */
export function useLibraryCount(filters: LibraryFilters, sort: SortValue, enabled: boolean) {
  const debouncedFilters = useDebounced(filters, FILTER_COUNT_DEBOUNCE_MS);

  const query = useQuery({
    queryKey: LIBRARY_QUERY_KEYS.library(debouncedFilters, sort),
    queryFn: () => catalogueApi.library(debouncedFilters, sort),
    enabled,
    keepPreviousData: true,
  });

  return {
    count: query.data?.result_count ?? null,
    isLoading: query.isFetching,
    isError: query.isError,
    /** True while the debounce has not caught up with the latest tap. */
    isStale: debouncedFilters !== filters,
  };
}

export function useSearchSoundscapes(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: LIBRARY_QUERY_KEYS.search(trimmed),
    queryFn: () => catalogueApi.search(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    keepPreviousData: true,
  });
}

/** Live dropdown suggestions while typing, before anything is submitted. */
export function useSearchSuggestions(query: string, enabled: boolean) {
  const debounced = useDebounced(query.trim(), SUGGESTION_DEBOUNCE_MS);

  const result = useQuery({
    queryKey: LIBRARY_QUERY_KEYS.suggestions(debounced),
    queryFn: () => catalogueApi.suggestions(debounced),
    enabled: enabled && debounced.length >= MIN_QUERY_LENGTH,
  });

  return { ...result, debouncedQuery: debounced };
}

/**
 * `/api/soundscapes/search` takes only `q` and `/api/library` takes only the
 * structured filters — neither accepts both. When a search and filters are
 * active together the text results are the base set and the filters are
 * re-applied here, over the handful of rows a search returns.
 *
 * This mirrors `filter_soundscapes` as closely as the client can: OR within a
 * group, AND across groups, and Avoid as an absolute exclusion.
 */
export function applyFiltersClientSide(
  soundscapes: Soundscape[],
  filters: LibraryFilters
): Soundscape[] {
  return soundscapes.filter((soundscape) => {
    if (filters.modes.length && !filters.modes.includes(soundscape.mode!)) return false;

    if (filters.detail_levels.length) {
      if (!soundscape.detail_level) return false;
      if (!filters.detail_levels.includes(soundscape.detail_level)) return false;
    }

    if (filters.contains.length && !matchesAny(soundscape.contains, filters.contains)) return false;
    if (filters.animals.length && !matchesAny(soundscape.animals, filters.animals)) return false;
    if (filters.instruments.length && !matchesAny(soundscape.instruments, filters.instruments)) {
      return false;
    }

    // Environment is matched loosely server side, across several text columns.
    if (filters.environments.length && !matchesEnvironment(soundscape, filters.environments)) {
      return false;
    }

    // Avoid is absolute: every avoided term must be declared in the row's
    // `does_not_contain`, exactly as the RPC requires.
    if (filters.avoids.length) {
      const declared = soundscape.does_not_contain ?? [];
      const allDeclared = filters.avoids.every((avoided) =>
        declared.some((value) => includesLoose(value, avoided))
      );
      if (!allDeclared) return false;
    }

    const duration = soundscape.duration_seconds ?? null;
    if (filters.minMinutes !== null) {
      if (duration === null || duration < filters.minMinutes * 60) return false;
    }
    if (filters.maxMinutes !== null) {
      if (duration === null || duration > filters.maxMinutes * 60) return false;
    }

    return true;
  });
}

function includesLoose(haystack: string | null | undefined, needle: string): boolean {
  return (haystack ?? '').toLowerCase().includes(needle.toLowerCase());
}

function matchesAny(values: string[] | null | undefined, wanted: string[]): boolean {
  const list = values ?? [];
  return wanted.some((want) => list.some((value) => includesLoose(value, want)));
}

function matchesEnvironment(soundscape: Soundscape, environments: string[]): boolean {
  const haystacks = [
    soundscape.subcategory,
    soundscape.one_line_description,
    soundscape.perspective,
    soundscape.movement,
    ...(soundscape.contains ?? []),
    ...(soundscape.sound_sources ?? []),
  ];

  return environments.some((environment) =>
    haystacks.some((value) => includesLoose(value, environment))
  );
}

/**
 * Sorting the client-side path. `/api/library` does the ordering when it runs;
 * a text search comes back in relevance order, so only an explicit non-default
 * sort re-orders it.
 */
export function applySortClientSide(soundscapes: Soundscape[], sort: SortValue): Soundscape[] {
  if (sort === 'recommended') return soundscapes;

  const rows = [...soundscapes];
  const detailRank: Record<string, number> = { rich: 3, balanced: 2, minimal: 1 };

  switch (sort) {
    case 'a_z':
      return rows.sort((a, b) => a.title.localeCompare(b.title));
    case 'shortest':
      return rows.sort((a, b) => (a.duration_seconds ?? 0) - (b.duration_seconds ?? 0));
    case 'longest':
      return rows.sort((a, b) => (b.duration_seconds ?? 0) - (a.duration_seconds ?? 0));
    case 'most_played':
      return rows.sort((a, b) => (b.play_count ?? 0) - (a.play_count ?? 0));
    case 'lowest_intensity':
      return rows.sort((a, b) => (a.intensity ?? Infinity) - (b.intensity ?? Infinity));
    case 'highest_detail':
      return rows.sort(
        (a, b) =>
          (detailRank[b.detail_level ?? ''] ?? 0) - (detailRank[a.detail_level ?? ''] ?? 0)
      );
    // `most_saved` and `recently_added` need columns a search row does not
    // carry, so the relevance order is left alone rather than faked.
    default:
      return rows;
  }
}

/**
 * The Library list: search when there is a committed query, structured filters
 * otherwise, and both combined client side when both are active.
 */
export function useLibraryResults(
  committedQuery: string,
  filters: LibraryFilters,
  sort: SortValue,
  hasActiveFilters: boolean
) {
  const isSearching = committedQuery.trim().length >= MIN_QUERY_LENGTH;

  const searchQuery = useSearchSoundscapes(isSearching ? committedQuery : '');
  const libraryQuery = useLibrary(filters, sort, !isSearching);

  const results = useMemo<Soundscape[]>(() => {
    if (isSearching) {
      const base = searchQuery.data ?? [];
      const filtered = hasActiveFilters ? applyFiltersClientSide(base, filters) : base;
      return applySortClientSide(filtered, sort).slice(0, LIBRARY_PAGE_SIZE);
    }

    return (libraryQuery.data?.soundscapes ?? []).slice(0, LIBRARY_PAGE_SIZE);
  }, [filters, hasActiveFilters, isSearching, libraryQuery.data, searchQuery.data, sort]);

  /** The true total before the client side page trim. */
  const totalCount = isSearching
    ? hasActiveFilters
      ? applyFiltersClientSide(searchQuery.data ?? [], filters).length
      : (searchQuery.data ?? []).length
    : libraryQuery.data?.result_count ?? 0;

  const active = isSearching ? searchQuery : libraryQuery;

  return {
    results,
    totalCount,
    isSearching,
    isLoading: active.isInitialLoading,
    isFetching: active.isFetching,
    isError: active.isError,
    refetch: active.refetch,
  };
}
