import type { ModeId } from '@/constants/modes';
import { DURATION_STEP_ENABLED } from '@/constants/onboarding';
import type { ImportGuestDataPayload, ImportGuestDataResult } from '@/lib/api/account';
import { apiClient } from '@/lib/api/client';
import { accountApi } from '@/lib/api/account';
import type { Soundscape } from '@/lib/api/home';
import type { DetailPreference } from '@/lib/api/preferences';
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
 * Durable, device-local onboarding answers. The snake_case fields are the
 * canonical values and intentionally match POST /api/onboarding. The legacy
 * camelCase aliases remain temporarily so older, non-current onboarding
 * screens and guest recommendation code can read previously stored progress.
 */
export type GuestOnboardingAnswers = {
  mode: ModeId | null;
  mode_breakers: string[];
  mode_areas: string[];
  target_minutes: number | null;
  main_goal: string | null;
  relax_causes: string[];
  calming_moments: string | null;
  /** @deprecated Legacy goal answers retained for old local data only. */
  goals: string[];
  /** @deprecated Compatibility alias for mode. */
  startingMode: ModeId | null;
  /** @deprecated Compatibility alias for main_goal. */
  mainGoal: string | null;
  /** @deprecated Compatibility alias for relax_causes. */
  relaxCauses: string[];
  /** @deprecated Compatibility alias for calming_moments. */
  calmingMoments: string | null;
  /** @deprecated Compatibility alias for mode_breakers. */
  situation: string[];
  /** @deprecated Compatibility alias for mode_areas. */
  environments: string[];
  preferredSounds: string[];
  excludedSounds: string[];
  detailPreference: DetailPreference | null;
  /** Minute count as a string, matching sound_preferences.typical_duration. */
  sessionLength: string | null;
};

export type GuestOnboardingAnswersPatch = Partial<GuestOnboardingAnswers>;

export type OnboardingAnswersPayload = Pick<
  GuestOnboardingAnswers,
  | 'mode'
  | 'mode_breakers'
  | 'mode_areas'
  | 'target_minutes'
  | 'main_goal'
  | 'relax_causes'
  | 'calming_moments'
>;

export type ModeScopedOnboardingPayload =
  | {
      mode: 'focus' | 'sleep';
      mode_breakers: string[];
      mode_areas: string[];
      // Optional: not sent when DURATION_STEP_ENABLED is false (no 1-hour variant yet).
      target_minutes?: number;
    }
  | {
      mode: 'relax';
      main_goal: string;
      relax_causes: string[];
      calming_moments: string;
    };

export type GuestOnboardingStatus = {
  completed: boolean;
  pendingAuth: boolean;
  migrated: boolean;
};

export type IncompleteOnboardingRoute =
  | '/select-focus'
  | '/onboarding/situation'
  | '/onboarding/personalise'
  | '/onboarding/relax-main-goal'
  | '/onboarding/relax-causes'
  | '/onboarding/relax-calming-moments';

export type OnboardingResumeRoute =
  | '/why-passage'
  | IncompleteOnboardingRoute
  | '/backed-by-science'
  | '/onboarding/relax-ritual';

