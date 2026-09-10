import type { ModeId } from '@/constants/modes';
import type { ImportGuestDataPayload, ImportGuestDataResult } from '@/lib/api/account';
import { apiClient } from '@/lib/api/client';
import { accountApi } from '@/lib/api/account';
import type { Soundscape } from '@/lib/api/home';
import type { DetailPreference, SoundPreferences } from '@/lib/api/preferences';
import { preferencesApi } from '@/lib/api/preferences';
import {
  DEFAULT_RECOMMENDATION_ALTERNATIVES,
  MAX_RECOMMENDATION_ALTERNATIVES,
  recommendationsApi,
  type Recommendations,
} from '@/lib/api/recommendations';
import {
  getLocalSetting,
  setLocalSettingStrict as setLocalSetting,
} from '@/lib/local-settings';
import { hasActiveSession } from '@/lib/auth/session-state';
import { queryClient } from '@/lib/query-client';

/**
 * Device-local answers collected before an account exists.
 *
 * Situation remains an array locally because O7 is multi-select. The current
 * backend schema has one nullable text column, so migration joins the selected
 * labels into one human-readable string.
 */
export type GuestOnboardingAnswers = {
  goals: string[];
  startingMode: ModeId | null;
  situation: string[];
  environments: string[];
  preferredSounds: string[];
  excludedSounds: string[];
  detailPreference: DetailPreference | null;
  /** Minute count as a string, matching sound_preferences.typical_duration. */
  sessionLength: string | null;
};

export type GuestOnboardingAnswersPatch = Partial<GuestOnboardingAnswers>;

export type GuestOnboardingStatus = {
  completed: boolean;
  pendingAuth: boolean;
  migrated: boolean;
};

export const DEFAULT_GUEST_ONBOARDING_ANSWERS: GuestOnboardingAnswers = {
  goals: [],
  startingMode: null,
  situation: [],
  environments: [],
  preferredSounds: [],
  excludedSounds: [],
  detailPreference: null,
  sessionLength: null,
};

export const GUEST_RECOMMENDATIONS_QUERY_KEY = [
  'onboarding',
  'guest-recommendations',
] as const;

let authenticatedOnboardingAnswers: GuestOnboardingAnswers = DEFAULT_GUEST_ONBOARDING_ANSWERS;
let authenticatedOnboardingCompletedThisSession = false;

type OnboardingSaveResponse = {
  onboarding: Record<string, unknown>;
  preferences: Record<string, unknown> | null;
};

function definedPatch(patch: GuestOnboardingAnswersPatch): GuestOnboardingAnswersPatch {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as GuestOnboardingAnswersPatch;
}

function toSoundPreferencePatch(
  patch: GuestOnboardingAnswersPatch,
  next: GuestOnboardingAnswers
): Partial<SoundPreferences> {
  const soundPatch: Partial<SoundPreferences> = {};

  if (patch.environments !== undefined) {
    soundPatch.preferred_environments = next.environments;
  }
  if (patch.preferredSounds !== undefined) {
    soundPatch.preferred_sounds = next.preferredSounds;
  }
  if (patch.excludedSounds !== undefined) {
    soundPatch.excluded_sounds = next.excludedSounds;
  }
  if (patch.detailPreference !== undefined) {
    soundPatch.detail_preference = next.detailPreference;
  }
  if (patch.sessionLength !== undefined) {
    soundPatch.typical_duration = next.sessionLength;
  }

  return soundPatch;
}

function toOnboardingSavePayload(answers: GuestOnboardingAnswers) {
  if (!answers.startingMode) {
    throw new Error('Onboarding requires a starting mode before saving.');
  }

  return {
    goals: answers.goals,
    starting_mode: answers.startingMode,
    situation: answers.situation.length ? answers.situation.join('; ') : null,
    preferred_environments: answers.environments,
    preferred_sounds: answers.preferredSounds,
    excluded_sounds: answers.excludedSounds,
    ...(answers.detailPreference ? { detail_preference: answers.detailPreference } : {}),
    typical_duration: answers.sessionLength,
  };
}

