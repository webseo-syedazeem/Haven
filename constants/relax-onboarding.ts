/** Visual rhythm shared only by the ten-screen Relax onboarding journey. */
export const RELAX_ONBOARDING = {
  body: {
    fontSize: 17,
    lineHeight: 25,
  },
  button: {
    contentGap: 20,
    height: 60,
  },
  content: {
    paddingBottom: 12,
    paddingTop: 20,
  },
  gaps: {
    bodyToContent: 20,
    eyebrowToHeading: 12,
    headingToBody: 16,
    headingToContent: 24,
    optionRows: 8,
  },
  header: {
    backButtonSize: 36,
    backIconSize: 20,
    brandIconSize: 29,
    brandTextSize: 23,
    topRowHeight: 40,
  },
  heading: {
    fontSize: 40,
    letterSpacing: -0.7,
    lineHeight: 46,
  },
  longHeading: {
    fontSize: 36,
    letterSpacing: -0.55,
    lineHeight: 42,
  },
  optionRow: {
    borderRadius: 18,
    iconSize: 30,
    indicatorSize: 20,
    labelFontSize: 16,
    labelLineHeight: 22,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  screenPaddingHorizontal: 20,
} as const;
