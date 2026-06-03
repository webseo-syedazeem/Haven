/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const AppFonts = {
  sansRegular: 'SFPro-400',
  sansMedium: 'SFPro-500',
  sansSemiBold: 'SFPro-500',
  sansBold: 'SFPro-700',
  displayMedium: 'PlayfairDisplay-500',
  displaySemiBold: 'PlayfairDisplay-SemiBold',
  displayBold: 'PlayfairDisplay-700',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = {
  sans: AppFonts.sansRegular,
  serif: AppFonts.displaySemiBold,
  rounded: AppFonts.sansRegular,
  mono: 'monospace',
};
