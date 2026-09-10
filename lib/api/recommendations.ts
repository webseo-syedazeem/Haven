import { apiClient } from './client';
import type { Soundscape } from './home';

type Envelope<T> = { success: boolean; data: T };

export const DEFAULT_RECOMMENDATION_ALTERNATIVES = 4;
export const MAX_RECOMMENDATION_ALTERNATIVES = 20;

/** Shape returned by GET /api/recommendations. */
export type Recommendations = {
  best_match: Soundscape | null;
  alternatives: Soundscape[];
};

function assertValidCount(count: number) {
  if (!Number.isInteger(count) || count < 0 || count > MAX_RECOMMENDATION_ALTERNATIVES) {
    throw new RangeError(
      'Recommendation count must be an integer between 0 and 20.'
    );
  }
}

export const recommendationsApi = {
  /**
   * Authentication is optional server-side. During guest onboarding this
   * returns the public popularity-ranked candidates, which the client can then
   * re-rank with locally stored answers.
   */
  get: async (
    count: number = DEFAULT_RECOMMENDATION_ALTERNATIVES
  ): Promise<Recommendations> => {
    assertValidCount(count);

    const res = await apiClient<Envelope<Recommendations>>(
      `/api/recommendations?count=${count}`
    );

    return {
      best_match: res.data?.best_match ?? null,
      alternatives: res.data?.alternatives ?? [],
    };
  },
};
