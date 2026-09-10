/**
 * The selectable filter vocabulary for the Library filter sheet.
 *
 * STOPGAP: the backend has no facets endpoint — `/api/library` accepts filter
 * values but never advertises which ones the catalogue actually holds, and the
 * seed data carries no metadata to read them from. So these lists are curated
 * by hand and can drift from the catalogue. The real fix is a
 * `GET /api/library/facets` returning the distinct values behind each param;
 * when that lands, replace these constants with a query.
 *
 * Every group here maps to a query param `filter_soundscapes` actually reads.
 * Groups the backend has no param for — intensity, perspective, movement,
 * human presence, collection — are deliberately absent rather than faked.
 */

import type { DetailLevel, SoundscapeMode } from '@/lib/api/home';

export type FilterGroupKey =
  | 'contains'
  | 'avoids'
  | 'environments'
  | 'animals'
  | 'instruments'
  | 'detail_levels';

export type FilterGroup = {
  key: FilterGroupKey;
  title: string;
  /** Shown under the title when the rule is not obvious from the name. */
  hint?: string;
  values: readonly string[];
  /** Avoid is an exclusion, so it gets its own treatment in the sheet. */
  isExclusion?: boolean;
  /** Long groups collapse into their own multi-select sub-view. */
  expandable?: boolean;
};

/** Matched against each soundscape's `contains` array (partial, case-insensitive). */
const CONTAINS = [
  'Rain',
  'Waves',
  'Wind',
  'Birds',
  'Thunder',
  'Fire',
  'Stream',
  'Piano',
  'Strings',
  'White Noise',
  'Voices',
] as const;

/** Matched against `does_not_contain`, as an absolute exclusion. */
const AVOIDS = ['Thunder', 'Voices', 'Traffic', 'Music', 'Birds', 'Sudden Sounds'] as const;

/**
 * Environments are matched loosely by the backend — across subcategory,
 * description, perspective, movement, `contains` and `sound_sources` — so these
 * read as places rather than as exact column values.
 */
const ENVIRONMENTS = [
  'Forest',
  'Ocean',
  'Rain',
  'Mountains',
  'City',
  'Indoor',
  'Cabin',
  'Desert',
] as const;

const ANIMALS = ['Birds', 'Owls', 'Frogs', 'Crickets', 'Whales', 'Wolves'] as const;

const INSTRUMENTS = [
  'Piano',
  'Guitar',
  'Harp',
  'Flute',
  'Strings',
  'Cello',
  'Handpan',
  'Singing Bowls',
  'Gong',
  'Drone',
] as const;

/** These must match the `detail_level` column exactly — the backend compares with `=`. */
export const DETAIL_LEVEL_VALUES: readonly DetailLevel[] = ['minimal', 'balanced', 'rich'];

export const DETAIL_LEVEL_LABELS: Record<DetailLevel, string> = {
  minimal: 'Minimal',
  balanced: 'Balanced',
  rich: 'Rich',
};

export const FILTER_GROUPS: readonly FilterGroup[] = [
  {
    key: 'contains',
    title: 'Contains',
    hint: 'Any of these',
    values: CONTAINS,
  },
  {
    key: 'avoids',
    title: 'Avoid',
    hint: 'Never include these',
    values: AVOIDS,
    isExclusion: true,
  },
  {
    key: 'environments',
    title: 'Environment',
    hint: 'Any of these',
    values: ENVIRONMENTS,
  },
  {
    key: 'animals',
    title: 'Animals',
    hint: 'Any of these',
    values: ANIMALS,
    expandable: true,
  },
  {
    key: 'instruments',
    title: 'Instruments',
    hint: 'Any of these',
    values: INSTRUMENTS,
    expandable: true,
  },
  {
    key: 'detail_levels',
    title: 'Detail Level',
    values: DETAIL_LEVEL_VALUES,
  },
];

/** Duration slider bounds, in minutes. Sent to the API in seconds. */
export const DURATION_MIN_MINUTES = 0;
export const DURATION_MAX_MINUTES = 120;
export const DURATION_STEP_MINUTES = 5;

export type SortValue =
  | 'recommended'
  | 'most_played'
  | 'most_saved'
  | 'recently_added'
  | 'a_z'
  | 'shortest'
  | 'longest'
  | 'lowest_intensity'
  | 'highest_detail';

