import type { ModeId } from '@/constants/modes';

/**
 * Sleep timer presets per mode, plus how playback should end. One config object
 * so copy or durations change in a single place.
 */
export const UNTIL_I_STOP = 'until_i_stop';

export type TimerSelection = number | typeof UNTIL_I_STOP;

export type TimerPreset = {
  /** Minutes, or the open ended option. */
  value: TimerSelection;
  label: string;
};

export type TimerEnding =
  /** Volume ramps to silence over `fadeSeconds`, then playback stops. Nothing else. */
  | { type: 'fade'; fadeSeconds: number }
  /** Playback stops outright; an optional soft tone can be switched on by the user. */
  | { type: 'silent'; offerEndTone: true };

export type ModeTimerConfig = {
  presets: readonly TimerPreset[];
  ending: TimerEnding;
};

const minutes = (value: number, label: string): TimerPreset => ({ value, label });

const UNTIL_I_STOP_PRESET: TimerPreset = { value: UNTIL_I_STOP, label: 'Until I Stop' };

export const FADE_OUT_SECONDS = 60;

export const MODE_TIMERS: Record<ModeId, ModeTimerConfig> = {
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
    ending: { type: 'silent', offerEndTone: true },
  },
};

/** Focus is the only mode that offers an end tone, and it is off until asked for. */
export const END_TONE_DEFAULT = false;

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
