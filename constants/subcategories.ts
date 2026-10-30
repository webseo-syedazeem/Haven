import type { ModeId } from '@/constants/modes';

/**
 * The approved subcategory list per mode, in the order the mode hub shows them.
 * The API groups `/api/soundscapes/mode/:mode` by the `subcategory` column, so
 * these strings are matched case insensitively against that value; anything the
 * API returns under a name not listed here is appended after these, and any
 * subcategory with no live soundscapes is not rendered at all.
 */
export const MODE_SUBCATEGORIES: Record<ModeId, readonly string[]> = {
  sleep: [
    'Bedtime Soundscapes',
    'All-Night Backgrounds',
    'Return to Sleep',
    'Low-Variation Sound',
    'Outside Noise',
    'Travel',
    'Long-Form Nights',
    'Rain',
    'Indoor Ambience',
  ],
  relax: [
    'After Work',
    'Unwind',
    'Gentle Background',
    'Low-Detail Soundscapes',
    'Comforting Spaces',
    'Nature and Place',
    'Spacious Soundscapes',
    'Short Sessions',
    'Before Bed',
    'Without Music',
    'Gentle Instrumental',
  ],
  focus: [
    'Deep Work',
    'Writing',
    'Reading',
    'Studying',
    'Creative Work',
    'Emails and Administration',
    'Repetitive Tasks',
    'Block Conversations',
    'Focus While Travelling',
    'Focus Without Music',
    'Gentle Instrumental',
  ],
};

export function normalizeSubcategory(value: string): string {
  return value.trim().toLowerCase();
}

/** Title cases an unexpected API subcategory key so it still reads as a heading. */
export function prettifySubcategory(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'uncategorized') return 'More in this mode';

  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
