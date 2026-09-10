import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { helpApi, type HelpCategory } from '@/lib/api/help';

/**
 * The help centre is public — `/api/help` has no auth middleware — so these
 * queries run whether or not a session has been restored.
 */
export const HELP_QUERY_KEYS = {
  categories: ['help', 'categories'] as const,
  article: (slug: string) => ['help', 'article', slug] as const,
};

export function useHelpArticles() {
  return useQuery({
    queryKey: HELP_QUERY_KEYS.categories,
    queryFn: helpApi.categories,
  });
}

export function useHelpArticle(slug?: string) {
  return useQuery({
    queryKey: HELP_QUERY_KEYS.article(slug ?? ''),
    queryFn: () => helpApi.article(slug!),
    enabled: !!slug,
  });
}

/**
 * Client side search — there is no help search endpoint, and the whole
 * published list arrives in one call, so filtering here is both cheaper and
 * instant. Categories that lose every article are dropped.
 */
export function useFilteredHelpArticles(categories: HelpCategory[] | undefined, query: string) {
  return useMemo(() => {
    const rows = categories ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return rows;

    return rows
      .map((entry) => ({
        ...entry,
        articles: entry.articles.filter(
          (article) =>
            article.title.toLowerCase().includes(term) ||
            article.slug.toLowerCase().includes(term) ||
            entry.category.toLowerCase().includes(term)
        ),
      }))
      .filter((entry) => entry.articles.length > 0);
  }, [categories, query]);
}