/** Guest/offline fallback keys. Authenticated completion lives on the server profile. */
export const GUEST_ONBOARDING_STORAGE_KEYS = {
  answers: 'onboarding.answers.v1',
  completed: 'onboarding.completed',
  pendingAuth: 'onboarding.pending_auth',
  migrated: 'onboarding.migrated',
} as const;

const MODES: readonly ModeId[] = ['sleep', 'relax', 'focus'];
const DETAIL_PREFERENCES: readonly DetailPreference[] = ['minimal', 'balanced', 'rich'];
const MAX_GOALS = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const cleaned = item.trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim() || null;
}

function normaliseAnswers(value: unknown): GuestOnboardingAnswers {
  const row = isRecord(value) ? value : {};
  const startingMode = MODES.includes(row.startingMode as ModeId)
    ? (row.startingMode as ModeId)
    : null;
  const detailPreference = DETAIL_PREFERENCES.includes(
    row.detailPreference as DetailPreference
  )
    ? (row.detailPreference as DetailPreference)
    : null;

  return {
    goals: cleanStringList(row.goals).slice(0, MAX_GOALS),
    startingMode,
    situation: cleanStringList(row.situation),
    environments: cleanStringList(row.environments),
    preferredSounds: cleanStringList(row.preferredSounds),
    excludedSounds: cleanStringList(row.excludedSounds).filter(
      (item) => item.toLowerCase() !== 'none'
    ),
    detailPreference,
    sessionLength: cleanOptionalString(row.sessionLength),
  };
}

export async function getGuestOnboardingAnswers(): Promise<GuestOnboardingAnswers> {
  const stored = await getLocalSetting<unknown>(
    GUEST_ONBOARDING_STORAGE_KEYS.answers,
    DEFAULT_GUEST_ONBOARDING_ANSWERS
  );
  return normaliseAnswers(stored);
}

/** Required O5-O11 answers, with an empty exclusion list representing None. */
export function isGuestOnboardingReady(
  answers: GuestOnboardingAnswers
): boolean {
  return (
    answers.goals.length >= 1 &&
    answers.goals.length <= MAX_GOALS &&
    answers.startingMode !== null &&
    answers.situation.length >= 1 &&
    answers.environments.length >= 1 &&
    answers.preferredSounds.length >= 1 &&
    answers.detailPreference !== null &&
    answers.sessionLength !== null
  );
}

/**
 * Persists a partial step immediately. Undefined properties are ignored so a
 * screen can pass optional form state without clearing earlier answers.
 */
export async function saveGuestOnboardingAnswers(
  patch: GuestOnboardingAnswersPatch
): Promise<GuestOnboardingAnswers> {
  const current = await getGuestOnboardingAnswers();
  const merged: Record<string, unknown> = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) merged[key] = value;
  }

  const next = normaliseAnswers(merged);
  await setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.answers, next);
  return next;
}

export async function getOnboardingAnswers(): Promise<GuestOnboardingAnswers> {
  if (!hasActiveSession()) return getGuestOnboardingAnswers();
  return authenticatedOnboardingAnswers;
}

export async function saveOnboardingAnswers(
  patch: GuestOnboardingAnswersPatch
): Promise<GuestOnboardingAnswers> {
  if (!hasActiveSession()) return saveGuestOnboardingAnswers(patch);

  const cleanPatch = definedPatch(patch);
  const next = normaliseAnswers({ ...authenticatedOnboardingAnswers, ...cleanPatch });
  const soundPatch = toSoundPreferencePatch(cleanPatch, next);

  if (Object.keys(soundPatch).length > 0) {
    await preferencesApi.updateSound(soundPatch);
  }

  authenticatedOnboardingAnswers = next;
  authenticatedOnboardingCompletedThisSession = false;
  return next;
}

