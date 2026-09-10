export const AppColors = {
  background: '#0B1F3E',
  overlay: 'rgba(6, 16, 36, 0.54)',
  surface: 'rgba(255, 255, 255, 0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.86)',
  textTertiary: 'rgba(255, 255, 255, 0.72)',
  headlineText: '#173F5F',
  button: '#7D71FF',
  accent: '#C7D8FF',
  link: '#E9F2FF',
};

export const AppFonts = {
  display: 'Playfair Display',
  sans: 'SF Pro',
};

export const AppSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const AppTypography = {
  title: 42,
  subtitle: 18,
  body: 16,
  caption: 14,
};

export const AppRadius = {
  small: 12,
  medium: 20,
  large: 28,
};

export const AppShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.22,
  shadowRadius: 24,
  elevation: 10,
};

/**
 * Halcyon "black opal" palette — the dark surface used by Home, the mode hubs
 * and the soundscape screens. The lighter `AppColors` set above still belongs
 * to onboarding/auth, so the two live side by side rather than replacing
 * each other.
 */
export const HalcyonColors = {
  background: '#0B0B0D',
  surface: '#17161A',
  surfaceRaised: '#1D1C21',
  border: 'rgba(255,255,255,0.07)',
  accent: '#C3A17A',
  accentPressed: '#A8875F',
  textPrimary: '#F1ECE3',
  textSecondary: '#9C978E',
  skeleton: 'rgba(255,255,255,0.06)',
  scrim: 'rgba(8,8,10,0.85)',
} as const;

/** Transparent → near-black, for artwork so overlaid text stays readable. */
export const HalcyonCardGradient = ['transparent', 'rgba(8,8,10,0.55)', HalcyonColors.scrim] as const;
export const HalcyonCardGradientLocations = [0, 0.55, 1] as const;

export const HalcyonRadius = {
  card: 18,
  artwork: 14,
  pill: 999,
};

export const HalcyonSpacing = {
  screenX: 20,
  section: 28,
  card: 14,
};

/** Height of the custom bottom tab bar, excluding the safe-area inset. */
export const HALCYON_TAB_BAR_HEIGHT = 62;
