import { Platform } from 'react-native';

export const wellnessColors = {
  surface: '#E9E9E9',
  heading: '#173F5F',
  text: '#000000',
  white: '#FFFFFF',
  progress: {
    calm: '#63B09E',
    tense: '#FFC107',
    anxious: '#D782C6',
    overwhelmed: '#7B61FF',
    thumbEnd: '#E89600',
  },
  button: {
    left: '#7863DC',
    center: '#528AE1',
    right: '#7863DC',
  },
};

export const wellnessSpacing = {
  screenPadding: 10,
  contentHorizontal: 24,
  titleToProgress: 30,
  progressToMoods: 18,
  moodsToButton: 34,
  bottom: 100,
};

export const wellnessRadius = {
  screen: 22,
  pill: 999,
};

export const wellnessTypography = {
  heading: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 42,
    letterSpacing: 0,
  },
  moodLabel: {
    fontFamily: Platform.select({ ios: 'SF Pro', default: undefined }),
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  button: {
    fontFamily: Platform.select({ ios: 'SF Pro', default: undefined }),
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },
};
