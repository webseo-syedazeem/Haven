import { useQuery } from '@tanstack/react-query';

import { catalogueApi, type ExploreGroupKey } from '@/lib/api/catalogue';

export const EXPLORE_QUERY_KEYS = {
  groups: ['explore', 'groups'] as const,
  collections: ['explore', 'collections'] as const,
  collection: (id: string) => ['collection', id] as const,
};

/** Headings for the eight `explore_group` values the API can return. */
export const EXPLORE_GROUP_TITLES: Record<ExploreGroupKey, string> = {
  situation: 'Explore by Situation',
  editorial: 'Editorial Collections',
  nature: 'Nature',
  indoor: 'Indoor',
  travel: 'Travel',
  animals: 'Animals',
  instruments: 'Instruments',
  weather: 'Weather',
};

export function useExploreGroups() {
  return useQuery({
    queryKey: EXPLORE_QUERY_KEYS.groups,
    queryFn: catalogueApi.explore,
  });
}

export function useAllCollections() {
  return useQuery({
    queryKey: EXPLORE_QUERY_KEYS.collections,
    queryFn: catalogueApi.collections,
  });
}

export function useCollection(id?: string) {
  return useQuery({
    queryKey: EXPLORE_QUERY_KEYS.collection(id ?? ''),
    queryFn: () => catalogueApi.collection(id!),
    enabled: !!id,
  });
}
