import { StyleSheet, Text } from 'react-native';

import { ArticleBody } from '@/components/ArticleBody';
import { SettingsScreen } from '@/components/SettingsScreen';
import { PassageColors } from '@/constants/design';
import { LEGAL_LAST_UPDATED, PRIVACY_POLICY } from '@/constants/legal';
import { AppFonts } from '@/constants/theme';

/** The app renders the Passage-specific copy from `constants/legal.ts`. */
export default function PrivacyPolicyScreen() {
  return (
    <SettingsScreen subtitle={LEGAL_LAST_UPDATED} title="Privacy Policy">
      <Text style={styles.lede}>
        Your privacy matters. This explains what Passage collects, why, and what you can do
        about it.
      </Text>
      <ArticleBody body={PRIVACY_POLICY} />
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  lede: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
});
