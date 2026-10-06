import type { ImageSourcePropType } from 'react-native';

/**
 * The three listening modes. Every label the UI shows lives here, so renaming
 * "Relax" back to "Reset" (the name used on the reference mockup) is a one line
 * change rather than a hunt through the screens.
 */
export type ModeId = 'focus' | 'sleep' | 'relax';

export type ModeConfig = {
  id: ModeId;
  /** Title as shown on the mode card and hub, already upper cased in the UI. */
  label: string;
  /** One line description under the title. */
  tagline: string;
  /** Longer copy for the mode hub. */
  description: string;
  benefits: { icon: string; label: string }[];
  artwork: ImageSourcePropType;
  /**
   * CSS `object-position` style crop, so the landscape mode card lands on the
   * most atmospheric band of a portrait image instead of the middle.
   */
  artworkPosition?: { top: string; left: string };
  /** Painted under the artwork so the card still reads while the image loads. */
  gradient: readonly [string, string];
  /** Mode-specific accent used for the card border ring and outer glow. */
  ringColor: string;
};

export const MODES: readonly ModeConfig[] = [
  {
    id: 'focus',
    label: 'Focus',
    tagline: 'Deep work and productivity',
    description:
      'Curated soundscapes to help you enter deep focus and stay in your flow.',
    benefits: [
      { icon: 'radio-button-on-outline', label: 'Improve concentration' },
      { icon: 'trending-up-outline', label: 'Boost productivity' },
      { icon: 'notifications-off-outline', label: 'Minimise distractions' },
      { icon: 'infinite-outline', label: 'Sustain deep work' },
    ],
    artwork: require('@/assets/images/focus-mode-card-background.webp'),
    gradient: ['#1B2430', '#0B0B0D'],
    ringColor: 'rgba(200, 165, 122, 0.55)',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    tagline: 'Fall asleep and stay asleep',
    description:
      'Slow, low detail soundscapes that settle the mind and carry you through the night.',
    benefits: [
      { icon: 'moon-outline', label: 'Fall asleep sooner' },
      { icon: 'bed-outline', label: 'Stay asleep longer' },
      { icon: 'volume-low-outline', label: 'Mask background noise' },
      { icon: 'sunny-outline', label: 'Wake up rested' },
    ],
    artwork: require('@/assets/images/sleep-mode-card-background.webp'),
    gradient: ['#101828', '#0B0B0D'],
    ringColor: 'rgba(142, 167, 199, 0.55)',
  },
  {
    id: 'relax',
    label: 'Relax',
    tagline: 'Unwind and let go',
    description:
      'Warm, open soundscapes for winding down, breathing slower and letting the day go.',
    benefits: [
      { icon: 'leaf-outline', label: 'Release tension' },
      { icon: 'heart-outline', label: 'Slow your breathing' },
      { icon: 'water-outline', label: 'Quieten a busy mind' },
      { icon: 'flower-outline', label: 'Unwind anywhere' },
    ],
    artwork: require('@/assets/images/relax-mode-card-background.webp'),
    gradient: ['#241C16', '#0B0B0D'],
    ringColor: 'rgba(107, 191, 123, 0.55)',
  },
] as const;

export const MODE_LABELS: Record<ModeId, string> = {
  focus: 'Focus',
  sleep: 'Sleep',
  relax: 'Relax',
};

export function getModeConfig(mode?: string | null): ModeConfig | undefined {
  if (!mode) return undefined;
  const normalized = mode.trim().toLowerCase();
  return MODES.find((entry) => entry.id === normalized);
}

export function getModeLabel(mode?: string | null): string {
  return getModeConfig(mode)?.label ?? '';
}