/** Exactly the nine values `LIBRARY_SORTS` accepts; anything else 400s. */
export const SORT_OPTIONS: readonly { value: SortValue; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'most_played', label: 'Most Played' },
  { value: 'most_saved', label: 'Most Saved' },
  { value: 'recently_added', label: 'Recently Added' },
  { value: 'a_z', label: 'A–Z' },
  { value: 'shortest', label: 'Shortest' },
  { value: 'longest', label: 'Longest' },
  { value: 'lowest_intensity', label: 'Lowest Intensity' },
  { value: 'highest_detail', label: 'Highest Detail' },
];

export function getSortLabel(value: SortValue): string {
  return SORT_OPTIONS.find((option) => option.value === value)?.label ?? 'Recommended';
}

/** Everything the Library screen can filter by, as one serialisable object. */
export type LibraryFilters = {
  modes: SoundscapeMode[];
  contains: string[];
  avoids: string[];
  environments: string[];
  animals: string[];
  instruments: string[];
  detail_levels: string[];
  /** Minutes. Null means "no bound", so the param is omitted entirely. */
  minMinutes: number | null;
  maxMinutes: number | null;
};

export const EMPTY_FILTERS: LibraryFilters = {
  modes: [],
  contains: [],
  avoids: [],
  environments: [],
  animals: [],
  instruments: [],
  detail_levels: [],
  minMinutes: null,
  maxMinutes: null,
};

export function countActiveFilters(filters: LibraryFilters): number {
  return (
    filters.modes.length +
    filters.contains.length +
    filters.avoids.length +
    filters.environments.length +
    filters.animals.length +
    filters.instruments.length +
    filters.detail_levels.length +
    (filters.minMinutes === null ? 0 : 1) +
    (filters.maxMinutes === null ? 0 : 1)
  );
}

export function getFilterLabel(group: FilterGroupKey, value: string): string {
  if (group === 'detail_levels') {
    return DETAIL_LEVEL_LABELS[value as DetailLevel] ?? value;
  }
  return value;
}

/** Flattens the active selections into the chip row above the results. */
export type ActiveFilterChip = {
  id: string;
  label: string;
  group: FilterGroupKey | 'modes' | 'duration';
  value: string;
};

export function toActiveChips(filters: LibraryFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  for (const mode of filters.modes) {
    chips.push({ id: `modes:${mode}`, label: capitalise(mode), group: 'modes', value: mode });
  }

  const groups: FilterGroupKey[] = [
    'contains',
    'avoids',
    'environments',
    'animals',
    'instruments',
    'detail_levels',
  ];

  for (const group of groups) {
    for (const value of filters[group]) {
      chips.push({
        id: `${group}:${value}`,
        label: group === 'avoids' ? `No ${value}` : getFilterLabel(group, value),
        group,
        value,
      });
    }
  }

  if (filters.minMinutes !== null || filters.maxMinutes !== null) {
    const min = filters.minMinutes ?? DURATION_MIN_MINUTES;
    const max = filters.maxMinutes ?? DURATION_MAX_MINUTES;
    chips.push({
      id: 'duration',
      label: `${min}–${max} min`,
      group: 'duration',
      value: 'duration',
    });
  }

  return chips;
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * The values behind one filter group, so screens outside the Library sheet can
 * offer the same vocabulary rather than curating a second list that drifts.
 * Sound Preferences and Sounds to Avoid both read through here.
 */
export function getFilterGroupValues(key: FilterGroupKey): readonly string[] {
  return FILTER_GROUPS.find((group) => group.key === key)?.values ?? [];
}

/**
 * "Typical session length" for the sound preferences screen. `typical_duration`
 * is a free-text column server side, so the stored value is the minute count as
 * a string and the label is presentation only.
 */
export const TYPICAL_DURATION_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2+ hours' },
];

/** O11 choices from the onboarding reference, kept here beside the saved vocabulary. */
const ONBOARDING_DURATION_VALUES = ['15', '30', '45', '60', '120'] as const;
export const ONBOARDING_DURATION_OPTIONS = TYPICAL_DURATION_OPTIONS.filter((option) =>
  ONBOARDING_DURATION_VALUES.some((value) => value === option.value)
);

export function getTypicalDurationLabel(value?: string | null): string {
  if (!value) return 'Not set';
  return TYPICAL_DURATION_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
