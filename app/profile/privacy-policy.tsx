import { StyleSheet, Text } from 'react-native';

import { ArticleBody } from '@/components/ArticleBody';
import { SettingsScreen } from '@/components/SettingsScreen';
import { HalcyonColors } from '@/constants/design';
import { LEGAL_LAST_UPDATED, PRIVACY_POLICY } from '@/constants/legal';
import { AppFonts } from '@/constants/theme';

/**
 * The copy lives in `constants/legal.ts` — see the compliance note there. The
 * canonical markdown the backend serves at `GET /privacy-policy.md` still
 * describes another product's subscriptions, so it is not rendered here.
 */
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
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 18,
  },
});