export async function completeOnboardingAnswers(): Promise<void> {
  if (!hasActiveSession()) {
    await markGuestOnboardingComplete();
    return;
  }

  const answers = authenticatedOnboardingAnswers;
  if (!isGuestOnboardingReady(answers)) {
    throw new Error('Complete each personalisation step before finishing onboarding.');
  }

  await apiClient<{ success: boolean; data: OnboardingSaveResponse }>('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(toOnboardingSavePayload(answers)),
  });
  authenticatedOnboardingCompletedThisSession = true;

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['me'], refetchType: 'none' }),
    queryClient.invalidateQueries({ queryKey: ['preferences', 'sound'], refetchType: 'none' }),
    queryClient.invalidateQueries({ queryKey: ['home', 'recommended'], refetchType: 'none' }),
    queryClient.invalidateQueries({ queryKey: ['library'], refetchType: 'none' }),
  ]).catch(() => undefined);
}

export async function finishOnboardingForAppEntry(): Promise<void> {
  if (!hasActiveSession()) {
    await markGuestOnboardingComplete();
    return;
  }

  if (!authenticatedOnboardingCompletedThisSession) {
    await completeOnboardingAnswers();
  }
}

export async function isGuestOnboardingComplete(): Promise<boolean> {
  const stored =
    (await getLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.completed, false)) === true;
  if (!stored) return false;
  return isGuestOnboardingReady(await getGuestOnboardingAnswers());
}

export async function setGuestOnboardingComplete(completed: boolean): Promise<void> {
  await setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.completed, completed);
}

export async function isGuestOnboardingPendingAuth(): Promise<boolean> {
  return (
    (await getLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.pendingAuth, false)) === true
  );
}

export async function setGuestOnboardingPendingAuth(pending: boolean): Promise<void> {
  await setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.pendingAuth, pending);
}

export async function hasMigratedGuestOnboarding(): Promise<boolean> {
  return (
    (await getLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.migrated, false)) === true
  );
}

export async function getGuestOnboardingStatus(): Promise<GuestOnboardingStatus> {
  const [completed, pendingAuth, migrated] = await Promise.all([
    isGuestOnboardingComplete(),
    isGuestOnboardingPendingAuth(),
    hasMigratedGuestOnboarding(),
  ]);
  return { completed, pendingAuth, migrated };
}

/**
 * Called once the guest reaches the end of onboarding. A later successful
 * account authentication can consume the pending migration.
 */
export async function markGuestOnboardingComplete(): Promise<void> {
  const answers = await getGuestOnboardingAnswers();
  if (!isGuestOnboardingReady(answers)) {
    throw new Error(
      'Complete each personalisation step before finishing onboarding.'
    );
  }

  await Promise.all([
    setGuestOnboardingComplete(true),
    setGuestOnboardingPendingAuth(true),
    setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.migrated, false),
  ]);
}

/** Clears local progress, for an explicit restart rather than normal sign-out. */
export async function resetGuestOnboardingState(): Promise<void> {
  await Promise.all([
    setLocalSetting(
      GUEST_ONBOARDING_STORAGE_KEYS.answers,
      DEFAULT_GUEST_ONBOARDING_ANSWERS
    ),
    setGuestOnboardingComplete(false),
    setGuestOnboardingPendingAuth(false),
    setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.migrated, false),
  ]);
}

function lower(value: string): string {
  return value.trim().toLowerCase();
}

function stringValues(value: string[] | null | undefined): string[] {
  return (value ?? []).filter((item): item is string => typeof item === 'string');
}

function exclusionValues(soundscape: Soundscape): string[] {
  return [
    ...stringValues(soundscape.contains),
    ...stringValues(soundscape.animals),
    ...stringValues(soundscape.instruments),
    ...stringValues(soundscape.sound_sources),
  ].map(lower);
}

export function isGuestRecommendationExcluded(
  soundscape: Soundscape,
  answers: GuestOnboardingAnswers
): boolean {
  const values = exclusionValues(soundscape);

  return answers.excludedSounds.some((answer) => {
    const excluded = lower(answer);
    return values.some(
      (value) => value.includes(excluded) || excluded.includes(value)
    );
  });
}

function searchableValues(soundscape: Soundscape): string[] {
  return [
    soundscape.title,
    soundscape.short_title,
    soundscape.subcategory,
    soundscape.one_line_description,
    soundscape.designed_for,
    soundscape.best_use,
    soundscape.perspective,
    soundscape.movement,
    ...stringValues(soundscape.contains),
    ...stringValues(soundscape.animals),
    ...stringValues(soundscape.instruments),
    ...stringValues(soundscape.sound_sources),
  ]
    .filter((value): value is string => typeof value === 'string')
    .map(lower);
}

