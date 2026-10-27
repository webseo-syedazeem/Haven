import { SHOW_DEV_TIMER_PRESETS } from '@/config/dev-flags';
import type { ModeId } from '@/constants/modes';

/**
 * Sleep timer presets per mode, plus how playback should end. One config object
 * so copy or durations change in a single place.
 */
export const UNTIL_I_STOP = 'until_i_stop';

export const TIMER_MIN_MINUTES = 5;
export const TIMER_MAX_MINUTES = 8 * 60;
export const TIMER_STEP_MINUTES = 5;

export type TimerSelection = number | typeof UNTIL_I_STOP;

export type TimerPreset = {
  /** Minutes, or the open ended option. */
  value: TimerSelection;
  label: string;
};

export type TimerEnding =
  /** Volume ramps to silence over `fadeSeconds`, then playback stops. */
  | { type: 'fade'; fadeSeconds: number }
  /** Playback stops outright and silently. */
  | { type: 'silent' };

export type ModeTimerConfig = {
  presets: readonly TimerPreset[];
  ending: TimerEnding;
};

const minutes = (value: number, label: string): TimerPreset => ({ value, label });

const UNTIL_I_STOP_PRESET: TimerPreset = { value: UNTIL_I_STOP, label: 'Until I Stop' };

const DEV_TIMER_PRESETS: readonly TimerPreset[] = [
  minutes(5, 'Test · 5 min'),
  minutes(10, 'Test · 10 min'),
];

export const FADE_OUT_SECONDS = 60;

/** How long a timer may sit frozen while paused before it is dropped outright. */
export const PAUSED_TIMER_EXPIRY_MS = 30 * 60 * 1000;

const PRODUCTION_MODE_TIMERS: Record<ModeId, ModeTimerConfig> = {
  sleep: {
    presets: [
      minutes(30, '30 min'),
      minutes(60, '1 hr'),
      minutes(120, '2 hr'),
      minutes(240, '4 hr'),
      minutes(480, '8 hr'),
      UNTIL_I_STOP_PRESET,
    ],
    ending: { type: 'fade', fadeSeconds: FADE_OUT_SECONDS },
  },
  relax: {
    presets: [
      minutes(5, '5 min'),
      minutes(10, '10 min'),
      minutes(20, '20 min'),
      minutes(30, '30 min'),
      minutes(60, '60 min'),
      UNTIL_I_STOP_PRESET,
    ],
    ending: { type: 'fade', fadeSeconds: FADE_OUT_SECONDS },
  },
  focus: {
    presets: [
      minutes(25, '25 min'),
      minutes(50, '50 min'),
      minutes(90, '90 min'),
      minutes(120, '2 hr'),
      UNTIL_I_STOP_PRESET,
    ],
    ending: { type: 'fade', fadeSeconds: FADE_OUT_SECONDS },
  },
};

function addMissingDevPresets(
  presets: readonly TimerPreset[],
  includeDevPresets: boolean
): readonly TimerPreset[] {
  if (!includeDevPresets) return presets;

  const existingValues = new Set(presets.map((preset) => preset.value));
  const missingDevPresets = DEV_TIMER_PRESETS.filter(
    (preset) => !existingValues.has(preset.value)
  );
  return missingDevPresets.length > 0 ? [...presets, ...missingDevPresets] : presets;
}

/** Builds the runtime list without ever placing DEV entries in release data. */
export function buildModeTimers(
  includeDevPresets: boolean
): Record<ModeId, ModeTimerConfig> {
  return {
    sleep: {
      ...PRODUCTION_MODE_TIMERS.sleep,
      presets: addMissingDevPresets(
        PRODUCTION_MODE_TIMERS.sleep.presets,
        includeDevPresets
      ),
    },
    relax: {
      ...PRODUCTION_MODE_TIMERS.relax,
      presets: addMissingDevPresets(
        PRODUCTION_MODE_TIMERS.relax.presets,
        includeDevPresets
      ),
    },
    focus: {
      ...PRODUCTION_MODE_TIMERS.focus,
      presets: addMissingDevPresets(
        PRODUCTION_MODE_TIMERS.focus.presets,
        includeDevPresets
      ),
    },
  };
}

export const MODE_TIMERS = buildModeTimers(SHOW_DEV_TIMER_PRESETS);

export function getTimerConfig(mode?: ModeId | string | null): ModeTimerConfig {
  const key = typeof mode === 'string' ? (mode.trim().toLowerCase() as ModeId) : undefined;
  return (key && MODE_TIMERS[key]) || MODE_TIMERS.relax;
}

export function formatTimerLabel(value: TimerSelection | null): string {
  if (value === null) return 'Timer';
  if (value === UNTIL_I_STOP) return 'Until I Stop';
  if (value < 60) return `${value} min`;
  const hours = value / 60;
  return Number.isInteger(hours) ? `${hours} hr` : `${(value / 60).toFixed(1)} hr`;
}

function clockFromSeconds(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = String(safe % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
}

/** Long timers use hours:minutes; short timers keep the seconds countdown. */
export function formatTimerCountdown(seconds: number): string {
  const clock = clockFromSeconds(seconds);
  return seconds >= 3600 ? `${clock.slice(0, -3)} hr` : clock;
}
