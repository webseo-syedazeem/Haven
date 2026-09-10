import { apiClient } from './client';

type Envelope<T> = { success: boolean; data: T };

/**
 * `/api/help` returns published articles already grouped by category, each
 * entry trimmed to what a list row needs. The body only comes back from
 * `/api/help/:slug`, so the article screen fetches its own copy.
 */
export type HelpArticleSummary = {
  slug: string;
  title: string;
  sort_order?: number | null;
};

export type HelpCategory = {
  category: string;
  articles: HelpArticleSummary[];
};

export type HelpArticle = {
  id?: string;
  slug: string;
  category: string;
  title: string;
  body: string;
  sort_order?: number | null;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const helpApi = {
  categories: async (): Promise<HelpCategory[]> => {
    const res = await apiClient<Envelope<{ categories: HelpCategory[] }>>('/api/help');
    return (res.data?.categories ?? []).map((entry) => ({
      category: entry.category,
      articles: entry.articles ?? [],
    }));
  },

  article: async (slug: string): Promise<HelpArticle | null> => {
    const res = await apiClient<Envelope<{ article: HelpArticle }>>(
      `/api/help/${encodeURIComponent(slug)}`
    );
    return res.data?.article ?? null;
  },
};

/** `category` is a free-text column; titles come through as-is or snake_cased. */
export function formatHelpCategory(category: string): string {
  const clean = category.replace(/[_-]+/g, ' ').trim();
  if (!clean) return 'Help';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