function countLooseMatches(needles: string[], haystack: string[]): number {
  let matches = 0;

  for (const rawNeedle of needles) {
    const needle = lower(rawNeedle);
    if (
      needle &&
      haystack.some(
        (value) => value.includes(needle) || needle.includes(value)
      )
    ) {
      matches += 1;
    }
  }

  return matches;
}

function extractMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

const MODE_GOAL_KEYWORDS: Record<ModeId, readonly string[]> = {
  sleep: ['sleep'],
  relax: ['relax', 'calm', 'stress', 'anxiety', 'unwind'],
  focus: ['focus', 'concentrat', 'productiv', 'study', 'work'],
};

function freeTextMatchScore(signals: string[], haystack: string[]): number {
  const tokens = new Set(
    signals
      .flatMap((signal) => lower(signal).split(/[^a-z0-9]+/))
      .filter((token) => token.length >= 4)
  );

  let matches = 0;
  for (const token of tokens) {
    if (haystack.some((value) => value.includes(token))) matches += 1;
  }
  return Math.min(matches, 2);
}

/** Scores one public candidate using only answers stored on this device. */
export function scoreGuestRecommendation(
  soundscape: Soundscape,
  answers: GuestOnboardingAnswers
): number {
  const haystack = searchableValues(soundscape);
  let score = 0;

  if (answers.startingMode && soundscape.mode === answers.startingMode) score += 3;
  if (
    answers.detailPreference &&
    soundscape.detail_level === answers.detailPreference
  ) {
    score += 2;
  }

  score += Math.min(
    countLooseMatches(
      answers.preferredSounds,
      [
        ...stringValues(soundscape.contains),
        ...stringValues(soundscape.sound_sources),
      ].map(lower)
    ),
    6
  );
  score += Math.min(countLooseMatches(answers.environments, haystack) * 2, 4);
  score += freeTextMatchScore(answers.situation, haystack);

  const typicalMinutes = extractMinutes(answers.sessionLength);
  if (typicalMinutes !== null && typeof soundscape.duration_seconds === 'number') {
    const difference = Math.abs(typicalMinutes - soundscape.duration_seconds / 60);
    if (difference <= 5) score += 2;
    else if (difference <= 15) score += 1;
  }

  if (soundscape.mode) {
    const keywords = MODE_GOAL_KEYWORDS[soundscape.mode] ?? [];
    if (
      answers.goals.some((goal) =>
        keywords.some((keyword) => lower(goal).includes(keyword))
      )
    ) {
      score += 1;
    }
  }

  return score;
}

/**
 * Hard exclusions are applied first. Equal scores retain the public endpoint's
 * popularity order, giving guests a deterministic fallback when signals are
 * sparse.
 */
export function rankGuestRecommendations(
  candidates: Soundscape[],
  answers: GuestOnboardingAnswers
): Soundscape[] {
  const seen = new Set<string>();

  return candidates
    .filter((candidate) => {
      if (!candidate.id || !candidate.file_url?.trim() || seen.has(candidate.id)) return false;
      seen.add(candidate.id);
      return !isGuestRecommendationExcluded(candidate, answers);
    })
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreGuestRecommendation(candidate, answers),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ candidate }) => candidate);
}

function assertAlternativesCount(count: number) {
  if (
    !Number.isInteger(count) ||
    count < 0 ||
    count > MAX_RECOMMENDATION_ALTERNATIVES
  ) {
    throw new RangeError('Alternatives count must be an integer between 0 and 20.');
  }
}

export function rankPublicRecommendations(
  publicRecommendations: Recommendations,
  answers: GuestOnboardingAnswers,
  alternativesCount: number = DEFAULT_RECOMMENDATION_ALTERNATIVES
): Recommendations {
  assertAlternativesCount(alternativesCount);
  const candidates = [
    ...(publicRecommendations.best_match
      ? [publicRecommendations.best_match]
      : []),
    ...publicRecommendations.alternatives,
  ];
  const ranked = rankGuestRecommendations(candidates, answers);

  return {
    best_match: ranked[0] ?? null,
    alternatives: ranked.slice(1, 1 + alternativesCount),
  };
}

