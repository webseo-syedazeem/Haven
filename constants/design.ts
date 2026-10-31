import { AppFonts as ThemeFonts } from '@/constants/theme';

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

// Font families live in `constants/theme.ts` (`AppFonts`), mapped to real loaded
// weight files. The previous `AppFonts` here used family names ('Playfair
// Display', 'SF Pro') that were never registered; it was dead and misleading, so
// it has been removed (audit M-FONT-4). Import `AppFonts` from `@/constants/theme`.

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
 * Passage "black opal" palette — the dark surface used by Home, the mode hubs
 * and the soundscape screens. The lighter `AppColors` set above still belongs
 * to onboarding/auth, so the two live side by side rather than replacing
 * each other.
 */
export const PassageColors = {
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

/** Relax onboarding uses a softer, botanical accent than Focus and Sleep. */
export const RELAX_ACCENT = '#B6E39E';
export const RELAX_ACCENT_PRESSED = '#9FD187';

export const ONBOARDING_MODE_ACCENTS = {
  focus: '#F4B34C',
  sleep: '#9FAEFD',
  relax: RELAX_ACCENT,
} as const;

export const ONBOARDING_MODE_ACCENTS_PRESSED = {
  focus: '#DF9E37',
  sleep: '#8B9DFC',
  relax: RELAX_ACCENT_PRESSED,
} as const;

/** Transparent → near-black, for artwork so overlaid text stays readable. */
export const PassageCardGradient = ['transparent', 'rgba(8,8,10,0.55)', PassageColors.scrim] as const;
export const PassageCardGradientLocations = [0, 0.55, 1] as const;

export const PassageRadius = {
  card: 18,
  artwork: 14,
  sheet: 28,
  pill: 999,
};

/** Shared modal treatment: dim the whole screen and keep sheets visibly raised. */
export const PassageModal = {
  backdrop: 'rgba(3, 5, 6, 0.72)',
} as const;

export const PassageSpacing = {
  screenX: 20,
  section: 28,
  card: 14,
};

/** Height of the custom bottom tab bar, excluding the safe-area inset. */
export const PASSAGE_TAB_BAR_HEIGHT = 62;

/**
 * App-wide typography scale — one Inter family at every step (client
 * requirement: "same font across the app"), with a documented, consistent
 * hierarchy so equivalent roles (an H1 on Home and an H1 on Explore, for
 * example) share the same token instead of a one-off pixel value. Colour is
 * deliberately left out: spread a role into a screen's own styles and add
 * `color` there, so light (onboarding) and dark (main app) surfaces both use
 * the same sizes/weights/line-heights.
 *
 * Sizes follow the client-approved scale. Each step keeps a roughly 1.3–1.4×
 * line-height and tightens letter-spacing slightly as text gets larger, which
 * is what the existing approved screens (40/21/16/13) already did — this
 * extends that same proportion to the steps in between rather than inventing
 * a new rhythm.
 */
export const TypeScale = {
  /** Hero/display: a screen's single biggest moment (e.g. a personalised greeting). */
  display: { fontFamily: ThemeFonts.displaySemiBold, fontSize: 38, letterSpacing: -0.4, lineHeight: 44 },
  /** H1: a screen's own title (Explore, Library, onboarding step titles, …). */
  h1: { fontFamily: ThemeFonts.displayRegular, fontSize: 32, letterSpacing: -0.3, lineHeight: 38 },
  /** H2: a major section heading within a screen. */
  h2: { fontFamily: ThemeFonts.displaySemiBold, fontSize: 24, letterSpacing: -0.2, lineHeight: 30 },
  /** H3: a card/sub-section heading. */
  h3: { fontFamily: ThemeFonts.displayRegular, fontSize: 20, letterSpacing: -0.1, lineHeight: 26 },
  /** H4: a small inline heading (list-group titles, modal titles). */
  h4: { fontFamily: ThemeFonts.sansSemiBold, fontSize: 18, letterSpacing: 0, lineHeight: 24 },
  /** Body Large: a lead paragraph or an onboarding subtitle. */
  bodyLarge: { fontFamily: ThemeFonts.sansRegular, fontSize: 17, letterSpacing: 0, lineHeight: 24 },
  /** Body: default paragraph and control text. */
  body: { fontFamily: ThemeFonts.sansRegular, fontSize: 16, letterSpacing: 0, lineHeight: 24 },
  /** Body Small: secondary paragraph text, list rows. */
  bodySmall: { fontFamily: ThemeFonts.sansRegular, fontSize: 14, letterSpacing: 0, lineHeight: 20 },
  /** Caption: supporting/metadata text under body content. */
  caption: { fontFamily: ThemeFonts.sansRegular, fontSize: 13, letterSpacing: 0, lineHeight: 18 },
  /** Label: the smallest regular user-facing text — buttons, tags, form labels. */
  label: { fontFamily: ThemeFonts.sansMedium, fontSize: 12, letterSpacing: 0.1, lineHeight: 16 },
} as const;

/**
 * Base text styles, taken from the approved onboarding screens and now
 * aligned onto `TypeScale` (`screenHeading` ≈ `display`, `sectionHeading` ≈
 * `h3`, `body` = `body`, `muted` ≈ `caption`). Spread into a StyleSheet entry;
 * per-mode accent colours stay with their own screens. Kept as their own
 * names because many screens already import them by these names.
 */
export const Typography = {
  /** Screen heading: the onboarding title. */
  screenHeading: {
    color: '#FFFFFF',
    fontFamily: ThemeFonts.displayRegular,
    fontSize: 40,
    letterSpacing: -0.3,
    lineHeight: 46,
  },
  /** Section / card heading: same family and colour, scaled down. */
  sectionHeading: {
    color: '#FFFFFF',
    fontFamily: ThemeFonts.displayRegular,
    fontSize: 21,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  /** Body / subtitle: the onboarding subtitle. */
  body: {
    color: '#FFFFFF',
    fontFamily: ThemeFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  /** Muted supporting copy at caption size. */
  muted: {
    color: PassageColors.textSecondary,
    fontFamily: ThemeFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
  },
} as const;
