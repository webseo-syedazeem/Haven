import { Image, StyleSheet, Text, View } from 'react-native';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon-transparent.webp');

type RelaxStepHeaderProps = {
  /** Retained for compatibility; the client design does not show step progress. */
  currentStep?: number;
  onBack?: () => void;
};

export function RelaxStepHeader({ onBack }: RelaxStepHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        {onBack ? (
          <OnboardingBackButton
            onPress={onBack}
            style={styles.backButtonPosition}
          />
        ) : null}

        <View pointerEvents="none" style={styles.brand}>
          <Image resizeMode="contain" source={brandIcon} style={styles.brandIcon} />
          <Text style={styles.brandText}>Passage</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButtonPosition: {
    left: 0,
    position: 'absolute',
    zIndex: 1,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
brandIcon: {
  height: 40,
  width: 40,
},
  brandText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: RELAX_ONBOARDING.header.brandTextSize,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginLeft: 8,
  },
  header: {
    paddingBottom: 10,
    paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal,
    paddingTop: 8,
    width: '100%',
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: RELAX_ONBOARDING.header.topRowHeight,
    position: 'relative',
    width: '100%',
  },
});
