import { StyleSheet } from 'react-native';

import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { AppFonts } from '@/constants/theme';

/**
 * The Terms / Privacy line every sign-in and sign-up screen ends with. Passed to
 * `OnboardingScaffold` as its `footer`, so it sits at the very bottom above the
 * safe-area inset instead of scrolling with the form.
 */
export function AuthLegalFooter() {
  return (
    <LegalDisclaimer linkStyle={styles.link} style={styles.container} textStyle={styles.text} />
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', maxWidth: 320 },
  link: { color: 'rgba(255, 255, 255, 0.86)', textDecorationLine: 'underline' },
  text: {
    color: 'rgba(255, 255, 255, 0.56)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
