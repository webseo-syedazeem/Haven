import { Image, StyleSheet, Text, View } from 'react-native';

import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const appLogo = require('@/assets/images/passage-brand-assets/screens-icon.webp');

type PassageLogoProps = {
  compact?: boolean;
  showTagline?: boolean;
  showWordmark?: boolean;
};

export function PassageLogo({
  compact = false,
  showTagline = false,
  showWordmark = true,
}: PassageLogoProps) {
      const markSize = compact ? 96 : 122;

  return (
    <View accessibilityLabel="Passage" style={styles.container}>
      <Image
        source={appLogo}
        resizeMode="contain"
        style={{ height: markSize, width: markSize }}
      />

      {showWordmark ? (
        <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}>Passage</Text>
      ) : null}
      {showTagline ? <Text style={styles.tagline}>Sleep  ·  Relax  ·  Focus</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  tagline: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    letterSpacing: 1.1,
    lineHeight: 18,
    marginTop: 8,
  },
  wordmark: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 44,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 50,
    marginTop: 14,
  },
  wordmarkCompact: {
    fontSize: 36,
    lineHeight: 42,
    marginTop: 10,
  },
});