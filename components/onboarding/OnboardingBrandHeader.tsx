import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');

type OnboardingBrandHeaderProps = {
  onBack?: () => void;
  right?: ReactNode;
  showBack?: boolean;
};

/** One geometrically centred Passage header for every onboarding screen. */
export function OnboardingBrandHeader({
  onBack,
  right,
  showBack = Boolean(onBack),
}: OnboardingBrandHeaderProps) {
  return (
    <View style={styles.header}>
      <View pointerEvents="none" style={styles.brandCenter}>
        <Image resizeMode="contain" source={brandIcon} style={styles.brandIcon} />
        <Text style={styles.brandText}>Passage</Text>
      </View>

      {showBack && onBack ? (
        <OnboardingBackButton onPress={onBack} style={styles.backButton} />
      ) : null}

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    left: 16,
    position: 'absolute',
    top: 2,
    zIndex: 2,
  },
  brandCenter: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  brandIcon: {
    height: 38,
    resizeMode: 'contain',
    width: 58,
  },
  brandText: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: -9,
  },
  header: {
    height: 52,
    position: 'relative',
    width: '100%',
  },
  right: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 2,
    zIndex: 2,
  },
});
