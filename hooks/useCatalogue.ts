import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { MODE_SUBCATEGORIES, normalizeSubcategory, prettifySubcategory } from '@/constants/subcategories';
import type { ModeId } from '@/constants/modes';
import { catalogueApi } from '@/lib/api/catalogue';
import type { Soundscape } from '@/lib/api/home';

export const CATALOGUE_QUERY_KEYS = {
  byMode: (mode: string) => ['soundscapes', 'mode', mode] as const,
  similar: (id: string) => ['soundscapes', 'similar', id] as const,
};

export type SubcategorySection = {
  key: string;
  title: string;
  items: Soundscape[];
};

export function useSoundscapesByMode(mode?: ModeId) {
  return useQuery({
    queryKey: CATALOGUE_QUERY_KEYS.byMode(mode ?? ''),
    queryFn: () => catalogueApi.byMode(mode!),
    enabled: !!mode,
  });
}

/**
 * Orders the API's subcategory groups by the approved list for the mode, drops
 * anything empty, and appends groups the API returned that the list does not
 * name yet, so a new subcategory is never silently hidden.
 */
export function useModeSections(mode?: ModeId) {
  const query = useSoundscapesByMode(mode);

  const sections = useMemo<SubcategorySection[]>(() => {
    const grouped = query.data?.soundscapes;
    if (!grouped || !mode) return [];

    const byNormalizedKey = new Map<string, { key: string; items: Soundscape[] }>();
    for (const [key, items] of Object.entries(grouped)) {
      if (!Array.isArray(items) || items.length === 0) continue;
      byNormalizedKey.set(normalizeSubcategory(key), { key, items });
    }

    const ordered: SubcategorySection[] = [];
    const used = new Set<string>();

    for (const title of MODE_SUBCATEGORIES[mode] ?? []) {
      const normalized = normalizeSubcategory(title);
      const match = byNormalizedKey.get(normalized);
      if (!match) continue;

      used.add(normalized);
      ordered.push({ key: match.key, title, items: match.items });
    }

    for (const [normalized, match] of byNormalizedKey) {
      if (used.has(normalized)) continue;
      ordered.push({ key: match.key, title: prettifySubcategory(match.key), items: match.items });
    }

    return ordered;
  }, [mode, query.data]);

  const totalCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.items.length, 0),
    [sections]
  );

  return {
    sections,
    totalCount,
    isLoading: query.isInitialLoading,
    isError: query.isError,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

export function useSimilarSoundscapes(soundscapeId?: string) {
  return useQuery({
    queryKey: CATALOGUE_QUERY_KEYS.similar(soundscapeId ?? ''),
    queryFn: () => catalogueApi.similar(soundscapeId!),
    enabled: !!soundscapeId,
  });
}
