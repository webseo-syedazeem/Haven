/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

/**
 * Font family tokens. Each name maps 1:1 to a statically-registered weight file
 * loaded in `app/_layout.tsx` from the bundled `@expo-google-fonts/inter`
 * package, so a token always renders its own weight without relying on a
 * separate `fontWeight` (audit M-FONT-2).
 *
 * There is exactly ONE font family for the entire app: Inter. The former
 * second (serif) display face — first Cormorant Garamond, then Playfair
 * Display — has been fully retired, including its naming: no token name
 * mentions a second typeface any more, so a plain source search for one comes
 * back empty (client requirement: "same font across the app"). The `display*`
 * names are kept as the token surface most screens already import — they
 * still carry the heading/display *role* (size, weight, letter-spacing
 * applied at the call site) — but now resolve to Inter weights instead of a
 * different family. `displayMediumItalic` resolves to Inter's own italic cut,
 * which keeps the premium onboarding quote-card treatment without a second
 * family.
 */
export const AppFonts = {
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  displayRegular: 'Inter_400Regular',
  displayMedium: 'Inter_500Medium',
  displayMediumItalic: 'Inter_500Medium_Italic',
  displaySemiBold: 'Inter_600SemiBold',
  displayBold: 'Inter_700Bold',
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