export const DEFAULT_GUEST_ONBOARDING_ANSWERS: GuestOnboardingAnswers = {
  mode: null,
  mode_breakers: [],
  mode_areas: [],
  target_minutes: null,
  main_goal: null,
  relax_causes: [],
  calming_moments: null,
  goals: [],
  startingMode: null,
  mainGoal: null,
  relaxCauses: [],
  calmingMoments: null,
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

function canonicalPatch(
  patch: GuestOnboardingAnswersPatch
): GuestOnboardingAnswersPatch {
  const next = definedPatch(patch);

  if (next.mode === undefined && next.startingMode !== undefined) {
    next.mode = next.startingMode;
  }
  if (next.mode_breakers === undefined && next.situation !== undefined) {
    next.mode_breakers = next.situation;
  }
  if (next.mode_areas === undefined && next.environments !== undefined) {
    next.mode_areas = next.environments;
  }
  if (next.target_minutes === undefined && next.sessionLength !== undefined) {
    next.target_minutes = cleanPositiveInteger(next.sessionLength);
  }
  if (next.main_goal === undefined && next.mainGoal !== undefined) {
    next.main_goal = next.mainGoal;
  }
  if (next.relax_causes === undefined && next.relaxCauses !== undefined) {
    next.relax_causes = next.relaxCauses;
  }
  if (next.calming_moments === undefined && next.calmingMoments !== undefined) {
    next.calming_moments = next.calmingMoments;
  }

  return next;
}

function toStoredAnswers(answers: GuestOnboardingAnswers): OnboardingAnswersPayload {
  return {
    mode: answers.mode,
    mode_breakers: answers.mode_breakers,
    mode_areas: answers.mode_areas,
    target_minutes: answers.target_minutes,
    main_goal: answers.main_goal,
    relax_causes: answers.relax_causes,
    calming_moments: answers.calming_moments,
  };
}

export function toModeScopedOnboardingPayload(
  answers: GuestOnboardingAnswers
): ModeScopedOnboardingPayload {
  const value = normaliseAnswers(answers);
  if (!isGuestOnboardingReady(value) || !value.mode) {
    throw new Error('Complete each personalisation step before finishing onboarding.');
  }

  if (value.mode === 'relax') {
    return {
      mode: value.mode,
      main_goal: value.main_goal!,
      relax_causes: value.relax_causes,
      calming_moments: value.calming_moments!,
    };
  }

  return {
    mode: value.mode,
    mode_breakers: value.mode_breakers,
    mode_areas: value.mode_areas,
    ...(value.target_minutes !== null ? { target_minutes: value.target_minutes } : {}),
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

function cleanPositiveInteger(value: unknown): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function hasOwn(row: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(row, key);
}

function normaliseAnswers(value: unknown): GuestOnboardingAnswers {
  const row = isRecord(value) ? value : {};
  const rawMode = hasOwn(row, 'mode') ? row.mode : row.startingMode;
  const mode = MODES.includes(rawMode as ModeId)
    ? (rawMode as ModeId)
    : null;
  const legacyGoals = cleanStringList(row.goals).slice(0, 5);
  const modeBreakers = hasOwn(row, 'mode_breakers')
    ? cleanStringList(row.mode_breakers)
    : cleanStringList(row.situation);
  const modeAreas = hasOwn(row, 'mode_areas')
    ? cleanStringList(row.mode_areas)
    : cleanStringList(row.environments);
  const targetMinutes = hasOwn(row, 'target_minutes')
    ? cleanPositiveInteger(row.target_minutes)
    : cleanPositiveInteger(row.sessionLength);
  const mainGoal = hasOwn(row, 'main_goal')
    ? cleanOptionalString(row.main_goal)
    : cleanOptionalString(row.mainGoal);
  const relaxCauses = hasOwn(row, 'relax_causes')
    ? cleanStringList(row.relax_causes)
    : cleanStringList(row.relaxCauses);
  const calmingMoments = hasOwn(row, 'calming_moments')
    ? cleanOptionalString(row.calming_moments)
    : cleanOptionalString(row.calmingMoments);
  const detailPreference = DETAIL_PREFERENCES.includes(
    row.detailPreference as DetailPreference
  )
    ? (row.detailPreference as DetailPreference)
    : null;

  return {
    mode,
    mode_breakers: modeBreakers,
    mode_areas: modeAreas,
    target_minutes: targetMinutes,
    main_goal: mainGoal,
    relax_causes: relaxCauses,
    calming_moments: calmingMoments,
    goals: legacyGoals,
    startingMode: mode,
    mainGoal,
    relaxCauses,
    calmingMoments,
    situation: modeBreakers,
    environments: modeAreas,
    preferredSounds: cleanStringList(row.preferredSounds).length
      ? cleanStringList(row.preferredSounds)
      : modeAreas,
    excludedSounds: cleanStringList(row.excludedSounds).filter(
      (item) => item.toLowerCase() !== 'none'
    ),
    detailPreference,
    sessionLength: targetMinutes === null ? null : String(targetMinutes),
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
  return getIncompleteOnboardingRoute(answers) === null;
}

/** True when this device has at least one persisted data-collection answer. */
export function hasOnboardingProgress(answers: GuestOnboardingAnswers): boolean {
  const value = normaliseAnswers(answers);
  return Boolean(
    value.mode ||
      value.mode_breakers.length ||
      value.mode_areas.length ||
      value.target_minutes !== null ||
      value.main_goal ||
      value.relax_causes.length ||
      value.calming_moments
  );
}

/**
 * Returns the next screen in the real data-collection order. The first two
 * answers begin with mode; after that each mode follows its own branch.
 * Informational screens are not persisted, so a complete answer set resumes
 * at the first screen immediately after that branch's final question.
 */
export function getOnboardingResumeRoute(
  answers: GuestOnboardingAnswers
): OnboardingResumeRoute {
  const value = normaliseAnswers(answers);

  if (!hasOnboardingProgress(value)) return '/why-passage';
  if (!value.mode) return '/select-focus';

  if (value.mode === 'relax') {
    if (!value.main_goal) return '/onboarding/relax-main-goal';
    if (value.relax_causes.length === 0) return '/onboarding/relax-causes';
    if (!value.calming_moments) return '/onboarding/relax-calming-moments';
    return '/onboarding/relax-ritual';
  }

  if (value.mode_breakers.length === 0) return '/onboarding/situation';
  if (value.mode_areas.length === 0 || (DURATION_STEP_ENABLED && value.target_minutes === null)) {
    return '/onboarding/personalise';
  }
  return '/backed-by-science';
}

export function getIncompleteOnboardingRoute(
  answers: GuestOnboardingAnswers
): IncompleteOnboardingRoute | null {
  if (!answers.mode) return '/select-focus';

  if (answers.mode === 'relax') {
    if (!answers.main_goal) return '/onboarding/relax-main-goal';
    if (answers.relax_causes.length === 0) return '/onboarding/relax-causes';
    if (!answers.calming_moments) return '/onboarding/relax-calming-moments';
    return null;
  }

  if (answers.mode_breakers.length === 0) return '/onboarding/situation';
  if (answers.mode_areas.length === 0 || (DURATION_STEP_ENABLED && answers.target_minutes === null)) {
    return '/onboarding/personalise';
  }
  return null;
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
  const cleanPatch = canonicalPatch(patch);

  if (
    cleanPatch.mode &&
    current.mode &&
    cleanPatch.mode !== current.mode
  ) {
    if (current.mode === 'relax') {
      merged.main_goal = null;
      merged.relax_causes = [];
      merged.calming_moments = null;
    } else {
      merged.mode_breakers = [];
      merged.mode_areas = [];
      merged.target_minutes = null;
    }
  }

  for (const [key, value] of Object.entries(cleanPatch)) {
    if (value !== undefined) merged[key] = value;
  }

  const next = normaliseAnswers(merged);
  await setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.answers, toStoredAnswers(next));
  return next;
}

export async function getOnboardingAnswers(): Promise<GuestOnboardingAnswers> {
  const stored = await getGuestOnboardingAnswers();
  authenticatedOnboardingAnswers = stored;
  return stored;
}

/**
 * Writes back a previously read answer set verbatim, bypassing the merge and
 * mode-switch-clearing rules `saveGuestOnboardingAnswers` applies to a patch.
 * Used only to restore a snapshot taken before an abandoned re-run of
 * onboarding (see lib/onboarding-replay.ts).
 */
export async function restoreGuestOnboardingAnswers(
  answers: GuestOnboardingAnswers
): Promise<void> {
  const next = normaliseAnswers(answers);
  await setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.answers, toStoredAnswers(next));
  authenticatedOnboardingAnswers = next;
}

export async function saveOnboardingAnswers(
  patch: GuestOnboardingAnswersPatch
): Promise<GuestOnboardingAnswers> {
  const next = await saveGuestOnboardingAnswers(definedPatch(patch));
  authenticatedOnboardingAnswers = next;
  authenticatedOnboardingCompletedThisSession = false;
  return next;
}

export async function completeOnboardingAnswers(): Promise<void> {
  if (!hasActiveSession()) {
    await markGuestOnboardingComplete();
    return;
  }

  const answers = await getOnboardingAnswers();
  if (!isGuestOnboardingReady(answers)) {
    console.warn('[onboarding] refusing to submit incomplete local answers');
    throw new Error('Complete each personalisation step before finishing onboarding.');
  }

  await apiClient<{ success: boolean; data: OnboardingSaveResponse }>('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(toModeScopedOnboardingPayload(answers)),
  });
  authenticatedOnboardingCompletedThisSession = true;

  await clearLocalOnboardingAnswersAfterSubmit();

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
    // Bust all home rails so they fetch fresh personalised data when the tabs
    // mount — the same invalidation authenticated users get via completeOnboardingAnswers.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['home'], refetchType: 'none' }),
      queryClient.invalidateQueries({ queryKey: ['library'], refetchType: 'none' }),
    ]).catch(() => undefined);
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
      toStoredAnswers(DEFAULT_GUEST_ONBOARDING_ANSWERS)
    ),
    setGuestOnboardingComplete(false),
    setGuestOnboardingPendingAuth(false),
    setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.migrated, false),
  ]);
}