/**
 * Loads the widest public candidate set allowed by the endpoint, then applies
 * the guest's device-local answers without requiring an auth token.
 */
export async function getGuestRecommendations(
  answers?: GuestOnboardingAnswers,
  alternativesCount: number = DEFAULT_RECOMMENDATION_ALTERNATIVES
): Promise<Recommendations> {
  assertAlternativesCount(alternativesCount);
  const [storedAnswers, publicRecommendations] = await Promise.all([
    answers ? Promise.resolve(normaliseAnswers(answers)) : getGuestOnboardingAnswers(),
    recommendationsApi.get(MAX_RECOMMENDATION_ALTERNATIVES),
  ]);

  return rankPublicRecommendations(
    publicRecommendations,
    storedAnswers,
    alternativesCount
  );
}

export function getOnboardingRecommendationsQueryKey() {
  return [
    'onboarding',
    hasActiveSession() ? 'authenticated-recommendations' : 'guest-recommendations',
  ] as const;
}

export async function getOnboardingRecommendations(
  alternativesCount: number = DEFAULT_RECOMMENDATION_ALTERNATIVES
): Promise<Recommendations> {
  if (hasActiveSession()) {
    return recommendationsApi.get(alternativesCount);
  }

  return getGuestRecommendations(undefined, alternativesCount);
}

/** Maps camelCase local answers to only fields accepted by the import controller. */
export function toImportGuestDataPayload(
  answers: GuestOnboardingAnswers
): ImportGuestDataPayload {
  const value = normaliseAnswers(answers);

  if (value.goals.length < 1 || value.goals.length > MAX_GOALS) {
    throw new Error('Onboarding requires between one and five goals before migration.');
  }
  if (!value.startingMode) {
    throw new Error('Onboarding requires a starting mode before migration.');
  }

  return {
    goals: value.goals,
    starting_mode: value.startingMode,
    situation: value.situation.length ? value.situation.join('; ') : null,
    sound_preferences: {
      preferred_environments: value.environments,
      preferred_sounds: value.preferredSounds,
      excluded_sounds: value.excludedSounds,
      ...(value.detailPreference
        ? { detail_preference: value.detailPreference }
        : {}),
      typical_duration: value.sessionLength,
    },
  };
}

let migrationInFlight: Promise<ImportGuestDataResult | null> | null = null;

async function performGuestOnboardingMigration(): Promise<ImportGuestDataResult | null> {
  const status = await getGuestOnboardingStatus();

  if (!status.completed || !status.pendingAuth || status.migrated) return null;

  const answers = await getGuestOnboardingAnswers();
  const result = await accountApi.importGuestData(
    toImportGuestDataPayload(answers)
  );

  // Keep both flags untouched if the authenticated request throws. Once the
  // server accepts it, the account is authoritative even if this device can no
  // longer update its local bookkeeping.
  try {
    await setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.migrated, true);
    await setGuestOnboardingPendingAuth(false);
  } catch (error) {
    console.warn('[onboarding] imported, but local migration status was not saved', error);
  }
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['preferences', 'sound'],
      refetchType: 'none',
    }),
    queryClient.invalidateQueries({
      queryKey: ['home', 'recommended'],
      refetchType: 'none',
    }),
    queryClient.invalidateQueries({
      queryKey: ['library'],
      refetchType: 'none',
    }),
  ]).catch(() => undefined);
  return result;
}

/**
 * Safe to call after every sign-in method. Concurrent callers share one
 * request, completed migrations no-op, and failed requests remain pending.
 */
export async function migrateGuestOnboardingAfterAuth(): Promise<ImportGuestDataResult | null> {
  if (migrationInFlight) return migrationInFlight;

  const migration = performGuestOnboardingMigration();
  migrationInFlight = migration;

  try {
    return await migration;
  } finally {
    if (migrationInFlight === migration) migrationInFlight = null;
  }
}
