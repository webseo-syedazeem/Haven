export type BreathingTypeConfig = {
  total_duration_seconds: number;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
};

export const BREATHING_TYPES = {
  'Box Breathing': {
    total_duration_seconds: 304,
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  },
  '4-7-8 Sleep Reset': {
    total_duration_seconds: 247,
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
  },
  'Physiological Sigh': {
    total_duration_seconds: 126,
    inhale: 4,
    hold1: 2,
    exhale: 8,
    hold2: 0,
  },
  'Resonant Breathing': {
    total_duration_seconds: 360,
    inhale: 5,
    hold1: 0,
    exhale: 5,
    hold2: 0,
  },
  'Focus Reset': {
    total_duration_seconds: 182,
    inhale: 4,
    hold1: 4,
    exhale: 6,
    hold2: 0,
  },
  'Morning Lift': {
    total_duration_seconds: 240,
    inhale: 4,
    hold1: 0,
    exhale: 4,
    hold2: 0,
  },
} as const satisfies Record<string, BreathingTypeConfig>;

export type BreathingTypeName = keyof typeof BREATHING_TYPES;

export function formatBreathingDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatBreathingCountdown(remainingSeconds: number): string {
  const safe = Math.max(0, remainingSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function getBreathingPatternText(config: BreathingTypeConfig): string {
  const parts = [`Inhale ${config.inhale}`];
  if (config.hold1 > 0) parts.push(`Hold ${config.hold1}`);
  parts.push(`Exhale ${config.exhale}`);
  if (config.hold2 > 0) parts.push(`Hold ${config.hold2}`);
  return `${parts.join('. ')}.`;
}

export function getBreathingCycleDuration(config: BreathingTypeConfig): number {
  return config.inhale + config.hold1 + config.exhale + config.hold2;
}

export function resolveBreathingTypeName(name: string): BreathingTypeName | null {
  const clean = name.trim().toLowerCase();
  const match = (Object.keys(BREATHING_TYPES) as BreathingTypeName[]).find(
    (type) => type.toLowerCase() === clean,
  );
  return match ?? null;
}

export function getBreathingTypeConfig(name: string): BreathingTypeConfig | null {
  const typeName = resolveBreathingTypeName(name);
  return typeName ? BREATHING_TYPES[typeName] : null;
}

export function getBreathingSessionParams(name: string) {
  const config = getBreathingTypeConfig(name);
  if (!config) {
    return null;
  }

  return {
    inhale: String(config.inhale),
    hold1: String(config.hold1),
    exhale: String(config.exhale),
    hold2: String(config.hold2),
    total: String(config.total_duration_seconds),
  };
}
