import type { ModeId } from '@/constants/modes';
import { DURATION_STEP_ENABLED } from '@/constants/onboarding';
import { apiClient } from '@/lib/api/client';
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
export type OnboardingAnswers = {
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

export type OnboardingAnswersPatch = Partial<OnboardingAnswers>;

export type OnboardingAnswersPayload = Pick<
  OnboardingAnswers,
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

export type OnboardingDraftStatus = {
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
  | '/onboarding/relax-your-fit';

export const DEFAULT_ONBOARDING_ANSWERS: OnboardingAnswers = {
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

export const ONBOARDING_RECOMMENDATIONS_QUERY_KEY = [
  'onboarding',
  'recommendations',
] as const;

let authenticatedOnboardingAnswers: OnboardingAnswers = DEFAULT_ONBOARDING_ANSWERS;
let authenticatedOnboardingCompletedThisSession = false;

type OnboardingSaveResponse = {
  onboarding: Record<string, unknown>;
  preferences: Record<string, unknown> | null;
};

function definedPatch(patch: OnboardingAnswersPatch): OnboardingAnswersPatch {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as OnboardingAnswersPatch;
}

function canonicalPatch(
  patch: OnboardingAnswersPatch
): OnboardingAnswersPatch {
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

function toStoredAnswers(answers: OnboardingAnswers): OnboardingAnswersPayload {
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
  answers: OnboardingAnswers
): ModeScopedOnboardingPayload {
  const value = normaliseAnswers(answers);
  if (!isOnboardingReady(value) || !value.mode) {
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

/** Local draft keys. Authenticated completion lives on the server profile. */
export const ONBOARDING_STORAGE_KEYS = {
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

function normaliseAnswers(value: unknown): OnboardingAnswers {
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

export async function getOnboardingDraft(): Promise<OnboardingAnswers> {
  const stored = await getLocalSetting<unknown>(
    ONBOARDING_STORAGE_KEYS.answers,
    DEFAULT_ONBOARDING_ANSWERS
  );
  return normaliseAnswers(stored);
}

/** Required O5-O11 answers, with an empty exclusion list representing None. */
export function isOnboardingReady(
  answers: OnboardingAnswers
): boolean {
  return getIncompleteOnboardingRoute(answers) === null;
}

/** True when this device has at least one persisted data-collection answer. */
export function hasOnboardingProgress(answers: OnboardingAnswers): boolean {
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
  answers: OnboardingAnswers
): OnboardingResumeRoute {
  const value = normaliseAnswers(answers);

  if (!hasOnboardingProgress(value)) return '/why-passage';
  if (!value.mode) return '/select-focus';

  if (value.mode === 'relax') {
    if (!value.main_goal) return '/onboarding/relax-main-goal';
    if (value.relax_causes.length === 0) return '/onboarding/relax-causes';
    if (!value.calming_moments) return '/onboarding/relax-calming-moments';
    return '/onboarding/relax-your-fit';
  }

  if (value.mode_breakers.length === 0) return '/onboarding/situation';
  if (value.mode_areas.length === 0 || (DURATION_STEP_ENABLED && value.target_minutes === null)) {
    return '/onboarding/personalise';
  }
  return '/backed-by-science';
}

export function getIncompleteOnboardingRoute(
  answers: OnboardingAnswers
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
export async function saveOnboardingDraft(
  patch: OnboardingAnswersPatch
): Promise<OnboardingAnswers> {
  const current = await getOnboardingDraft();
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
  await setLocalSetting(ONBOARDING_STORAGE_KEYS.answers, toStoredAnswers(next));
  return next;
}

export async function getOnboardingAnswers(): Promise<OnboardingAnswers> {
  const stored = await getOnboardingDraft();
  authenticatedOnboardingAnswers = stored;
  return stored;
}

/**
 * Writes back a previously read answer set verbatim, bypassing the merge and
 * mode-switch-clearing rules `saveOnboardingAnswers` applies to a patch.
 * Used only to restore a snapshot taken before an abandoned re-run of
 * onboarding (see lib/onboarding-replay.ts).
 */
export async function restoreOnboardingAnswers(
  answers: OnboardingAnswers
): Promise<void> {
  const next = normaliseAnswers(answers);
  await setLocalSetting(ONBOARDING_STORAGE_KEYS.answers, toStoredAnswers(next));
  authenticatedOnboardingAnswers = next;
}

export async function saveOnboardingAnswers(
  patch: OnboardingAnswersPatch
): Promise<OnboardingAnswers> {
  const next = await saveOnboardingDraft(definedPatch(patch));
  authenticatedOnboardingAnswers = next;
  authenticatedOnboardingCompletedThisSession = false;
  return next;
}

export async function completeOnboardingAnswers(): Promise<void> {
  if (!hasActiveSession()) {
    await markOnboardingDraftComplete();
    return;
  }

  const answers = await getOnboardingAnswers();
  if (!isOnboardingReady(answers)) {
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
    await markOnboardingDraftComplete();
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

export async function isOnboardingDraftComplete(): Promise<boolean> {
  const stored =
    (await getLocalSetting(ONBOARDING_STORAGE_KEYS.completed, false)) === true;
  if (!stored) return false;
  return isOnboardingReady(await getOnboardingAnswers());
}

export async function setOnboardingDraftComplete(completed: boolean): Promise<void> {
  await setLocalSetting(ONBOARDING_STORAGE_KEYS.completed, completed);
}

export async function isOnboardingDraftPendingAuth(): Promise<boolean> {
  return (
    (await getLocalSetting(ONBOARDING_STORAGE_KEYS.pendingAuth, false)) === true
  );
}

export async function setOnboardingDraftPendingAuth(pending: boolean): Promise<void> {
  await setLocalSetting(ONBOARDING_STORAGE_KEYS.pendingAuth, pending);
}

export async function hasSubmittedOnboardingDraft(): Promise<boolean> {
  return (
    (await getLocalSetting(ONBOARDING_STORAGE_KEYS.migrated, false)) === true
  );
}

export async function getOnboardingDraftStatus(): Promise<OnboardingDraftStatus> {
  const [completed, pendingAuth, migrated] = await Promise.all([
    isOnboardingDraftComplete(),
    isOnboardingDraftPendingAuth(),
    hasSubmittedOnboardingDraft(),
  ]);
  return { completed, pendingAuth, migrated };
}

/**
 * Called once the guest reaches the end of onboarding. A later successful
 * account authentication can consume the pending migration.
 */
export async function markOnboardingDraftComplete(): Promise<void> {
  const answers = await getOnboardingAnswers();
  if (!isOnboardingReady(answers)) {
    throw new Error(
      'Complete each personalisation step before finishing onboarding.'
    );
  }

  await Promise.all([
    setOnboardingDraftComplete(true),
    setOnboardingDraftPendingAuth(true),
    setLocalSetting(ONBOARDING_STORAGE_KEYS.migrated, false),
  ]);
}

/** Clears local progress, for an explicit restart rather than normal sign-out. */
export async function resetOnboardingDraft(): Promise<void> {
  await Promise.all([
    setLocalSetting(
      ONBOARDING_STORAGE_KEYS.answers,
      toStoredAnswers(DEFAULT_ONBOARDING_ANSWERS)
    ),
    setOnboardingDraftComplete(false),
    setOnboardingDraftPendingAuth(false),
    setLocalSetting(ONBOARDING_STORAGE_KEYS.migrated, false),
  ]);
}

async function clearLocalOnboardingAnswersAfterSubmit(): Promise<void> {
  await Promise.all([
    setLocalSetting(
      ONBOARDING_STORAGE_KEYS.answers,
      toStoredAnswers(DEFAULT_ONBOARDING_ANSWERS)
    ),
    setOnboardingDraftComplete(false),
    setOnboardingDraftPendingAuth(false),
    setLocalSetting(ONBOARDING_STORAGE_KEYS.migrated, true),
  ]);
  authenticatedOnboardingAnswers = DEFAULT_ONBOARDING_ANSWERS;
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

export function isRecommendationExcluded(
  soundscape: Soundscape,
  answers: OnboardingAnswers
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
export function scoreRecommendation(
  soundscape: Soundscape,
  answers: OnboardingAnswers
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
export function rankRecommendations(
  candidates: Soundscape[],
  answers: OnboardingAnswers
): Soundscape[] {
  const seen = new Set<string>();

  return candidates
    .filter((candidate) => {
      if (!candidate.id || !candidate.file_url?.trim() || seen.has(candidate.id)) return false;
      seen.add(candidate.id);
      return !isRecommendationExcluded(candidate, answers);
    })
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreRecommendation(candidate, answers),
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
  answers: OnboardingAnswers,
  alternativesCount: number = DEFAULT_RECOMMENDATION_ALTERNATIVES
): Recommendations {
  assertAlternativesCount(alternativesCount);
  const candidates = [
    ...(publicRecommendations.best_match
      ? [publicRecommendations.best_match]
      : []),
    ...publicRecommendations.alternatives,
  ];
  const ranked = rankRecommendations(candidates, answers);

  return {
    best_match: ranked[0] ?? null,
    alternatives: ranked.slice(1, 1 + alternativesCount),
  };
}

/**
 * Ranks authenticated recommendations using the current onboarding draft.
 */
export async function getDraftRecommendations(
  answers?: OnboardingAnswers,
  alternativesCount: number = DEFAULT_RECOMMENDATION_ALTERNATIVES
): Promise<Recommendations> {
  assertAlternativesCount(alternativesCount);
  const [storedAnswers, publicRecommendations] = await Promise.all([
    answers ? Promise.resolve(normaliseAnswers(answers)) : getOnboardingAnswers(),
    recommendationsApi.get(MAX_RECOMMENDATION_ALTERNATIVES),
  ]);

  return rankPublicRecommendations(
    publicRecommendations,
    storedAnswers,
    alternativesCount
  );
}

export function getOnboardingRecommendationsQueryKey() {
  return ONBOARDING_RECOMMENDATIONS_QUERY_KEY;
}

export async function getOnboardingRecommendations(
  alternativesCount: number = DEFAULT_RECOMMENDATION_ALTERNATIVES
): Promise<Recommendations> {
  return recommendationsApi.get(alternativesCount);
}

/** Submits a complete local draft after authentication, including older installs. */
export async function submitOnboardingDraftAfterAuth(): Promise<void> {
  if (!hasActiveSession()) return;
  const answers = await getOnboardingDraft();
  if (!hasOnboardingProgress(answers) || !isOnboardingReady(answers)) return;
  await completeOnboardingAnswers();
}