async function clearLocalOnboardingAnswersAfterSubmit(): Promise<void> {
  await Promise.all([
    setLocalSetting(
      GUEST_ONBOARDING_STORAGE_KEYS.answers,
      toStoredAnswers(DEFAULT_GUEST_ONBOARDING_ANSWERS)
    ),
    setGuestOnboardingComplete(false),
    setGuestOnboardingPendingAuth(false),
    setLocalSetting(GUEST_ONBOARDING_STORAGE_KEYS.migrated, true),
  ]);
  authenticatedOnboardingAnswers = DEFAULT_GUEST_ONBOARDING_ANSWERS;
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

/** Builds the same mode-scoped fields accepted by the guest import controller. */
export function toImportGuestDataPayload(
  answers: GuestOnboardingAnswers
): ImportGuestDataPayload {
  return toModeScopedOnboardingPayload(answers);
}

let migrationInFlight: Promise<ImportGuestDataResult | null> | null = null;

async function performGuestOnboardingMigration(): Promise<ImportGuestDataResult | null> {
  const status = await getGuestOnboardingStatus();

  if (!status.completed || !status.pendingAuth || status.migrated) return null;

  const answers = await getGuestOnboardingAnswers();
  const result = await accountApi.importGuestData(
    toImportGuestDataPayload(answers)
  );
  if (!result.onboarding_applied) {
    throw new Error(
      result.onboarding_note || 'The account did not accept the onboarding answers.'
    );
  }

  // The request above is the commit point. A thrown request leaves every local
  // answer untouched; after success, the account becomes the source of truth.
  try {
    await clearLocalOnboardingAnswersAfterSubmit();
  } catch (error) {
    console.warn('[onboarding] imported, but local answers could not be cleared', error);
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
