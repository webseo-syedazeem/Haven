import { StyleSheet, Text } from 'react-native';

import { ArticleBody } from '@/components/ArticleBody';
import { SettingsScreen } from '@/components/SettingsScreen';
import { HalcyonColors } from '@/constants/design';
import { LEGAL_LAST_UPDATED, TERMS_OF_SERVICE } from '@/constants/legal';
import { AppFonts } from '@/constants/theme';

/** Copy lives in `constants/legal.ts` — see the compliance note there. */
export default function TermsScreen() {
  return (
    <SettingsScreen subtitle={LEGAL_LAST_UPDATED} title="Terms of Service">
      <Text style={styles.lede}>
        Passage is free to use. These terms cover what you can expect from us, and what we ask
        of you.
      </Text>
      <ArticleBody body={TERMS_OF_SERVICE} />
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  lede: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
});
